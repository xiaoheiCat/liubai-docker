// custom-navibar.ts

import { sharedBehavior } from "~/behaviors/shared-behavior";
import { themeBehavior } from "~/behaviors/theme-behavior";
import { LiuUtil } from "~/utils/liu-util/index";
import { LiuApi } from "~/utils/LiuApi";

Component({

  data: {
    isEmbedded: false,
  },

  behaviors: [
    sharedBehavior(),
    themeBehavior(),
  ],

  properties: {
    height1: {
      type: Number,
      value: 0
    },
    height2: {
      type: Number,
      value: 0
    },
    visible: {
      type: Boolean,
      value: true,
    },
    title: {
      type: String,
    },
    alwaysArrowBack: {
      type: Boolean,
      value: false,
    },
    alwaysGoHome: {
      type: Boolean,
      value: false,
    },
    backTargetPageName: {
      type: String,
      value: "",
    },
    targetPageUrl: {
      type: String,
      value: "",
    },
  },

  lifetimes: {
    attached() {
      const apiCategory = LiuApi.getApiCategory()
      const isEmbedded = Boolean(apiCategory === "embedded")
      if(isEmbedded) {
        this.setData({ isEmbedded })
      }
    }
  },

  methods: {
    onTapBack() {
      LiuApi.vibrateShort({ type: "light" })
      const { backTargetPageName, targetPageUrl } = this.data
      if(backTargetPageName && targetPageUrl) {
        this.jumpToTargetPage()
        return
      }

      const pages = LiuApi.getPages()
      const pLength = pages.length
      if(pLength <= 1) {
        LiuApi.exitMiniProgram()
      }
      else {
        LiuApi.navigateBack()
      }
    },

    jumpToTargetPage() {
      const { backTargetPageName, targetPageUrl } = this.data

      const pages = LiuApi.getPages()
      const pLength = pages.length
      if(pLength < 2) {
        LiuApi.redirectTo({ url: targetPageUrl })
        return
      }

      for(let i=pLength-2; i>=0; i--) {
        const thePage = pages[i]
        if(thePage.data.pageName === backTargetPageName) {
          const delta = (pLength - 1) - i
          LiuApi.navigateBack({ delta })
          return
        }
      }

      LiuApi.redirectTo({ url: targetPageUrl })
    },

    onTapHome() {
      LiuApi.vibrateShort({ type: "light" })
      LiuUtil.goHome()
    },


  }


})
