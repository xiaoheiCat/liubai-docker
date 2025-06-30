// index.ts

import { i18nBehavior } from "~/behaviors/i18n-behavior"
import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { sharedBehavior } from "~/behaviors/shared-behavior"
import { themeBehavior } from "~/behaviors/theme-behavior"
import { defaultData } from "~/config/default-data"
import { envData } from "~/config/env-data"
import { useI18n } from "~/locales/index"
import { LiuUtil } from "~/utils/liu-util/index"
import { LiuApi } from "~/utils/LiuApi"
import valTool from "~/utils/val-tool"
import { handleImageSearch } from "./tools/useIndexPage"
import { Loginer } from "~/utils/login/Loginer"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  data: {
    pageName: "index",
    light_primary_color: defaultData.light_primary_color,
    dark_primary_color: defaultData.dark_primary_color,
    canSearch: false,
    isBrowseOnly: false,
    _key1: "",
    _searchValue: "",
  },

  behaviors: [
    i18nBehavior("index"),
    navibarBehavior(),
    sharedBehavior(),
    themeBehavior(),
  ],

  lifetimes: {

    attached() {},

  },

  methods: {

    goToShowcase() {
      LiuApi.vibrateShort({ type: "medium" })
      const url = "/pages/showcase/showcase?key=cuiyanzhe"
      LiuUtil.navigateWithPopup(url)
    },

    onTapFollowUs() {
      // 0. vibrate
      LiuApi.vibrateShort({ type: "light" })

      // 1. check out whether the current version supports 
      // opening the WeChat official account profile
      const cha = LiuUtil.getCharacteristic()
      const sdkVersion = cha.SDKVersion
      const res1 = valTool.compareVersion(sdkVersion, "3.7.10")
      const canOpenGzh = Boolean(res1 >= 0 && cha.isMobile)
      if(canOpenGzh) {
        this.toOpenGzh()
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
        url: defaultData.followArticleLink,
        success(res) {
          console.log("openOfficialAccountArticle success", res)
        },
        fail(err) {
          console.error("openOfficialAccountArticle fail", err)
        }
      })
    },

    onTapImage() {
      handleImageSearch()
    },

    toOpenGzh() {
      const username = envData.GZH_USERNAME
      if(!username) {
        console.warn("GZH_USERNAME is not set")
        return
      }

      LiuApi.openOfficialAccountProfile({ username, success(res) {
        console.log("openOfficialAccountProfile success", res)
      }, fail(err) {
        console.warn("openOfficialAccountProfile fail", err)
      } }) 
    },

    onSearchInput(e: any) {
      const inputTxt: string = e.detail.value ?? ""
      const trimTxt = inputTxt.trim()
      const canSearch = Boolean(trimTxt.length > 1)
      if(canSearch !== this.data.canSearch) {
        this.setData({ canSearch })
      }
      this.data._searchValue = trimTxt
    },

    toSearch() {
      const searchValue = this.data._searchValue
      const canSearch = this.data.canSearch
      if(!searchValue || !canSearch) return
      
      LiuApi.vibrateShort({ type: "heavy" })
      console.log("to search: ", searchValue)
    },

    toOpenMiniProgram() {
      LiuUtil.showCustomModal({
        title_key: "index.open_mini_1",
        content_key: "index.open_mini_2",
        confirm_key: "index.got_it",
        showCancel: false,
      })
    },

    onLoad(query: Record<string, string>) {
      if(query?.key1) {
        this.data._key1 = query.key1
      }
      const canLogin = Loginer.canILogin()
      if(!canLogin) {
        this.setData({ isBrowseOnly: true })
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
