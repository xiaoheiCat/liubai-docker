import type { LiubaiMcpConfig } from "./config.js"
import { buildXLiuBody } from "./x-liu-body.js"

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
  private readonly url: string

  constructor(private readonly config: LiubaiMcpConfig) {
    this.url = `${config.apiDomain}liubai-mcp`
  }

  async call<T extends Record<string, unknown>>(
    operateType: McpOperateType,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const body = buildXLiuBody({
      operateType,
      x_liu_token: this.config.token,
      x_liu_serial: this.config.serial,
      ...params,
    })

    let res: Response
    try {
      res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to reach Liubai backend at ${this.url}: ${msg}`)
    }

    let json: LiuRqReturn<T>
    try {
      json = (await res.json()) as LiuRqReturn<T>
    } catch {
      throw new Error(`Invalid JSON response from Liubai (HTTP ${res.status})`)
    }

    if (json.code !== "0000" || !json.data) {
      throw new Error(json.errMsg ?? `Liubai API error: ${json.code}`)
    }

    return json.data
  }
}
