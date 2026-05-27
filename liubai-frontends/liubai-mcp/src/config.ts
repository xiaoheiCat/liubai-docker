import { loadStoredCredentials } from "./credentials.js"

export interface LiubaiMcpConfig {
  apiDomain: string
  token: string
  serial: string
  assistantName: string
  messageFormat: "markdown" | "plain"
}

export function loadConfig(): LiubaiMcpConfig {
  const stored = loadStoredCredentials()
  const apiDomain = (
    process.env.LIUBAI_API_DOMAIN?.trim() ||
    stored?.apiDomain ||
    ""
  ).trim()
  const token = (process.env.LIUBAI_TOKEN?.trim() || stored?.token || "").trim()
  const serial = (process.env.LIUBAI_SERIAL?.trim() || stored?.serial || "").trim()

  const missing: string[] = []
  if (!apiDomain) missing.push("LIUBAI_API_DOMAIN")
  if (!token) missing.push("LIUBAI_TOKEN")
  if (!serial) missing.push("LIUBAI_SERIAL")

  if (missing.length > 0) {
    throw new Error(
      `Missing credentials: ${missing.join(", ")}. ` +
        "Run `npm run login -- --api-domain http://localhost:9000/` first, " +
        "or see liubai-mcp/installation/SKILL.md.",
    )
  }

  return {
    apiDomain: normalizeApiDomain(apiDomain),
    token,
    serial,
    assistantName: getAssistantName(),
    messageFormat: getMessageFormat(),
  }
}

export function getAssistantName(): string {
  const name = process.env.LIUBAI_ASSISTANT_NAME?.trim()
  return name || "AI 助手"
}

export function getMessageFormat(): "markdown" | "plain" {
  const v = process.env.LIUBAI_MCP_MESSAGE_FORMAT?.trim().toLowerCase()
  if (v === "plain" || v === "text") return "plain"
  return "markdown"
}

function normalizeApiDomain(domain: string): string {
  let d = domain
  if (!d.endsWith("/")) d += "/"
  return d
}
