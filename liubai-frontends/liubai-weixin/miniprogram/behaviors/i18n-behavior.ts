import { getMessages } from "../locales/index"
import { getLocale, FALLBACK_LOCALE } from "../utils/i18n-util"

export const i18nBehavior = (
  key: string,
) => {
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