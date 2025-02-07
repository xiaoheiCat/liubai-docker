export interface LiuAtomState {
  id: string
  text?: string
  color?: string              // 存储 # 开头的 hex，或者 --liu-state- 开头的系统颜色
  showInIndex: boolean
  showFireworks?: boolean     // 是否开启撒花
  updatedStamp: number
  insertedStamp: number
}

export interface LiuStateConfig {
  stateList: LiuAtomState[]
  updatedStamp: number 
}

export interface TagView {
  tagId: string
  text: string
  icon?: string
  oState: "OK" | "REMOVED"
  createdStamp: number
  updatedStamp: number
  children?: TagView[]
}

export const liuIDETypes = [
  "vscode",
  "vscode-insiders",
  "cursor",
  "windsurf",
  "vscodium",
  "github.dev",
  "vscode.dev",
  "gitpod.io",
  "stackblitz.com",
  "project-idx",
  "cloud-studio",         // it might be from ide.cloud.tencent.com or cloudstudio.net
                          // which are both products of Tencent
] as const

export type LiuIDEType = typeof liuIDETypes[number]