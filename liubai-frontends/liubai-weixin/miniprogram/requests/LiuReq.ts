import type { LiuReqOptions, LiuRqReturn } from "./tools/types"
import { LiuTime } from "../utils/LiuTime"
import { LiuApi } from "../utils/LiuApi"
import { envData } from "../config/env-data"
import { LiuUtil } from "../utils/liu-util/index"
import { defaultData } from "../config/default-data"

export type NetworkResolver<T> = (res: LiuRqReturn<T>) => void

function _getBody<U extends Record<string, any>>(
  body?: U,
) {

  // 1.1 encrypt some data in body
  if(body) {
    
  }

  // 1.2 get language
  const appBaseInfo = LiuApi.getAppBaseInfo()
  const language = appBaseInfo?.language ?? defaultData.language
  const theme = appBaseInfo?.theme ?? defaultData.theme

  // 2. add some common data
  const b: Record<string, any> = {
    x_liu_language: language,
    x_liu_theme: theme,
    x_liu_version: envData.LIU_VERSION,
    x_liu_stamp: LiuTime.getTime(),
    x_liu_timezone: LiuTime.getTimezone().toFixed(1),
    x_liu_client: "weixin-miniprogram",
    x_liu_device: LiuUtil.getDeviceString(),
    ...body,
  }

  // const b2 = valTool.objToStr(b)
  return b
}



export class LiuReq {

  static request<
    T extends Record<string, any>,
    U extends Record<string, any> = Record<string, any>,
  >(
    url: string,
    body?: U,
    options?: LiuReqOptions,
  ) {
    const newBody = _getBody(body)
    const timeout = options?.timeout ?? 10000
    const method = options?.method ?? "POST"

    const _wait = (a: NetworkResolver<T>) => {

      LiuApi.request({
        url,
        data: newBody,
        timeout,
        method,
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