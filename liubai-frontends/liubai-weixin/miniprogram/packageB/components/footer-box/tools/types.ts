

export interface TextItem {
  id: string
  type: "plain-text" | "copy"
  text: string
  isHover?: boolean
}