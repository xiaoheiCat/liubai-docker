import { createRandom } from "~/packageB/utils/basic/ider"
import type { TextItem } from "./types"
import reg_exp from "./regular-expressions"

export function calculateTextList(originalText: string) {
  if(!originalText) return []

  const result = handleCopyText(originalText)

  for(let i=0; i<result.length; i++) {
    const item = result[i]
    if(item.type !== "plain-text") continue

    // parse url
    const list1 = _innerParse(item.text, reg_exp.exact_url, "url")
    if(list1.length > 0) {
      result.splice(i, 1, ...list1)
      i--
      continue
    }

    // parse email
    const list2 = _innerParse(item.text, reg_exp.email, "email")
    if(list2.length > 0) {
      result.splice(i, 1, ...list2)
      i--
      continue
    }

    // parse phone
    const list3 = _innerParse(item.text, reg_exp.phone_1, "phone")
    if(list3.length > 0) {
      result.splice(i, 1, ...list3)
      i--
      continue
    }
    const list4 = _innerParse(item.text, reg_exp.phone_2, "phone")
    if(list4.length > 0) {
      result.splice(i, 1, ...list4)
      i--
      continue
    }

    // parse meeting no
    const list5 = _innerParse(item.text, reg_exp.meeting_1, "meeting-no")
    if(list5.length > 0) {
      result.splice(i, 1, ...list5)
      i--
      continue
    }
    const list6 = _innerParse(item.text, reg_exp.meeting_2, "meeting-no")
    if(list6.length > 0) {
      result.splice(i, 1, ...list6)
      i--
      continue
    }

  }

  return result
}


function _innerParse(
  text: string,
  reg: RegExp,
  forType: "url" | "email" | "phone" | "meeting-no",
) {
  const matches = text.matchAll(reg)
  const tmpList: TextItem[] = []
  let tmpEndIdx = 0

  for(const match of matches) {
    let mTxt = match[0]
    let mLen = mTxt.length
    let startIdx = match.index
    if(startIdx === undefined) continue

    if(forType === "phone") {
      const res1 = _checkForPhone(text, startIdx, mLen)
      if(!res1) continue
    }
    if(forType === "meeting-no") {
      const res2 = _checkForMeetingNo(text, startIdx, mLen)
      if(!res2) continue
    }

    const endIdx = startIdx + mLen
    const obj: TextItem = {
      id: createRandom(),
      type: forType,
      text: mTxt,
    }

    if(startIdx > 0 && tmpEndIdx < startIdx) {
      const frontObj: TextItem = {
        id: createRandom(),
        type: "plain-text",
        text: text.slice(tmpEndIdx, startIdx),
      }
      tmpList.push(frontObj)
    }

    tmpList.push(obj)
    tmpEndIdx = endIdx
  }

  if(tmpList.length < 1) return []

  if(text.length > tmpEndIdx) {
    const backObj: TextItem = {
      id: createRandom(),
      type: "plain-text",
      text: text.substring(tmpEndIdx),
    }
    tmpList.push(backObj)
  }

  return tmpList
}

function _checkForMeetingNo(
  text: string,
  startIdx: number,
  matchLength: number,
) {
  const res = _checkNumForPrevAndNextChar(text, startIdx, matchLength)
  return res
}

function _checkForPhone(
  text: string,
  startIdx: number,
  matchLength: number,
) {
  // 只提取手机号
  if(text[startIdx] !== "1") {
    return false
  }

  const res = _checkNumForPrevAndNextChar(text, startIdx, matchLength)
  return res
}

function _checkNumForPrevAndNextChar(
  text: string,
  startIdx: number,
  matchLength: number,
) {
  if(startIdx > 0) {
    const prevChar = text[startIdx - 1]
    if(prevChar >= "0" && prevChar <= "9") {
      return false
    }
  }

  if(startIdx + matchLength < text.length) {
    const nextChar = text[startIdx + matchLength]
    if(nextChar >= "0" && nextChar <= "9") {
      return false
    }
  }
  return true
}


function handleCopyText(
  originalText: string,
) {
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