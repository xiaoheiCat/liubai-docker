import type { SubMsgItemType } from "~/types/types-atom";
import { AuthManager } from "./AuthManager";
import { LiuApi } from "../LiuApi";


type ReqSubMsgResolver = (
  res: SubMsgItemType | undefined
) => void

export class SubMsger {

  static requestOneMsg(tmplId: string) {
    const res1 = this._isAlwaysAccepted(tmplId)
    const res2 = LiuApi.requestSubscribeMessage([tmplId])

    const _wait = async (a: ReqSubMsgResolver) => {
      if(res1) {
        a("accept")
        return
      }
      const res3 = await res2
      if(!res3) {
        a(undefined)
        return
      }
      const res4 = res3[tmplId] as SubMsgItemType
      a(res4)
    }
    return new Promise(_wait)
  }

  private static _isAlwaysAccepted(tmplId: string) {
    const subSetting = AuthManager.getSubscriptionsSetting()
    if(!subSetting) return false
    if(!subSetting.mainSwitch) return false
    if(!subSetting.itemSettings) return false

    const theValue = subSetting.itemSettings[tmplId] as SubMsgItemType
    return theValue === "accept"
  }

}