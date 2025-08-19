
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

export type LiuRemindLater = "30min" | "1hr" | "2hr" | "3hr" | "tomorrow_this_moment"

// 必须是 number 因为可能跟其他系统对接，会有不同的提前时间（单位为 minute）
export type LiuRemindEarly = number

// "提醒我" 的结构
export interface LiuRemindMe {
  type: "early" | "later" | "specific_time"

  // 提前多少分钟，若提前一天则为 1440
  early_minute?: LiuRemindEarly   

  // 30分钟后、1小时后、2小时后、3小时后、明天此刻
  later?: LiuRemindLater

  // 具体时间的时间戳
  specific_stamp?: number
}


export type UpdateTaskTextType = "title" | "note"