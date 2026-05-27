const DEFAULT_METHODS = "GET, POST, PUT, DELETE, OPTIONS"
const DEFAULT_HEADERS =
  "Content-Type, Authorization, X-Requested-With, x-liu-debug-key, x-laf-trigger-token"

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "")
}

function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>()
  const domain = process.env.LIU_DOMAIN?.trim()
  if (domain) {
    allowed.add(normalizeOrigin(domain))
  }
  const extra = process.env.LIU_CORS_ORIGINS?.trim()
  if (extra) {
    for (const item of extra.split(",")) {
      const origin = item.trim()
      if (origin) {
        allowed.add(normalizeOrigin(origin))
      }
    }
  }
  return allowed
}

export function resolveCorsOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) {
    return null
  }

  const allowed = getAllowedOrigins()
  const normalized = normalizeOrigin(requestOrigin)

  if (allowed.size === 0) {
    return requestOrigin
  }

  return allowed.has(normalized) ? requestOrigin : null
}

function buildCorsHeaders(origin: string, isPreflight = false): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": DEFAULT_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_HEADERS,
    "Vary": "Origin",
  }

  if (isPreflight) {
    headers["Access-Control-Max-Age"] = "86400"
  }

  return headers
}

export function corsPreflightResponse(req: Request): Response | null {
  if (req.method !== "OPTIONS") {
    return null
  }

  const origin = resolveCorsOrigin(req.headers.get("Origin"))
  if (!origin) {
    return new Response(null, { status: 403 })
  }

  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(origin, true),
  })
}

export function withCors(response: Response, req: Request): Response {
  const origin = resolveCorsOrigin(req.headers.get("Origin"))
  if (!origin) {
    return response
  }

  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(buildCorsHeaders(origin))) {
    headers.set(name, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
