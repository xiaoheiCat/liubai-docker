import { LiuApi } from "../LiuApi";
import { LiuTime } from "../LiuTime";
import { Loginer } from "../login/Loginer";
import valTool from "../val-tool";


export class AuthManager {

  private static authSetting: WechatMiniprogram.AuthSetting | undefined
  private static subscriptionsSetting: WechatMiniprogram.SubscriptionsSetting | undefined
  private static _lastGetSettingStamp: number | undefined

  static async init() {
    if(!Loginer.canILogin()) return
    
    const res1 = await LiuApi.getSetting()
    if(!res1) return

    this._lastGetSettingStamp = LiuTime.getLocalTime()
    this.authSetting = res1.authSetting
    this.subscriptionsSetting = res1.subscriptionsSetting
    return true
  }

  static getAuthSetting() {
    if(this.authSetting) {
      const stamp = this._lastGetSettingStamp ?? 0
      if(LiuTime.isWithinMillis(stamp, LiuTime.HOUR, true)) {
        return valTool.copyObject(this.authSetting)
      }
    }
    this.init()
    return undefined
  }

  static getSubscriptionsSetting() {
    if(this.subscriptionsSetting) {
      const stamp = this._lastGetSettingStamp ?? 0
      if(LiuTime.isWithinMillis(stamp, LiuTime.HOUR, true)) {
        return valTool.copyObject(this.subscriptionsSetting)
      }
    }
    this.init()
    return undefined
  }

  static async openSetting() {
    const res1 = await LiuApi.openSetting()
    if(!res1) return
    
    this._lastGetSettingStamp = LiuTime.getLocalTime()
    this.authSetting = res1.authSetting
    if(res1.subscriptionsSetting) {
      this.subscriptionsSetting = res1.subscriptionsSetting
    }
    return res1
  }




}