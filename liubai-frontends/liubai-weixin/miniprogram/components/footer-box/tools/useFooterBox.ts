import { createRandom } from "~/utils/basic/ider"
import type { TextItem } from "./types"

export function calculateTextList(originalText: string) {
  if(!originalText) return []

  const result: TextItem[] = []
  let lastIndex = 0
  const regex = /\{([^}]+)\}/g
  let match: RegExpExecArray | null
  let runTimes = 0
  
  while ((match = regex.exec(originalText)) !== null) {
    runTimes += 1
    if(runTimes > 99) break

    // 1. plain text
    if(match.index > lastIndex) {
      const text = originalText.slice(lastIndex, match.index)
      if(text) {
        result.push({
          id: createRandom(),
          type: "plain-text",
          text,
        })
      }
    }

    // 2. copy text
    const copiedText = match[1]
    if(copiedText) {
      result.push({
        id: createRandom(),
        type: "copy",
        text: copiedText,
      })
    }
    lastIndex = regex.lastIndex
  }

  // n. the rest of text
  if(lastIndex < originalText.length) {
    const text = originalText.substring(lastIndex)
    if(text) {
      result.push({
        id: createRandom(),
        type: "plain-text",
        text,
      })
    }
  }

  return result
}