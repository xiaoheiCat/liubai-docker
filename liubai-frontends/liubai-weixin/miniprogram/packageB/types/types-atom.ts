
export type PageState = -1 | 0 | 1 | 50 | 51 | 52 | 53 | 54 | 55 | 70
export type PageStateKey = "OK" 
  | "LOADING"
  | "SWITCHING"
  | "NO_DATA"
  | "NO_AUTH"
  | "NETWORK_ERR"
  | "NEED_BACKEND"
  | "TOO_HOT"
  | "NOT_IN_ROOM"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"

export type BaseIsOn = "Y" | "N"

export type SubMsgItemType = "accept" | "reject" | "ban" | "filter"

export type FilePurpose = "coupon-upload" | "coupon-tmp"