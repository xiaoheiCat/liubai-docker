import APIs from "~/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import type { HappySystemAPI } from "~/requests/req-types"

export async function fetchCouponStatus() {
  const w1 = { operateType: "coupon-status" }
  const url1 = APIs.HAPPY_SYSTEM
  const res1 = await LiuReq.request<HappySystemAPI.Res_CouponStatus>(url1, w1)
  return res1
}