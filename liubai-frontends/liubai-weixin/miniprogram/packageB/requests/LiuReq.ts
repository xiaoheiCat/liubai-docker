import type { LiuReqOptions, LiuRqReturn } from "./tools/types"
import { LiuTime } from "../utils/LiuTime"
import { LiuApi } from "../utils/LiuApi"
import { envData } from "../config/env-data"
import { LiuUtil } from "../utils/liu-util/index"
import { defaultData } from "../config/default-data"
import { getLoginLocally } from "../utils/login/tools/local-login"

export type NetworkResolver<T> = (res: LiuRqReturn<T>) => void

let miniEnvType: string | undefined

async function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  // 1.1 get serial & token
  const loginData = await getLoginLocally()

  // 1.2 get language, theme, and miniEnvType
  const appBaseInfo = LiuApi.getAppBaseInfo()
  const language = appBaseInfo?.language ?? defaultData.language
  const theme = appBaseInfo?.theme ?? defaultData.theme
  if(!miniEnvType) {
    const accountInfo = LiuApi.getAccountInfoSync()
    miniEnvType = accountInfo.miniProgram?.envVersion
  }

  // 2. add some common data
  const b: Record<string, any> = {
    x_liu_language: language,
    x_liu_theme: theme,
    x_liu_version: envData.LIU_VERSION,
    x_liu_stamp: LiuTime.getTime(),
    x_liu_timezone: LiuTime.getTimezone().toFixed(1),
    x_liu_client: "weixin-miniprogram",
    x_liu_device: LiuUtil.getDeviceString(),
    x_liu_token: loginData?.token,
    x_liu_serial: loginData?.serial,
    x_liu_mini_env_type: miniEnvType,
    ...body,
  }

  console.log("bbb: ", b)
  
  return b
}



export class LiuReq {

  static async request<
    T extends Record<string, any>,
    U extends Record<string, any> = Record<string, any>,
  >(
    url: string,
    body?: U,
    options?: LiuReqOptions,
  ) {
    const newBody = await _getBody(body)
    const timeout = options?.timeout ?? 10000
    const method = options?.method ?? "POST"

    const _wait = (a: NetworkResolver<T>) => {

      LiuApi.request({
        url,
        data: newBody,
        timeout,
        method,
        useHighPerformanceMode: true,
        success(res) {
          // console.log("wx.request success: ")
          // console.log(res)
          const resData = res.data as any
          if(resData && resData.code) {
            a(resData as LiuRqReturn<T>)
            return
          }

          a({ code: "C0001" })
        },
        fail(err) {
          console.warn("wx.request fail: ")
          console.warn(err)
          const isNetworkIssue = err.errMsg.includes("request:fail")
          
          if(isNetworkIssue) {
            a({ code: "F0003" })
            return
          }

          a({ code: "C0001" })
        }
      })

    }


    return new Promise(_wait)
  }



}