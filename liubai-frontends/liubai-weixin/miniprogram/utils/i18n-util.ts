import { defaultData } from "../config/default-data"
import { 
  isSupportedLocale,
  type SupportedLocale,
  type GetMessages,
  type UseI18nOpt,
  type T_I18N,
} from "../types/types-locale"
import { LiuApi } from "./LiuApi"
import valTool from "./val-tool"

const FALLBACK_LOCALE = "zh-Hans"

/** 归一化语言 */
function normalizeLanguage(val: string): SupportedLocale {
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
  const lang = appBaseInfo?.language ?? defaultData.language

  // return "en"
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

export function getI18nBehavior(
  key: string,
  getMessages: GetMessages,
) {
let the_t: Record<string, string> | undefined

  let locale = getLocale()
  let messages = getMessages(locale)

  if(messages && messages[key]) {
    the_t = messages[key]
  }
  else if(locale !== FALLBACK_LOCALE) {
    locale = FALLBACK_LOCALE
    messages = getMessages(locale)
    if(messages && messages[key]) {
      the_t = messages[key]
    }
  }

  // 3. return behavior
  const behavior = Behavior({
    data: {
      locale,
      t1: the_t ?? {},
    },
    pageLifetimes: {
      show() {
        const currentLocale = getLocale()
        if(currentLocale === this.data.locale) return

        locale = currentLocale
        messages = getMessages(locale)
        if(messages && messages[key]) {
          this.setData({ t1: messages[key], locale })
        }
      }
    }
  })

  return behavior
}


export function initI18n(
  getMessages: GetMessages,
  opt1?: UseI18nOpt,
) {
  const locale = opt1?.locale ?? getLocale()
  const messages = getMessages(locale)
  
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

  return { t, locale }
}