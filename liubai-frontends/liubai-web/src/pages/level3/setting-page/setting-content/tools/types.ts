import type { LocalFontSize, LocalTheme } from "~/types/types-atom"
import type { LocalLocale } from "~/types/types-locale"

export interface LanguageItem {
  text: string
  id: LocalLocale
}

export interface ThemeItem {
  text: string
  id: LocalTheme
  iconName: string
}

export interface FontSizeItem {
  text: string
  id: LocalFontSize
  iconName: string
}

export interface SettingContentData {
  language: LocalLocale
  language_txt: string
  theme: LocalTheme
  fontSize: LocalFontSize
  hasBackend: boolean

  // community
  redLink: string
  openSourceLink: string

  debugBtn: boolean
  openDebug: boolean
  mobileDebug: boolean

  contactLink?: string
  emailLink?: string
  showA2HS: boolean
  documentationLink?: string

  lastTapFooterStamp: number
  tapFooterNum: number
  
}