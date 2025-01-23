import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import type { 
  UserSettingsAPI,
  Res_HelloWorld,
} from "~/requests/req-types"

export async function fetchHelloWorld() {
  const url = APIs.TIME
  const res = await liuReq.request<Res_HelloWorld>(url)
  return res
}

export async function fetchUserEnter() {
  const url = APIs.USER_ENTER
  const param = { operateType: "enter" }
  const res = await liuReq.request<UserSettingsAPI.Res_Enter>(url, param)
  return res
}

export async function fetchLatestUser() {
  const url = APIs.USER_LATEST
  const param = { operateType: "latest" }
  const res = await liuReq.request<UserSettingsAPI.Res_Latest>(url, param)
  return res
}

export async function fetchUserSubscription() {
  const url = APIs.USER_MEMBERSHIP
  const param = { operateType: "membership" }
  const res = await liuReq.request<UserSettingsAPI.Res_Membership>(url, param)
  return res
}
