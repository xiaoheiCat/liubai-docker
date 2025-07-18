
import type { LocalTheme } from "./types-atom"
import type { LocalLocale } from "./types-locale"
import type { UserSubscription } from "./types-cloud"

export type BcrResult = WechatMiniprogram.BoundingClientRectCallbackResult | null
export type BoundingClientRectResolver = (res: BcrResult) => void
export type GetImagePath = () => string

export interface MiniProgramContext<
  D = Record<string, any>
> {
  data: D
  setData: (data: Partial<D>) => void
}

export interface LiuLoginData {
  theme?: LocalTheme
  language?: LocalLocale
  token?: string
  serial?: string
  nickname?: string
  avatarUrl?: string
  subscription?: UserSubscription
  wx_mini_openid?: string
  lastSetStamp: number
  memberId?: string
}

export interface LiuOnceData {
  initClipboardStamp?: number
  
}

export interface DataPass_A {
  pass: false
  errMsg: string
  errData?: any
}

export interface DataPass_B<T> {
  pass: true
  data: T
}

export type DataPass<T = any> = DataPass_A | DataPass_B<T>