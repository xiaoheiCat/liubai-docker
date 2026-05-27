#!/usr/bin/env node

import http from "node:http"
import type { AddressInfo } from "node:net"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { createClientKey } from "./crypto.js"
import { getCredentialsPath, saveStoredCredentials } from "./credentials.js"
import { calibrateTime, getTime } from "./time.js"
import {
  loginAuthRequest,
  loginAuthSubmit,
  loginInit,
} from "./login-api.js"

const execFileAsync = promisify(execFile)

function normalizeApiDomain(domain: string): string {
  return domain.endsWith("/") ? domain : `${domain}/`
}

function parseApiDomain(args: string[]): string | undefined {
  const idx = args.indexOf("--api-domain")
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  return process.env.LIUBAI_API_DOMAIN?.trim()
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform
  if (platform === "darwin") {
    await execFileAsync("open", [url])
    return
  }
  if (platform === "win32") {
    await execFileAsync("cmd", ["/c", "start", "", url])
    return
  }
  await execFileAsync("xdg-open", [url])
}

function startCallbackServer(expectedState: string) {
  const server = http.createServer()
  let port = 0

  const codePromise = new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      try {
        const host = req.headers.host ?? `127.0.0.1:${port}`
        const url = new URL(req.url ?? "/", `http://${host}`)
        if (url.pathname !== "/callback") {
          res.writeHead(404)
          res.end("Not found")
          return
        }

        const gotCode = url.searchParams.get("code")
        const gotState = url.searchParams.get("state")
        if (!gotCode || gotState !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" })
          res.end("Invalid OAuth callback")
          reject(new Error("OAuth callback invalid or state mismatch"))
          server.close()
          return
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(
          "<!DOCTYPE html><html><body><p>Liubai MCP 登录成功，可以关闭此页面。</p></body></html>",
        )
        server.close(() => resolve(gotCode))
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
        server.close()
      }
    })
  })

  const ready = new Promise<void>((resolve, reject) => {
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo
      port = addr.port
      resolve()
    })
  })

  return {
    ready,
    getPort: () => port,
    waitForCode: () => codePromise,
  }
}

export async function runLogin(apiDomainInput?: string): Promise<void> {
  const apiDomainRaw = apiDomainInput?.trim()
  if (!apiDomainRaw) {
    throw new Error(
      "Missing API domain. Pass --api-domain http://localhost:9000/ or set LIUBAI_API_DOMAIN.",
    )
  }
  const apiDomain = normalizeApiDomain(apiDomainRaw)

  console.log("Calibrating time...")
  await calibrateTime(apiDomain)

  console.log("Initializing login...")
  const initRes = await loginInit(apiDomain)
  const publicKey = initRes.publicKey
  const state = initRes.state
  if (!publicKey || !state) {
    throw new Error("user-login init did not return publicKey/state")
  }

  const { aesKey, cipher } = await createClientKey(publicKey)
  if (!aesKey || !cipher) {
    throw new Error("Failed to create client encryption key")
  }

  const callback = startCallbackServer(state)
  await callback.ready
  const redirectUri = `http://127.0.0.1:${callback.getPort()}/callback`

  const authReq = await loginAuthRequest(apiDomain, redirectUri, state)
  const authUrl = new URL("/authorize", authReq.baseUrl)
  authUrl.searchParams.set("credential", authReq.credential)
  authUrl.searchParams.set("state", state)

  console.log("")
  console.log("Opening browser for authorization...")
  console.log(`If the browser does not open, visit:\n${authUrl.toString()}`)
  console.log("")

  await openBrowser(authUrl.toString())

  console.log("Waiting for authorization in browser...")
  const code = await callback.waitForCode()

  console.log("Submitting authorization code...")
  const submitRes = await loginAuthSubmit(apiDomain, authReq.credential, code, cipher)
  const token = submitRes.token
  const serial = submitRes.serial_id
  if (!token || !serial) {
    throw new Error("auth_submit did not return token/serial_id")
  }

  const nickname = submitRes.spaceMemberList?.find((v) => v.spaceType === "ME")?.member_name

  saveStoredCredentials({
    apiDomain,
    token,
    serial,
    updatedStamp: getTime(),
    nickname,
  })

  console.log("")
  console.log("Login successful.")
  if (nickname) console.log(`Account: ${nickname}`)
  console.log(`Credentials saved to ${getCredentialsPath()}`)
  console.log("")
  console.log("You can now start the MCP server (token/serial load from that file automatically).")
}

async function main() {
  const apiDomain = parseApiDomain(process.argv.slice(2))
  await runLogin(apiDomain)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
