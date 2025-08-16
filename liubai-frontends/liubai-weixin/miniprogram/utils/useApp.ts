import APIs from "../requests/APIs"
import type { Res_HelloWorld } from "../requests/req-types"
import { LiuReq } from "../requests/LiuReq"
import { LiuTime } from "./LiuTime"
import { LiuApi } from "./LiuApi"
import { Loginer } from "./login/Loginer"
import type { BoolFunc, LiuTimeout } from "./basic/type-tool"
import valTool from "./val-tool"
import { AuthManager } from "./managers/AuthManager"
import { defaultData } from "~/config/default-data"
import { LiuTunnel } from "./LiuTunnel"
import { envData } from "~/config/env-data"

export async function useApp() {
  const version = envData.LIU_VERSION
  console.log(`the current version is ${version}`)

  await LiuApp.init()
  await valTool.waitMilli(defaultData.duration_ms_2)
  await AuthManager.init()
}

export async function useForwardMaterials(
  forwardMaterials: WechatMiniprogram.ForwardMaterials[],
) {
  // 1. get the image
  const firstMaterial = forwardMaterials[0]
  if(!firstMaterial) return
  const t1 = firstMaterial.type
  if(!t1.startsWith("image")) return

  // 2. wait for a while
  await valTool.waitMilli(defaultData.duration_ms_2)

  // 3. mock a media file
  const tmpFile: LiuMiniprogram.MediaFile = {
    fileType: "image",
    tempFilePath: firstMaterial.path,
    size: firstMaterial.size,
  }
  LiuTunnel.setStuff("coupon-search-image", tmpFile)

  // 4. navigate to coupon search
  LiuApi.navigateTo({ 
    url: "/packageA/pages/coupon-search/coupon-search",
  })
}

export class LiuApp {

  private static _hasLogged = false
  private static _waitList: BoolFunc[] = []

  static async init() {
    const _this = this
    let currentApiCategory = LiuApi.getApiCategory()

    // 1. to define a function to fetch login data
    const _run = async () => {
      const latestApiCategory = LiuApi.getApiCategory()
      if(latestApiCategory === "browseOnly") return false

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

    // 2.2 try to login
    const res2_2 = await _run()
    if (res2_2) return

    // 3. define network change and custom timeout
    let _timeout: LiuTimeout
    const _whenCtxChange = async (
      res?: WechatMiniprogram.OnNetworkStatusChangeListenerResult,
    ) => {
      if (res && !res.isConnected) return
      const res3 = await _run()
      if (!res3) return
      LiuApi.offNetworkStatusChange(_whenCtxChange)
      _timeout && clearTimeout(_timeout)
      _timeout = undefined
    }

    // 4. listen to network change
    LiuApi.onNetworkStatusChange(_whenCtxChange)

    // 5. custom timeout
    let duration5 = LiuTime.MINUTE
    if(currentApiCategory === "browseOnly") {
      duration5 = LiuTime.SECOND * 5
    }
    _timeout = setTimeout(async () => {
      _whenCtxChange()
    }, duration5)

    // 6. listen to onApiCategoryChange
    LiuApi.onApiCategoryChange(res6 => {
      const newApiCategory = res6.apiCategory
      if(currentApiCategory === "browseOnly" && newApiCategory !== "browseOnly") {
        _whenCtxChange()
      }
      currentApiCategory = newApiCategory
    })

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