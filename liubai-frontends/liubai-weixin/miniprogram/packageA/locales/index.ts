import { 
  type T_I18N, 
  type SupportedLocale,
  type UseI18nOpt,
} from "../../types/types-locale"
import { getLocale, i18nFill } from "../../utils/i18n-util"
import valTool from "../../utils/val-tool"
import zhHans from "./messages/zh-Hans"
import zhHant from "./messages/zh-Hant"
import en from "./messages/en"

export function getMessagesA(
  locale: SupportedLocale,
): Record<string, Record<string, string>> {
  if(locale === "zh-Hant") return zhHant
  if(locale === "en") return en
  return zhHans
}

/** 返回一个翻译函数 t */
export function useI18nA(
  opt1?: UseI18nOpt,
) {
  const locale = opt1?.locale ?? getLocale()
  const messages = getMessagesA(locale)

  const _getVal = (key: string) => {
    if(!messages) return ""
    const keys = key.split(".")
    let tmpMessages = messages
    for(let i=0; i<keys.length; i++) {
      const k = keys[i]
      tmpMessages = valTool.getValFromObj(tmpMessages, k)
      if(!tmpMessages) break
    }
    if(typeof tmpMessages !== "string") return ""
    return tmpMessages
  }

  const t: T_I18N = (fullKey, opt2) => {
    if(!messages) return ""

    const res = _getVal(fullKey)
    if(!res) return ""

    const res2 = i18nFill(res, opt2)
    return res2
  }

  return { t }
}