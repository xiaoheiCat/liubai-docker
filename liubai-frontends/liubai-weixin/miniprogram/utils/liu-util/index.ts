import { colorData, defaultData } from "~/config/default-data";
import { LiuApi } from "../LiuApi";
import { handleCharacteristic, handleDeviceString } from "./tools/characteristic";
import { useI18n } from "~/locales/index";
import { envData } from "~/config/env-data";
import type { SupportedTheme } from "~/types/types-atom";


export interface CustomModalOpt extends WechatMiniprogram.ShowModalOption {
  title_key?: string
  content_key?: string
  content_opt?: Record<string, any>
  confirm_key?: string
  cancel_key?: string
}

export interface CustomToastOpt extends Partial<WechatMiniprogram.ShowToastOption> {
  title?: string
  title_key?: string
}

export interface CustomLoadingOpt extends Partial<WechatMiniprogram.ShowLoadingOption> {
  title?: string
  title_key?: string
}

export class LiuUtil {

  static getCharacteristic() {
    return handleCharacteristic()
  }

  static getDeviceString() {
    return handleDeviceString()
  }

  static goHome() {
    const res1 = this.naviBackToHome()
    if(res1) return
    LiuApi.redirectTo({ url: defaultData.homePath })
  }

  private static naviBackToHome() {
    const pages = LiuApi.getPages()
    const pLength = pages.length
    if(pLength < 2) return false

    let delta = 0
    for(let i = pLength - 2; i >= 0; i--) {
      const thePage = pages[i]
      const thePageName = thePage.data.pageName
      if(thePageName === "index") {
        delta = (pLength - 1) - i
        break
      }
    }

    if(delta > 0) {
      LiuApi.navigateBack({ delta })
    }

    return Boolean(delta > 0)
  }

  static navigateWithPopup(url: string) {
    const apiCategory = LiuApi.getApiCategory()
    if(apiCategory === "embedded" || apiCategory === "nativeFunctionalized") {
      LiuApi.navigateTo({ url })
      return
    }
    const opt: WechatMiniprogram.NavigateToOption = {
      url,
      // wx://bottom-sheet  wx://modal  wx://cupertino-modal  wx://upwards
      routeType: "wx://cupertino-modal",        
      routeConfig: {
        barrierColor: "rgba(0, 0, 0, 0.5)",
        barrierDismissible: true,
        popGestureDirection: "multi",
        fullscreenDrag: false,
      },
      routeOptions: {
        round: true,
        height: 75,
      },
    }
    LiuApi.navigateTo(opt) 
  }

  static async showCustomModal(opt: CustomModalOpt) {
    // 1. handle confirm color
    if(!opt.confirmColor) {
      const theme = LiuUtil.getCurrentTheme()
      const confirmColor = colorData[theme].primary_color
      opt.confirmColor = confirmColor
    }

    const { t } = useI18n()
    // 2.1 handle title
    if(opt.title_key) {
      if(!opt.title) {
        opt.title = t(opt.title_key)
      }
      delete opt.title_key
    }

    // 2.2 handle content
    if(opt.content_key) {
      if(!opt.content) {
        opt.content = t(opt.content_key, opt.content_opt)
      }
      delete opt.content_key
      delete opt.content_opt
    }

    // 2.3 handle confirm text
    if(opt.confirm_key) {
      if(!opt.confirmText) {
        opt.confirmText = t(opt.confirm_key)
      }
      delete opt.confirm_key
    }
    else if(!opt.confirmText) {
      opt.confirmText = t("shared.confirm")
    }

    // 2.4 handle cancel text
    if(opt.cancel_key) {
      if(!opt.cancelText) {
        opt.cancelText = t(opt.cancel_key)
      }
      delete opt.cancel_key
    }
    else if(!opt.cancelText && opt.showCancel !== false) {
      opt.cancelText = t("shared.cancel")
    }
    
    const res = await LiuApi.showModal(opt)
    if(res?.confirm) {
      LiuApi.vibrateShort({ type: "light" })
    }

    return res
  }

  static async showCustomToast(opt: CustomToastOpt) {
    if(opt.title_key) {
      const { t } = useI18n()
      if(!opt.title) {
        opt.title = t(opt.title_key)
      }
      delete opt.title_key
    }
    if(!opt.icon && !opt.image) {
      opt.icon = "none"
    }
    await LiuApi.showToast(opt as WechatMiniprogram.ShowToastOption)
  }

  static async showCustomLoading(opt: CustomLoadingOpt) {
    if(opt.title_key) {
      const { t } = useI18n()
      if(!opt.title) {
        opt.title = t(opt.title_key)
      }
      delete opt.title_key
    }
    await LiuApi.showLoading(opt as WechatMiniprogram.ShowLoadingOption)
  }
  
  static getCurrentTheme(): SupportedTheme {
    const appBaseInfo = LiuApi.getAppBaseInfo()
    const theme = appBaseInfo?.theme ?? defaultData.theme as SupportedTheme
    return theme
  }

  static async getOneKey<T = any>(
    key1: string,
    key2: string,
  ) {
    const res1 = await LiuApi.getStorage({ key: key1 })
    if(res1 && res1.data) {
      return res1.data[key2] as T
    }
    return null
  }

  static async setOneKey(
    key1: string,
    key2: string,
    value: any,
  ) {
    let obj: Record<string, any> = {}
    const res1 = await LiuApi.getStorage({ key: key1 })
    if(res1 && res1.data) {
      obj = res1.data
    }
    obj[key2] = value
    await LiuApi.setStorage({ key: key1, data: obj })
  }

  static toContactUs() {
    const link = envData.LIU_CUSTOMER_SERVICE
    const corpId = envData.LIU_WECOM_CORPID
    if(!link || !corpId) return
    LiuApi.vibrateShort({ type: "medium" })
    LiuApi.openCustomerServiceChat({
      extInfo: {
        url: link,
      },
      corpId,
      success(res) {
        console.log("openCustomerServiceChat success: ", res)
      },
      fail(err) {
        console.warn("openCustomerServiceChat fail: ", err)
      }
    })
  }

}