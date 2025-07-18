import { defaultData } from "../../../config/default-data";
import { LiuApi } from "../../LiuApi";
import type { CharacteristicsRes } from "./types";

let result: CharacteristicsRes | undefined

export const handleCharacteristic = () => {
  if(result) return result

  // 1.1 get device info
  const deviceInfo = LiuApi.getDeviceInfo()
  const platform = deviceInfo?.platform ?? ""
  const system = deviceInfo?.system ?? ""

  // 1.2 get app base info
  const appBaseInfo = LiuApi.getAppBaseInfo()
  const SDKVersion = appBaseInfo?.SDKVersion ?? defaultData.minSDKVersion

  // 2. define default platform
  result = {
    isPC: false,
    isMobile: true,
    isMac: false,
    isWindows: false,
    isHarmonyOS: platform === "ohos",
    isIOS: system.includes("iOS"),
    SDKVersion,
  }

  // 3. for PC
  if(platform === "mac") {
    result.isPC = true
    result.isMobile = false
    result.isMac = true
  }
  else if(platform.includes("windows")) {
    result.isPC = true
    result.isMobile = false
    result.isWindows = true
  }
  
  return result
}


export const handleDeviceString = () => {
  const cha = handleCharacteristic()
  let str = ""

  if(cha.isMobile) str = "Mobile "
  else if(cha.isPC) str = "PC "

  str += "WeChat "

  if(cha.isHarmonyOS) str += "HarmonyOS "
  else if(cha.isIOS) str += "iOS "
  else if(cha.isMac) str += "Mac "
  else if(cha.isWindows) str += "Windows "

  str += `WeixinMiniProgram v${cha.SDKVersion}`
  
  return str
}

