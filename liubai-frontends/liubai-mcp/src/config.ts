import { loadStoredCredentials } from "./credentials.js"

export interface LiubaiMcpConfig {
  apiDomain: string
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
  return {
    apiDomain: apiDomain ? normalizeApiDomain(apiDomain) : "",
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
