import { defaultData } from "~/packageB/config/default-data"
import { i18nBehavior } from "../../behaviors/i18n-behavior"
import { themeBehavior } from "../../behaviors/theme-behavior"

Component({

  behaviors: [
    i18nBehavior("qrcode"),
    themeBehavior(),
  ],

  options: {
    pureDataPattern: /^_/,
  },

  properties: {
    open: {
      type: Boolean,
      value: false,
      observer(newV, oldV) {
        if(newV === oldV) return

        if(newV) {
          this.toOpen()
        }
        else {
          this.toClose()
        }
      }
    },
    qrCode: {
      type: String,
      value: "",
    }
  },

  data: {
    enable: false,
    show: false,
    _toggleTimeout: 0,
  },

  methods: {

    toOpen() {
      if(this.data.enable && this.data.show) return

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
    },

    toClose() {
      if(!this.data.enable && !this.data.show) return
      
      const _this = this
      const timeout = this.data._toggleTimeout
      if(timeout) {
        clearTimeout(timeout)
      }
      this.setData({ show: false })
      this.data._toggleTimeout = setTimeout(() => {
        _this.data._toggleTimeout = 0
        _this.setData({ enable: false })
      }, defaultData.animation_ms)
    },

  }


})