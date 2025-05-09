import { LiuApi } from "../utils/LiuApi"
import { 
  isSupportedLocale, 
  type SupportedLocale,
} from "../types/types-locale"

export const FALLBACK_LANGUAGE = "zh-Hans"

export const getLocale = (): SupportedLocale => {
  const appBaseInfo = LiuApi.getAppBaseInfo()
  const lang = appBaseInfo.language
  if(isSupportedLocale(lang)) return lang

  const _aLang = lang.toLowerCase().replace(/_/g, "-")
  if(_aLang === "zh-tw") return "zh-Hant"
  if(_aLang === "zh-hk") return "zh-Hant"
  if(_aLang === "zh-cn") return "zh-Hans"

  if(_aLang.startsWith("en")) return "en"
  if(_aLang.startsWith("zh")) return "zh-Hans"

  return FALLBACK_LANGUAGE
}