import APIs from "~/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import type { HappySystemAPI } from "~/requests/req-types"

export async function fetchShowcaseByKey(key: string) {
  const body = {
    operateType: "get-showcase",
    key,
  }
  const url = APIs.SHOWCASE
  const res = await LiuReq.request<HappySystemAPI.Res_GetShowcase>(
    url, 
    body,
  )
  return res
}