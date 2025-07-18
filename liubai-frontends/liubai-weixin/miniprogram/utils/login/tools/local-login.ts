import type { LiuLoginData } from "~/types/index";
import { LiuApi } from "~/utils/LiuApi";
import { LiuTime } from "~/utils/LiuTime";
import valTool from "~/utils/val-tool";

const LOGIN_KEY = "login-data"
let _loginData: LiuLoginData | undefined
let _lastGetLoginDataStamp = 0

export async function getLoginLocally() {
  if(_loginData) {
    const stamp0 = _lastGetLoginDataStamp
    const within = LiuTime.isWithinMillis(stamp0, LiuTime.MINUTE, true)
    if(within) {
      return valTool.copyObject(_loginData)
    }
  }

  const res = await LiuApi.getStorage({ key: LOGIN_KEY, encrypt: true })
  const data = res?.data as LiuLoginData | null
  if(!data) return

  _loginData = data
  _lastGetLoginDataStamp = LiuTime.getLocalTime()

  return valTool.copyObject(data)
}

export async function setLoginLocally(data: LiuLoginData) {
  const res = await LiuApi.setStorage({ key: LOGIN_KEY, data, encrypt: true })
  _loginData = data
  _lastGetLoginDataStamp = LiuTime.getLocalTime()
  return res
}

export function refreshLoginLocally() {
  _lastGetLoginDataStamp = 0
}

export async function removeLoginLocally() {
  _loginData = undefined
  const res = await LiuApi.removeStorage({ key: LOGIN_KEY })
  return res
}