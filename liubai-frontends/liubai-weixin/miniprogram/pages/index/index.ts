// index.ts

import { i18nBehavior } from "../../behaviors/i18n-behavior"
import { navibarBehavior } from "../../behaviors/navibar-behavior"
import { sharedBehavior } from "../../behaviors/shared-behavior"
import { cfg } from "../../config/index"
import { useI18n } from "../../locales/index"
import { LiuUtil } from "../../utils/liu-util/index"
import { LiuApi } from "../../utils/LiuApi"
import valTool from "../../utils/val-tool"

Component({

  data: {
    showFollowUs: true,
  },

  behaviors: [
    i18nBehavior("index"),
    navibarBehavior,
    sharedBehavior(),
  ],

  lifetimes: {

    attached() {

      // 1. 检查当前版本是否支持打开微信公众号主页
      const cha = LiuUtil.getCharacteristic()
      const res1 = valTool.compareVersion(cha.SDKVersion, "3.4.8")
      const showFollowUs = res1 >= 0
      this.setData({ showFollowUs })

    },

  },

  methods: {

    goToShowcase() {
      wx.navigateTo({
        url: '/pages/showcase/showcase',
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
      })
    },

    onTapFollowUs() {
      // 0. vibrate
      LiuApi.vibrateShort({ type: "medium" })

      // 1. check out whether the current version supports 
      // opening the WeChat official account profile
      const cha = LiuUtil.getCharacteristic()
      const sdkVersion = cha.SDKVersion
      const res1 = valTool.compareVersion(sdkVersion, "3.7.10")
      const canOpenGzh = Boolean(res1 >= 0 && cha.isMobile)
      if(canOpenGzh) {
        this.toOpenWzh()
        return
      }

      // 2. check out whether the current version supports 
      // opening the WeChat article
      const res2 = valTool.compareVersion(sdkVersion, "3.4.8")
      const canOpenArticle = Boolean(res2 >= 0)
      if(canOpenArticle) {
        this.toOpenArticle()
        return
      }
      
    },

    toOpenArticle() {
      const followLink = "https://mp.weixin.qq.com/s/Nd3q4LKT_rJoMNo-AU-uuw"
      LiuApi.openOfficialAccountArticle({
        url: followLink,
        success(res) {
          console.log("openOfficialAccountArticle success", res)
        },
        fail(err) {
          console.error("openOfficialAccountArticle fail", err)
        }
      })
    },

    toOpenWzh() {
      const username = cfg.GZH_USERNAME
      if(!username) {
        console.warn("GZH_USERNAME is not set")
        return
      }

      LiuApi.openOfficialAccountProfile({ username }) 
    },

    onShareAppMessage() {
      const { t } = useI18n()
      const title = t("index.desc")
      return {
        title,
      }
    }

  },
})
