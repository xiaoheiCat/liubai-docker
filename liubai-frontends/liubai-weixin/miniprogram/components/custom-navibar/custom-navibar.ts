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
    }
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

      const pages = LiuApi.getPages()
      const pLength = pages.length
      if(pLength <= 1) {
        LiuApi.exitMiniProgram()
      }
      else {
        LiuApi.navigateBack()
      }
    },

    onTapHome() {
      LiuApi.vibrateShort({ type: "light" })
      LiuUtil.goHome()
    },


  }


})
