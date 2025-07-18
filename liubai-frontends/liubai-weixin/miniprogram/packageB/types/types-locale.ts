export const supportedLocales = [
  "en",
  "zh-Hans",
  "zh-Hant"
] as const

export type SupportedLocale = typeof supportedLocales[number]

export type LocalLocale = SupportedLocale | "system"

export type T_I18N = (
  fullKey: string, opt2?: Record<string, string | number>
) => string

export const isSupportedLocale = (val: string): val is SupportedLocale => {
  return supportedLocales.includes(val as SupportedLocale)
}

export interface UseI18nOpt {
  locale?: SupportedLocale
}

export type GetMessages = (
  locale: SupportedLocale,
) => Record<string, Record<string, string>>