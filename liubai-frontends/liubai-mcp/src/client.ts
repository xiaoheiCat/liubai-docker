import type { LiubaiMcpConfig } from "./config.js"
import { loadStoredCredentials } from "./credentials.js"
import { buildXLiuBody } from "./x-liu-body.js"

export const LOGIN_REQUIRED_MESSAGE =
  "未登录/登录态失效，请使用 login_start 开始一个新的登录。"

export class LoginRequiredError extends Error {
  constructor() {
    super(LOGIN_REQUIRED_MESSAGE)
    this.name = "LoginRequiredError"
  }
}

export type McpOperateType =
  | "mcp-health"
  | "mcp-add-note"
  | "mcp-add-todo"
  | "mcp-add-calendar"
  | "mcp-get-pending"
  | "mcp-get-schedule"
  | "mcp-get-cards"

interface LiuRqReturn<T = Record<string, unknown>> {
  code: string
  data?: T
  errMsg?: string
}

export class LiubaiClient {
  constructor(
    private readonly config: LiubaiMcpConfig,
    private readonly credentialLoader = loadStoredCredentials,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async call<T extends Record<string, unknown>>(
    operateType: McpOperateType,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const credentials = this.resolveCredentials()
    if (!credentials) throw new LoginRequiredError()

    const url = `${credentials.apiDomain}liubai-mcp`
    const body = buildXLiuBody({
      operateType,
      x_liu_token: credentials.token,
      x_liu_serial: credentials.serial,
      ...params,
    })

    let res: Response
    try {
      res = await this.fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to reach Liubai backend at ${url}: ${msg}`)
    }

    let json: LiuRqReturn<T>
    try {
      json = (await res.json()) as LiuRqReturn<T>
    } catch {
      throw new Error(`Invalid JSON response from Liubai (HTTP ${res.status})`)
    }

    if (
      json.code === "E4003" &&
      json.errMsg === "the verification of token failed"
    ) {
      throw new LoginRequiredError()
    }

    if (json.code !== "0000" || !json.data) {
      const detail = json.errMsg ? `: ${json.errMsg}` : ""
      throw new Error(`Liubai API error ${json.code}${detail}`)
    }

    return json.data
  }

  private resolveCredentials() {
    const stored = this.credentialLoader()
    const apiDomain = (
      process.env.LIUBAI_API_DOMAIN?.trim() ||
      stored?.apiDomain ||
      this.config.apiDomain ||
      ""
    ).trim()
    const token = (process.env.LIUBAI_TOKEN?.trim() || stored?.token || "").trim()
    const serial = (process.env.LIUBAI_SERIAL?.trim() || stored?.serial || "").trim()
    if (!apiDomain || token.length < 32 || !serial) return

    return {
      apiDomain: apiDomain.endsWith("/") ? apiDomain : `${apiDomain}/`,
      token,
      serial,
    }
  }
}
