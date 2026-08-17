import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export interface StoredCredentials {
  apiDomain: string
  token: string
  serial: string
  updatedStamp: number
  nickname?: string
}

function getConfigDir(): string {
  const customDir = process.env.LIUBAI_MCP_CONFIG_DIR?.trim()
  if (customDir) return path.resolve(customDir)
  return path.join(os.homedir(), ".config", "liubai-mcp")
}

export function getCredentialsPath(): string {
  return path.join(getConfigDir(), "credential.json")
}

export function loadStoredCredentials(): StoredCredentials | undefined {
  const configDir = getConfigDir()
  const files = [
    getCredentialsPath(),
    path.join(configDir, "credentials.json"),
  ]
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8")
      const data = JSON.parse(raw) as Partial<StoredCredentials>
      if (
        typeof data.apiDomain !== "string" ||
        typeof data.token !== "string" ||
        typeof data.serial !== "string" ||
        !data.apiDomain.trim() ||
        !data.token.trim() ||
        !data.serial.trim()
      ) {
        continue
      }
      return {
        apiDomain: data.apiDomain,
        token: data.token,
        serial: data.serial,
        updatedStamp:
          typeof data.updatedStamp === "number" ? data.updatedStamp : 0,
        nickname:
          typeof data.nickname === "string" ? data.nickname : undefined,
      }
    } catch {
      // Try the legacy filename before treating the user as logged out.
    }
  }
  return
}

export function saveStoredCredentials(data: StoredCredentials): void {
  const configDir = getConfigDir()
  const credentialFile = getCredentialsPath()
  fs.mkdirSync(configDir, { recursive: true, mode: 0o700 })
  const temporaryFile = `${credentialFile}.${process.pid}.tmp`
  fs.writeFileSync(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  fs.chmodSync(temporaryFile, 0o600)
  fs.renameSync(temporaryFile, credentialFile)
}
