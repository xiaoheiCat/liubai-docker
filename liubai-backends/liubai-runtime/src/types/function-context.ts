import type { IncomingHttpHeaders } from "node:http"

export interface FunctionContext {
  files?: unknown[]
  headers?: IncomingHttpHeaders
  query?: Record<string, unknown>
  body?: unknown
  params?: Record<string, unknown>
  auth?: unknown
  user?: unknown
  requestId?: string
  method?: string
  request?: LafRequest
  response?: LafResponse
  __function_name?: string
  [key: string]: unknown
}

export interface LafRequest {
  path?: string
  body?: unknown
  headers?: IncomingHttpHeaders
  method?: string
  query?: Record<string, unknown>
}

export interface LafResponse {
  status(code: number): LafResponse
  send(data: unknown): void
  setHeader?(name: string, value: string): LafResponse
}

export interface HandlerResult {
  status: number
  headers: Record<string, string>
  body: unknown
}
