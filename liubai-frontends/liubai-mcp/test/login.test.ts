import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  LiubaiClient,
  LOGIN_REQUIRED_MESSAGE,
} from "../src/client.js"
import type { LiubaiMcpConfig } from "../src/config.js"
import {
  getCredentialsPath,
  loadStoredCredentials,
  saveStoredCredentials,
  type StoredCredentials,
} from "../src/credentials.js"
import { LoginManager } from "../src/login.js"
import { handleToolCall } from "../src/server.js"
import { tools } from "../src/tools.js"

const LOGIN_GUIDE =
  "请要求用户打开该链接完成授权，完成后页面会跳转到无法打开的 http://127.0.0.1:xxx，请要求用户复制浏览器地址栏完整链接并发送给你，并调用 login_finish 完成登录。"

const config: LiubaiMcpConfig = {
  apiDomain: "http://liubai.test/",
  assistantName: "AI 助手",
  messageFormat: "markdown",
}

const originalEnv = {
  home: process.env.HOME,
  configDir: process.env.LIUBAI_MCP_CONFIG_DIR,
  apiDomain: process.env.LIUBAI_API_DOMAIN,
  token: process.env.LIUBAI_TOKEN,
  serial: process.env.LIUBAI_SERIAL,
}
let testHome: string

beforeAll(() => {
  testHome = mkdtempSync(path.join(tmpdir(), "liubai-mcp-test-"))
  process.env.HOME = testHome
  process.env.LIUBAI_MCP_CONFIG_DIR = path.join(
    testHome,
    ".config",
    "liubai-mcp",
  )
  delete process.env.LIUBAI_API_DOMAIN
  delete process.env.LIUBAI_TOKEN
  delete process.env.LIUBAI_SERIAL
})

afterAll(() => {
  restoreEnv("HOME", originalEnv.home)
  restoreEnv("LIUBAI_MCP_CONFIG_DIR", originalEnv.configDir)
  restoreEnv("LIUBAI_API_DOMAIN", originalEnv.apiDomain)
  restoreEnv("LIUBAI_TOKEN", originalEnv.token)
  restoreEnv("LIUBAI_SERIAL", originalEnv.serial)
  rmSync(testHome, { recursive: true, force: true })
})

test("login_start 和 login_finish 完成两段式登录", async () => {
  let saved: StoredCredentials | undefined
  let redirectUri = ""
  const login = new LoginManager(config, {
    calibrateTime: async (apiDomain) => {
      expect(apiDomain).toBe("http://liubai.test/")
    },
    createClientKey: async () => ({ aesKey: "mock-aes", cipher: "mock-cipher" }),
    getCredentialsPath: () => "/mock/credential.json",
    getTime: () => 123456,
    loadStoredCredentials: () => undefined,
    loginInit: async () => ({ publicKey: "mock-public-key", state: "mock-state" }),
    loginAuthRequest: async (_apiDomain, callback, state) => {
      redirectUri = callback
      expect(state).toBe("mock-state")
      return {
        credential: "mock-credential",
        baseUrl: "https://liubai.example/",
      }
    },
    loginAuthSubmit: async (_apiDomain, credential, code, encClientKey) => {
      expect(credential).toBe("mock-credential")
      expect(code).toBe("mock-code")
      expect(encClientKey).toBe("mock-cipher")
      return {
        token: "t".repeat(40),
        serial_id: "mock-serial",
        spaceMemberList: [{ spaceType: "ME", member_name: "测试账号" }],
      }
    },
    randomPort: () => 54321,
    saveStoredCredentials: (credentials) => {
      saved = credentials
    },
  })

  const started = await login.start()
  expect(started).toBe(
    "https://liubai.example/authorize?credential=mock-credential&state=mock-state" +
      `\n${LOGIN_GUIDE}`,
  )
  expect(redirectUri).toBe("http://127.0.0.1:54321/callback")

  await expect(
    login.finish(`${redirectUri}?code=mock-code&state=wrong-state`),
  ).rejects.toThrow("回调链接中的 state 无效")

  const finished = await login.finish(
    `${redirectUri}?code=mock-code&state=mock-state`,
  )
  expect(finished).toBe(
    "登录成功，账号：测试账号，凭据已保存到 /mock/credential.json。",
  )
  expect(saved).toEqual({
    apiDomain: "http://liubai.test/",
    token: "t".repeat(40),
    serial: "mock-serial",
    updatedStamp: 123456,
    nickname: "测试账号",
  })
})

test("MCP 暴露登录工具，未登录和登录失效返回统一提示", async () => {
  expect(tools.map((tool) => tool.name)).toContain("login_start")
  expect(tools.map((tool) => tool.name)).toContain("login_finish")

  const login = new LoginManager(config)
  let credentials: StoredCredentials | undefined
  let invalidateLogin = false
  const client = new LiubaiClient(
    config,
    () => credentials,
    (async () => invalidateLogin
      ? Response.json({
          code: "E4003",
          errMsg: "the verification of token failed",
        })
      : Response.json({
          code: "0000",
          data: { operateType: "mcp-health", ok: true },
        })) as typeof fetch,
  )
  const loggedOut = await handleToolCall(
    client,
    login,
    "liubai_health",
  )
  expect(loggedOut).toEqual({
    content: [{ type: "text", text: LOGIN_REQUIRED_MESSAGE }],
    isError: true,
  })

  credentials = {
    apiDomain: "http://liubai.test/",
    token: "t".repeat(40),
    serial: "mock-serial",
    updatedStamp: 123456,
  }
  const afterLogin = await handleToolCall(client, login, "liubai_health")
  expect(afterLogin.isError).not.toBe(true)

  invalidateLogin = true
  const invalid = await handleToolCall(client, login, "liubai_health")
  expect(invalid).toEqual({
    content: [{ type: "text", text: LOGIN_REQUIRED_MESSAGE }],
    isError: true,
  })
})

test("凭据写入 credential.json 并保持 600 权限", () => {
  const credentials: StoredCredentials = {
    apiDomain: "http://liubai.test/",
    token: "t".repeat(40),
    serial: "mock-serial",
    updatedStamp: 123456,
  }
  saveStoredCredentials(credentials)

  expect(getCredentialsPath()).toBe(
    path.join(testHome, ".config", "liubai-mcp", "credential.json"),
  )
  expect(JSON.parse(readFileSync(getCredentialsPath(), "utf8"))).toEqual(credentials)
  expect(statSync(getCredentialsPath()).mode & 0o777).toBe(0o600)
  expect(loadStoredCredentials()).toEqual(credentials)
})

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}
