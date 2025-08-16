

export interface TextItem {
  id: string
  type: "plain-text" | "copy" | "phone" | "url" | "email" | "meeting-no"
  text: string
  isHover?: boolean
}