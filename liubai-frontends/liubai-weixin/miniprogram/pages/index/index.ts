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
import { Loginer } from "~/utils/login/Loginer"
import { ShowTip } from "~/utils/managers/ShowTip"
import { 
  getMyTasks, 
  getStoragedMyTasks, 
  handleGroupInfo, 
  setStoragedMyTasks,
} from "./tools/useIndexPage"
import { pageBehavior } from "~/behaviors/page-behavior"
import { TaskItem } from "~/types/types-task"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  data: {
    pageName: "index",
    canSearch: false,
    myTasks: [] as TaskItem[],
    _key1: "",
    _key2: "",
    _searchValue: "",
  },

  behaviors: [
    i18nBehavior("index"),
    navibarBehavior(),
    sharedBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],

  methods: {

    isEverythingOK() {
      const canLogin = Loginer.canILogin()
      if(!canLogin) {
        ShowTip.showOpenMiniForBrowseOnly()
        return false
      }
      return true
    },

    onTapFollowUs() {
      // 0. vibrate
      LiuApi.vibrateShort({ type: "light" })
      if(!this.isEverythingOK()) return

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

    onTapTask() {
      // 1. first check
      if(!this.isEverythingOK()) return

      // 2. second check
      const res2 = LiuApi.getSkylineInfoSync()
      if(!res2.isSupported) {
        LiuUtil.showCustomModal({
          title: "🙅",
          content_key: "index.pc_not_supported",
          showCancel: false,
        })
        return
      }

      this.toCreateTask()
    },

    toCreateTask() {
      LiuApi.vibrateShort({ type: "medium" })
      LiuApi.openChatTool({
        url: "/packageB/pages/task-create/task-create",
        fail(err) {
          if(err?.errMsg?.includes?.("cancel")) return
          console.warn("openChatTool fail", err)
          ShowTip.showErrMsg("fail to open chat tool", err)
        }
      })
    },


    onLoad(query: Record<string, string>) {
      if(query?.key1) {
        this.data._key1 = query.key1
      }
      else if(query?.key2) {
        this.data._key2 = query.key2
      }

      this.initMyTasks()
    },

    async initMyTasks() {
      const myTasks = await getStoragedMyTasks()
      if(!myTasks) return
      this.setData({ myTasks })
    },

    onTapCoupon() {
      if(!this.isEverythingOK()) return
      LiuApi.navigateTo({ 
        url: "/packageA/pages/coupon-home/coupon-home",
      })
    },

    onShow() {
      this.handleMyTasks()
    },

    async handleMyTasks() {
      const res1 = LiuApi.getSkylineInfoSync()
      if(!res1.isSupported) return
      const myTasks = await getMyTasks()
      if(!myTasks) return
      this.setData({ myTasks })
      setStoragedMyTasks(myTasks)
    },

    onReady() {
      const key1 = this.data._key1
      if(key1) {
        const url = `/pages/showcase/showcase?key=${key1}`
        LiuUtil.navigateWithPopup(url)
        return
      }

      const key2 = this.data._key2
      if(key2 === "CREATE_TASK") {
        this.toCreateTask()
        return
      }
      
      handleGroupInfo()
    },

    onUnload() {
      // reset 
      this.data._key1 = ""
      this.data._key2 = ""
    },

    onShareTimeline() {
      return {
        title: defaultData.timeline_title,
        imageUrl: "/images/shared/index-cover-for-moment.jpg"
      }
    },

    onShareAppMessage() {
      const { t } = useI18n()
      const title = t("index.slogan")
      return { 
        title,
        imageUrl: "/images/shared/index-cover.jpg"
      }
    }

  },
})
