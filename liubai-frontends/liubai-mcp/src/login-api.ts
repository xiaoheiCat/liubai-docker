import { getTime, getTimezone } from "./time.js"

interface LiuRqReturn<T = Record<string, unknown>> {
  code: string
  data?: T
  errMsg?: string
}

function normalizeApiDomain(domain: string): string {
  return domain.endsWith("/") ? domain : `${domain}/`
}

function buildBody(body: Record<string, unknown>): string {
  return JSON.stringify({
    x_liu_language: "zh-CN",
    x_liu_theme: "system",
    x_liu_version: "0.31",
    x_liu_stamp: getTime(),
    x_liu_timezone: getTimezone(),
    x_liu_client: "mcp",
    x_liu_device: "liubai-mcp",
    x_liu_ide_type: "mcp",
    ...body,
  })
}

async function post<T>(
  apiDomain: string,
  operateType: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const url = `${normalizeApiDomain(apiDomain)}user-login`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: buildBody({ operateType, ...body }),
    signal: AbortSignal.timeout(30_000),
  })
  const json = (await res.json()) as LiuRqReturn<T>
  if (json.code !== "0000" || !json.data) {
    throw new Error(json.errMsg ?? `Liubai login API error: ${json.code}`)
  }
  return json.data
}

export interface InitResult {
  publicKey?: string
  state?: string
}

export interface AuthRequestResult {
  credential: string
  baseUrl: string
}

export interface AuthSubmitResult {
  token?: string
  serial_id?: string
  spaceMemberList?: Array<{ spaceType?: string; member_name?: string }>
}

export async function loginInit(apiDomain: string): Promise<InitResult> {
  return post<InitResult>(apiDomain, "init")
}

export async function loginAuthRequest(
  apiDomain: string,
  redirectUri: string,
  state: string,
): Promise<AuthRequestResult> {
  const data = await post<AuthRequestResult>(
    apiDomain,
    "auth_request",
    { redirect_uri: redirectUri, state },
  )
  if (!data.credential || !data.baseUrl) {
    throw new Error("auth_request did not return credential/baseUrl")
  }
  return { credential: data.credential, baseUrl: data.baseUrl }
}

export async function loginAuthSubmit(
  apiDomain: string,
  credential: string,
  code: string,
  encClientKey: string,
): Promise<AuthSubmitResult> {
  return post<AuthSubmitResult>(apiDomain, "auth_submit", {
    credential,
    code,
    enc_client_key: encClientKey,
  })
}
