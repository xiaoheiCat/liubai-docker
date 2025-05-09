import APIs from "../requests/APIs"
import type { Res_HelloWorld } from "../requests/req-types"
import { LiuReq } from "../requests/LiuReq"
import { LiuTime } from "./LiuTime"

export async function useApp() {

  // 1. time calibrate
  await timeCalibrate()

}

async function timeCalibrate() {
  const url = APIs.TIME

  const t1 = LiuTime.getLocalTime()
  const res = await LiuReq.request<Res_HelloWorld>(url)
  const t2 = LiuTime.getLocalTime()
  
  const { code, data } = res
  if(code !== "0000" || !data) return false

  const clientStamp = Math.round((t2 + t1) / 2)
  const serverStamp = data.stamp
  const diff = clientStamp - serverStamp
  LiuTime.setDiff(diff)

  return true
}