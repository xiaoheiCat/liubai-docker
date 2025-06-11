import APIs from "../requests/APIs"
import type { Res_HelloWorld } from "../requests/req-types"
import { LiuReq } from "../requests/LiuReq"
import { LiuTime } from "./LiuTime"
import { LiuApi } from "./LiuApi"
import { Loginer } from "./login/Loginer"

export async function useApp() {
  initApp()
}


async function initApp() {
  // 0. get apiCategory
  const apiCategory = LiuApi.getApiCategory()
  if(apiCategory === "browseOnly") return

  // 1. to define a function to fetch login data
  const _run = async () => {
    // 1.1 time calibrate
    const res1_1 = await timeCalibrate()
    if(!res1_1) return false

    // 1.2 check login state
    const res1_2 = await Loginer.run()
    if(!res1_2) return false
    
    return true
  }

  // 2. try to login
  const res2 = await _run()
  if(res2) return

  // 3. define network change
  const _whenNetworkChange = async (
    res: WechatMiniprogram.OnNetworkStatusChangeListenerResult,
  ) => {
    console.log("_whenNetworkChange res: ", res)
    if(!res.isConnected) return
    const res3 = await _run()
    console.log("res3: ", res3)
    if(!res3) return
    LiuApi.offNetworkStatusChange(_whenNetworkChange)
  }

  // 4. listen to network change
  LiuApi.onNetworkStatusChange(_whenNetworkChange)
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