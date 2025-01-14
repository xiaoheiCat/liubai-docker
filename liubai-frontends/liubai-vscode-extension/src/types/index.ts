

export interface LiuAuthStatus {
  token: string
  serial: string
}

export const liuIDETypes = [
  "vscode",
  "vscode-insiders",
  "cursor",
  "windsurf",
  "github.dev",
  "vscode.dev",
] as const

export type LiuIDEType = typeof liuIDETypes[number] // hi