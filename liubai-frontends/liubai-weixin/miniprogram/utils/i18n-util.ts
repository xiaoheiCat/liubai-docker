import { 
  isSupportedLocale,
  type SupportedLocale,
} from "../types/types-locale"
import { LiuApi } from "./LiuApi"

export const FALLBACK_LOCALE = "zh-Hans"

/** 归一化语言 */
export function normalizeLanguage(val: string): SupportedLocale {
  val = val.toLowerCase()
  if(!val) return FALLBACK_LOCALE

  val = val.replace(/_/g, "-")

  if(val === "zh-hant") return "zh-Hant"
  if(val === "zh-tw") return "zh-Hant"
  if(val === "zh-hk") return "zh-Hant"
  if(val.startsWith("zh")) return "zh-Hans"
  if(val.startsWith("en")) return "en"

  return FALLBACK_LOCALE
}

export function getLocale(): SupportedLocale {
  const appBaseInfo = LiuApi.getAppBaseInfo()
  const lang = appBaseInfo.language
  if(isSupportedLocale(lang)) return lang
  return normalizeLanguage(lang)
}

export function i18nFill(
  res: string,
  opt2?: Record<string, string | number>,
) {
  if(!opt2) return res
  const keys = Object.keys(opt2)
  for(let i=0; i<keys.length; i++) {
    const v = keys[i]
    const theVal = opt2[v]
    const dynamicPattern = `{${v}}`
    const escapedPattern = dynamicPattern.replace(/[{}]/g, '\\$&')
    const regexPattern = new RegExp(escapedPattern, 'g')
    res = res.replace(regexPattern, theVal.toString()) 
  }
  return res
}