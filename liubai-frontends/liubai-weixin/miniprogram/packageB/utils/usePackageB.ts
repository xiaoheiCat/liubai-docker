import APIs from "../requests/APIs"
import type { Res_HelloWorld } from "../requests/req-types"
import { LiuReq } from "../requests/LiuReq"
import { LiuTime } from "./LiuTime"
import { LiuApi } from "./LiuApi"
import { Loginer } from "./login/Loginer"
import type { BoolFunc, LiuTimeout } from "./basic/type-tool"
import valTool from "./val-tool"
import { AuthManager } from "./managers/AuthManager"
import { defaultData } from "../config/default-data"
import { setNaviForNewTheme } from "./theme-util"

export async function usePackageB() {
  listenToRouteDoneChange()
  await LiuApp.init()
  await valTool.waitMilli(defaultData.duration_ms_2)
  await AuthManager.init()
}

function listenToRouteDoneChange() {
  // to fix navigation bar's color changed when navigateBack
  LiuApi.onAppRouteDone(res => {
    if(res.openType !== "navigateBack") return
    const apiCategory = LiuApi.getApiCategory()
    if(apiCategory !== "chatTool") return
    setNaviForNewTheme()
  })
}


export class LiuApp {


  private static _hasLogged = false
  private static _waitList: BoolFunc[] = []

  static async init() {
    const apiCategory = LiuApi.getApiCategory()
    if(apiCategory === "browseOnly") return
    const _this = this

    // 1. to define a function to fetch login data
    const _run = async () => {
      // 1.1 time calibrate
      const res1_1 = await timeCalibrate()
      if (!res1_1) return false

      // 1.2 check login state
      const res1_2 = await Loginer.run()
      if (!res1_2) return false

      _this._hasLogged = true
      _this._waitList.forEach(w => w(true))
      _this._waitList = []

      return true
    }

    // 2. try to login
    const res2 = await _run()
    if (res2) return

    // 3. define network change and custom timeout
    let _timeout: LiuTimeout
    const _whenNetworkChange = async (
      res?: WechatMiniprogram.OnNetworkStatusChangeListenerResult,
    ) => {
      if (res && !res.isConnected) return
      const res3 = await _run()
      if (!res3) return
      LiuApi.offNetworkStatusChange(_whenNetworkChange)
      _timeout && clearTimeout(_timeout)
      _timeout = undefined
    }

    // 4. listen to network change
    LiuApi.onNetworkStatusChange(_whenNetworkChange)

    // 5. custom timeout
    _timeout = setTimeout(async () => {
      _whenNetworkChange()
    }, LiuTime.MINUTE)
  }


  static autoLogin() {
    if(this._hasLogged) {
      return valTool.getPromise(true)
    }
    if(!Loginer.canILogin()) {
      return valTool.getPromise(false)
    }
    const _this = this

    const _wait = (a: BoolFunc) => {
      _this._waitList.push(a)
    }

    return new Promise(_wait)
  }


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