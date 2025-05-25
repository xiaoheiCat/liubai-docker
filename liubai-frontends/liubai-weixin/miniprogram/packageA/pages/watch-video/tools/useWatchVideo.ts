import APIs from "~/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import type { HappySystemAPI } from "~/requests/req-types"

export async function fetchGet(
  room: string,
) {
  const body = {
    operateType: "get-weixin-ad",
    room,
  }
  const url = APIs.WEIXIN_AD
  const res = await LiuReq.request<HappySystemAPI.Res_GetWeixinAd>(url, body)
  return res
}

export async function fetchPost(
  credential: string
) {
  const body = {
    operateType: "post-weixin-ad",
    credential,
  }
  const url = APIs.WEIXIN_AD
  const res = await LiuReq.request<HappySystemAPI.Res_PostWeixinAd>(url, body)
  return res
}