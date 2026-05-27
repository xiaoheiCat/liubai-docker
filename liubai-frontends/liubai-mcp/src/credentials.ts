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

const CONFIG_DIR = path.join(os.homedir(), ".config", "liubai-mcp")
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json")

export function getCredentialsPath(): string {
  return CREDENTIALS_FILE
}

export function loadStoredCredentials(): StoredCredentials | undefined {
  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf8")
    const data = JSON.parse(raw) as StoredCredentials
    if (!data.apiDomain || !data.token || !data.serial) return
    return data
  } catch {
    return
  }
}

export function saveStoredCredentials(data: StoredCredentials): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  fs.writeFileSync(CREDENTIALS_FILE, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
}
