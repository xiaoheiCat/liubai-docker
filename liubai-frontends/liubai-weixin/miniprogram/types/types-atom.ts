
// 页面状态
/**
 * -1: 正常
 * 0: 加载中
 * 1: 切换中（比如已有内容）
 * 50: 查无内容（404）
 * 51: 没有权限
 * 52: 网络不佳（需要联网才能查看）
 * 53: 该页面需要后端方可访问
 * 54: 当前不在微信里
 * 55: 太火爆了
 */
export type PageState = -1 | 0 | 1 | 50 | 51 | 52 | 53 | 54 | 55
export type PageStateKey = "OK" 
  | "LOADING"
  | "SWITCHING"
  | "NO_DATA"
  | "NO_AUTH"
  | "NETWORK_ERR"
  | "NEED_BACKEND"
  | "TOO_HOT"

export type SupportedTheme = "light" | "dark"
export type LocalTheme = SupportedTheme | "system" | "auto"   // auto 就是日夜切换

export type BaseIsOn = "Y" | "N"

export type SubMsgItemType = "accept" | "reject" | "ban" | "filter"

export type FilePurpose = "coupon-upload" | "coupon-tmp"