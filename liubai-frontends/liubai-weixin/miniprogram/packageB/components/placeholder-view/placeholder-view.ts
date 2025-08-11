
import { pageStates } from "../../utils/atom-util"
import { i18nBehavior } from "../../behaviors/i18n-behavior"
import { defaultData } from "../../config/default-data"
import { LiuApi } from "~/packageB/utils/LiuApi"
import valTool from "~/packageB/utils/val-tool"
import { LiuUtil } from "~/packageB/utils/liu-util/index"

const TRANSITION_MS = 300

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("err")
  ],

  properties: {
    pState: {
      type: Number,
      value: pageStates.LOADING,
      observer(newV, oldV) {
        if(newV >= 0 && oldV < 0) {
          this.toOpen()
        }
        else if(newV < 0 && oldV >= 0) {
          this.toClose()
        }
      }
    },
    checkSkyline: {
      type: Boolean,
      value: false,
      observer(newV) {
        if(newV) {
          this.toCheckSkyline()
        }
      }
    },
    height3: {
      type: Number,
      value: 0,
    },
    errTip: String,
  },

  data: {
    TRANSITION_MS,
    enable: true,
    show: true,
    _toggleTimeout: 0,
    pageStates,
    canUseSkyline: true,
  },

  methods: {

    toCheckSkyline() {
      const res1 = LiuApi.getSkylineInfoSync()
      const cha = LiuUtil.getCharacteristic()
      const res2 = valTool.compareVersion(cha.SDKVersion, "3.7.8")
      if(!res1.isSupported || res2 < 0) {
        this.setData({ canUseSkyline: false })
      }
    },

    async toClose() {
      if(!this.data.enable) return

      const _this = this
      const timeout = this.data._toggleTimeout
      if(timeout) {
        clearTimeout(timeout)
      }
      this.setData({ show: false })
      this.data._toggleTimeout = setTimeout(() => {
        _this.data._toggleTimeout = 0
        _this.setData({ enable: false })
      }, TRANSITION_MS)
    },

    async toOpen() {
      if(this.data.show) return

      const _this = this
      const timeout = this.data._toggleTimeout
      if(timeout) {
        clearTimeout(timeout)
      }
      this.setData({ enable: true })
      this.data._toggleTimeout = setTimeout(() => {
        _this.data._toggleTimeout = 0
        _this.setData({ show: true })
      }, defaultData.frame_duration)
    }

  }


})