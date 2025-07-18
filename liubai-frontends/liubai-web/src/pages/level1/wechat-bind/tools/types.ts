import type { PageState } from "~/types/types-atom";
import type { UserLoginAPI } from "~/requests/req-types";

// logout: 微信一键登录
// waiting: 绑定微信（已登录）
// bound: 已绑定（按钮: 返回）
// logged: 登录成功（并且也绑定了）
// wxmini-login: 微信小程序登录

export type WbStatus = "logout" | "waiting" | "bound" | "logged" | "wxmini-login"

export interface WbData {
  pageState: PageState
  pageName: "wechat-bind" | "wxmini-login"
  oAuthCode: string
  status?: WbStatus
  loginData?: UserLoginAPI.Res_Init
  agreeRule: boolean
  agreeShakingNum: number
}