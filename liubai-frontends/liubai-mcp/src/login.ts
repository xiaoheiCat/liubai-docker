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

/** Returns true if a browser was launched; false if unavailable or failed. */
async function tryOpenBrowser(url: string): Promise<boolean> {
  try {
    const platform = process.platform
    if (platform === "darwin") {
      await execFileAsync("open", [url])
      return true
    }
    if (platform === "win32") {
      await execFileAsync("cmd", ["/c", "start", "", url])
      return true
    }
    await execFileAsync("xdg-open", [url])
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`无法自动打开浏览器（${msg}），已跳过。`)
    return false
  }
}

function printRemoteAuthGuide(authUrl: string, redirectUri: string) {
  console.log("")
  console.log("=== 无本地浏览器 / 远程授权 ===")
  console.log("")
  console.log("当前环境可能无法打开浏览器。请在另一台有浏览器的设备上打开以下授权链接：")
  console.log("")
  console.log(authUrl)
  console.log("")
  console.log("授权完成后，浏览器会跳转到本机回调地址并显示「无法打开此网页」，这是正常现象。")
  console.log("请复制地址栏中的完整链接（形如）：")
  console.log(`${redirectUri}?code=...&state=...`)
  console.log("")
  console.log("回到运行 login 的本机，执行：")
  console.log('  curl "<完整链接>"')
  console.log("")
  console.log("若由 AI 协助安装：把完整链接发给 AI，让 AI 在本机终端执行上述 curl。")
  console.log("login 进程须保持运行，直到 curl 成功或终端显示 Login successful。")
  console.log("")
}

function startCallbackServer(expectedState: string) {
  const server = http.createServer()
  let port = 0
  let settled = false

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
          res.end(
            "OAuth callback invalid (missing code or state mismatch). " +
              "Check the URL and retry curl on the machine running login.",
          )
          console.warn("收到无效回调，仍在等待正确的 callback URL……")
          return
        }

        if (settled) {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
          res.end("Already authorized.")
          return
        }
        settled = true

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(
          "<!DOCTYPE html><html><body><p>Liubai MCP 登录成功，可以关闭此页面。</p></body></html>",
        )
        server.close(() => resolve(gotCode))
      } catch (err) {
        if (!settled) {
          settled = true
          reject(err instanceof Error ? err : new Error(String(err)))
        }
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
    getRedirectUri: () => `http://127.0.0.1:${port}/callback`,
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
  const redirectUri = callback.getRedirectUri()

  const authReq = await loginAuthRequest(apiDomain, redirectUri, state)
  const authUrl = new URL("/authorize", authReq.baseUrl)
  authUrl.searchParams.set("credential", authReq.credential)
  authUrl.searchParams.set("state", state)
  const authUrlStr = authUrl.toString()

  console.log("")
  console.log("授权链接：")
  console.log(authUrlStr)
  console.log("")
  console.log(`本机回调地址：${redirectUri}`)
  console.log("")

  const opened = await tryOpenBrowser(authUrlStr)
  if (opened) {
    console.log("已在本地尝试打开浏览器，请在页面中完成登录并授权。")
  } else {
    printRemoteAuthGuide(authUrlStr, redirectUri)
  }

  console.log("等待授权完成（可在本机用 curl 访问 callback URL）……")
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
