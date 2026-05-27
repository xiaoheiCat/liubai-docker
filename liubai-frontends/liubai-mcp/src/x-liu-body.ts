import { getTime, getTimezone } from "./time.js"

export const LIUBAI_MCP_VERSION = "0.31"

/** Backend Sch_X_Liu only accepts "light" | "dark", not "system". */
export function getMcpTheme(): "light" | "dark" {
  const hr = new Date().getHours()
  if (hr >= 6 && hr <= 17) return "light"
  return "dark"
}

/** Common x_liu_* fields required by __interceptor__ checkEntry. */
export function buildXLiuBody(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    x_liu_language: "zh-CN",
    x_liu_theme: getMcpTheme(),
    x_liu_version: LIUBAI_MCP_VERSION,
    x_liu_stamp: getTime(),
    x_liu_timezone: getTimezone(),
    x_liu_client: "mcp",
    x_liu_device: "liubai-mcp",
    x_liu_ide_type: "mcp",
    ...extra,
  }
}
