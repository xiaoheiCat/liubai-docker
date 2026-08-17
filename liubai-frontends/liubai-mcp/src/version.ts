import packageJson from "../package.json" with { type: "json" }

export const LIUBAI_MCP_PACKAGE_VERSION = packageJson.version
export const LIUBAI_MCP_API_VERSION = packageJson.version
  .split(".")
  .slice(0, 2)
  .join(".")
