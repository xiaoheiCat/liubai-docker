import APIs from "~/requests/APIs";
import { LiuReq } from "~/requests/LiuReq";
import { UserLoginAPI, UserSettingsAPI } from "~/requests/req-types";

export async function fetchLogin(
  js_code: string,
) {
  const w1 = {
    operateType: "wx_mini_session",
    js_code,
  }
  const url1 = APIs.LOGIN
  const res1 = await LiuReq.request<UserLoginAPI.Res_WxMiniSession>(url1, w1)
  return res1
}

export async function fetchEnter() {
  const w1 = { operateType: "enter" }
  const url1 = APIs.USER_SETTINGS
  const res1 = await LiuReq.request<UserSettingsAPI.Res_Enter>(url1, w1)
  return res1
}

export async function fetchLatest() {
  const w1 = { operateType: "latest" }
  const url1 = APIs.USER_SETTINGS
  const res1 = await LiuReq.request<UserSettingsAPI.Res_Latest>(url1, w1)
  return res1
}