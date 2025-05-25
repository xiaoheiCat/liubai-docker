import { 
  type SupportedLocale,
  type UseI18nOpt,
} from "../types/types-locale"
import { initI18n } from "../utils/i18n-util"
import zhHans from "./messages/zh-Hans"
import zhHant from "./messages/zh-Hant"
import en from "./messages/en"

export function getMessages(
  locale: SupportedLocale,
): Record<string, Record<string, string>> {
  if(locale === "zh-Hant") return zhHant
  if(locale === "en") return en
  return zhHans
}

/** 返回一个翻译函数 t */
export function useI18n(
  opt1?: UseI18nOpt,
) {
  const res = initI18n(getMessages, opt1)
  return res
}