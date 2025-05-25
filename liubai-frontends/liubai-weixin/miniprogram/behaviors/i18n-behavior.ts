import { getMessages } from "../locales/index"
import { getI18nBehavior } from "../utils/i18n-util"

export const i18nBehavior = (
  key: string,
) => {
  const behavior = getI18nBehavior(key, getMessages)
  return behavior
}