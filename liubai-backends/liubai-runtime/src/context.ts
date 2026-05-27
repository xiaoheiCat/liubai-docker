import xml2js from "xml2js"
import type { FunctionContext, HandlerResult, LafRequest, LafResponse } from "./types/function-context.ts"

const xmlParser = new xml2js.Parser({
  explicitArray: true,
  trim: true,
})

async function parseRequestBody(req: Request, contentType: string): Promise<unknown> {
  const text = await req.text()
  if (!text) return {}

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }

  if (contentType.includes("xml") || text.trimStart().startsWith("<")) {
    try {
      return await xmlParser.parseStringPromise(text)
    } catch {
      return text
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function createFunctionContext(
  req: Request,
  funcName: string,
): Promise<{ ctx: FunctionContext; getResult: () => HandlerResult }> {
  const url = new URL(req.url)
  const query: Record<string, unknown> = {}
  url.searchParams.forEach((value, key) => {
    query[key] = value
  })

  const contentType = req.headers.get("content-type") ?? ""
  const body = await parseRequestBody(req, contentType)

  const headers: Record<string, string | string[] | undefined> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  let status = 200
  const responseHeaders: Record<string, string> = {}
  let responseSent: unknown = undefined
  let responseHandled = false

  const response: LafResponse = {
    status(code: number) {
      status = code
      return response
    },
    send(data: unknown) {
      responseSent = data
      responseHandled = true
    },
    setHeader(name: string, value: string) {
      responseHeaders[name] = value
      return response
    },
  }

  const lafRequest: LafRequest = {
    path: `/${funcName}`,
    body,
    headers,
    method: req.method,
    query,
  }

  const ctx: FunctionContext = {
    headers,
    query,
    body,
    method: req.method,
    request: lafRequest,
    response,
    __function_name: funcName,
  }

  return {
    ctx,
    getResult() {
      if (responseHandled) {
        return {
          status,
          headers: { "Content-Type": "application/json", ...responseHeaders },
          body: responseSent,
        }
      }
      return {
        status,
        headers: responseHeaders,
        body: undefined,
      }
    },
  }
}

export function buildHttpResponse(
  result: unknown,
  handlerResult: HandlerResult,
): Response {
  const { status, headers: extraHeaders } = handlerResult

  if (handlerResult.body !== undefined) {
    const h = new Headers(extraHeaders)
    if (!h.has("Content-Type")) {
      h.set("Content-Type", "application/json")
    }
    const body =
      typeof handlerResult.body === "string"
        ? handlerResult.body
        : JSON.stringify(handlerResult.body)
    return new Response(body, { status, headers: h })
  }

  if (typeof result === "string") {
    const h = new Headers(extraHeaders)
    if (!h.has("Content-Type")) {
      h.set("Content-Type", "text/plain; charset=utf-8")
    }
    return new Response(result, { status, headers: h })
  }

  const h = new Headers({ "Content-Type": "application/json", ...extraHeaders })
  return new Response(JSON.stringify(result ?? {}), { status, headers: h })
}
