import { randomInt } from "node:crypto"
import type { LiubaiMcpConfig } from "./config.js"
import {
  getCredentialsPath,
  loadStoredCredentials,
  saveStoredCredentials,
} from "./credentials.js"
import { createClientKey } from "./crypto.js"
import {
  loginAuthRequest,
  loginAuthSubmit,
  loginInit,
} from "./login-api.js"
import { calibrateTime, getTime } from "./time.js"

const LOGIN_START_GUIDE =
  "请要求用户打开该链接完成授权，完成后页面会跳转到无法打开的 http://127.0.0.1:xxx，请要求用户复制浏览器地址栏完整链接并发送给你，并调用 login_finish 完成登录。"

interface PendingLogin {
  apiDomain: string
  credential: string
  encClientKey: string
  redirectUri: string
  state: string
}

export interface LoginManagerDependencies {
  calibrateTime: typeof calibrateTime
  createClientKey: typeof createClientKey
  getCredentialsPath: typeof getCredentialsPath
  getTime: typeof getTime
  loadStoredCredentials: typeof loadStoredCredentials
  loginAuthRequest: typeof loginAuthRequest
  loginAuthSubmit: typeof loginAuthSubmit
  loginInit: typeof loginInit
  randomPort: () => number
  saveStoredCredentials: typeof saveStoredCredentials
}

const defaultDependencies: LoginManagerDependencies = {
  calibrateTime,
  createClientKey,
  getCredentialsPath,
  getTime,
  loadStoredCredentials,
  loginAuthRequest,
  loginAuthSubmit,
  loginInit,
  randomPort: () => randomInt(49152, 65536),
  saveStoredCredentials,
}

export class LoginManager {
  private pending?: PendingLogin
  private readonly dependencies: LoginManagerDependencies

  constructor(
    private readonly config: LiubaiMcpConfig,
    dependencies: Partial<LoginManagerDependencies> = {},
  ) {
    this.dependencies = { ...defaultDependencies, ...dependencies }
  }

  async start(apiDomainInput?: string): Promise<string> {
    const apiDomain = this.resolveApiDomain(apiDomainInput)
    await this.dependencies.calibrateTime(apiDomain)

    const initRes = await this.dependencies.loginInit(apiDomain)
    const { publicKey, state } = initRes
    if (!publicKey || !state) {
      throw new Error("user-login init did not return publicKey/state")
    }

    const { cipher } = await this.dependencies.createClientKey(publicKey)
    if (!cipher) throw new Error("Failed to create client encryption key")

    const port = this.dependencies.randomPort()
    const redirectUri = `http://127.0.0.1:${port}/callback`
    const authReq = await this.dependencies.loginAuthRequest(
      apiDomain,
      redirectUri,
      state,
    )
    const authUrl = new URL("/authorize", authReq.baseUrl)
    authUrl.searchParams.set("credential", authReq.credential)
    authUrl.searchParams.set("state", state)

    this.pending = {
      apiDomain,
      credential: authReq.credential,
      encClientKey: cipher,
      redirectUri,
      state,
    }

    return `${authUrl.toString()}\n${LOGIN_START_GUIDE}`
  }

  async finish(callbackUrlInput: string): Promise<string> {
    const pending = this.pending
    if (!pending) {
      throw new Error("没有待完成的登录，请先调用 login_start。")
    }

    const callbackUrl = this.parseCallbackUrl(callbackUrlInput, pending)
    const code = callbackUrl.searchParams.get("code")
    if (!code) throw new Error("回调链接缺少 code。")

    const submitRes = await this.dependencies.loginAuthSubmit(
      pending.apiDomain,
      pending.credential,
      code,
      pending.encClientKey,
    )
    const token = submitRes.token
    const serial = submitRes.serial_id
    if (!token || !serial) {
      throw new Error("auth_submit did not return token/serial_id")
    }

    const nickname = submitRes.spaceMemberList?.find(
      (item) => item.spaceType === "ME",
    )?.member_name

    this.dependencies.saveStoredCredentials({
      apiDomain: pending.apiDomain,
      token,
      serial,
      updatedStamp: this.dependencies.getTime(),
      nickname,
    })
    this.pending = undefined

    const account = nickname ? `，账号：${nickname}` : ""
    return `登录成功${account}，凭据已保存到 ${this.dependencies.getCredentialsPath()}。`
  }

  private resolveApiDomain(apiDomainInput?: string): string {
    const stored = this.dependencies.loadStoredCredentials()
    const apiDomain = (
      apiDomainInput?.trim() ||
      process.env.LIUBAI_API_DOMAIN?.trim() ||
      stored?.apiDomain ||
      this.config.apiDomain ||
      ""
    ).trim()
    if (!apiDomain) {
      throw new Error(
        "缺少 Liubai API 地址，请在 login_start 的 apiDomain 参数中传入。",
      )
    }
    return apiDomain.endsWith("/") ? apiDomain : `${apiDomain}/`
  }

  private parseCallbackUrl(
    callbackUrlInput: string,
    pending: PendingLogin,
  ): URL {
    let callbackUrl: URL
    try {
      callbackUrl = new URL(callbackUrlInput.trim())
    } catch {
      throw new Error("回调链接格式无效，请提供浏览器地址栏中的完整链接。")
    }

    const expected = new URL(pending.redirectUri)
    if (
      callbackUrl.protocol !== expected.protocol ||
      callbackUrl.hostname !== expected.hostname ||
      callbackUrl.port !== expected.port ||
      callbackUrl.pathname !== expected.pathname
    ) {
      throw new Error("回调链接与当前登录请求不匹配，请重新复制完整链接。")
    }

    if (callbackUrl.searchParams.get("state") !== pending.state) {
      throw new Error("回调链接中的 state 无效，请重新调用 login_start。")
    }
    return callbackUrl
  }
}
