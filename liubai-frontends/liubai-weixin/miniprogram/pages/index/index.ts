// index.ts

import { i18nBehavior } from "~/behaviors/i18n-behavior"
import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { sharedBehavior } from "~/behaviors/shared-behavior"
import { defaultData } from "~/config/default-data"
import { envData } from "~/config/env-data"
import { useI18n } from "~/locales/index"
import { LiuUtil } from "~/utils/liu-util/index"
import { LiuApi } from "~/utils/LiuApi"
import valTool from "~/utils/val-tool"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  data: {
    showFollowUs: true,
    pageName: "index",
    _key1: "",
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
      const showFollowUs = Boolean(res1 >= 0 && cha.isMobile)
      this.setData({ showFollowUs })

    },

  },

  methods: {

    goToShowcase() {
      LiuApi.vibrateShort({ type: "medium" })
      const url = "/pages/showcase/showcase?key=cuiyanzhe"
      LiuUtil.navigateWithPopup(url)
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
      LiuApi.openOfficialAccountArticle({
        url: defaultData.fellowArticleLink,
        success(res) {
          console.log("openOfficialAccountArticle success", res)
        },
        fail(err) {
          console.error("openOfficialAccountArticle fail", err)
        }
      })
    },

    onTapArticle(e: any) {
      LiuApi.vibrateShort({ type: "medium" })
      const dataset = e.currentTarget.dataset
      const type = dataset.type
      if(!type) return
      const url = `/pages/article/article?type=${type}`
      LiuApi.navigateTo({ url })
    },

    toOpenWzh() {
      const username = envData.GZH_USERNAME
      if(!username) {
        console.warn("GZH_USERNAME is not set")
        return
      }

      LiuApi.openOfficialAccountProfile({ username }) 
    },

    onLoad(query: Record<string, string>) {
      if(query?.key1) {
        this.data._key1 = query.key1
      }
    },

    onReady() {
      const key1 = this.data._key1
      if(key1) {
        const url = `/pages/showcase/showcase?key=${key1}`
        LiuUtil.navigateWithPopup(url)
      }
    },

    onUnload() {
      // reset 
      this.data._key1 = ""
    },

    onShareAppMessage() {
      const { t } = useI18n()
      const title = t("index.slogan")
      return { title }
    }

  },
})
