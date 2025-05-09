
import { pageStates } from "../../utils/atom-util"
import { cfg } from "../../config/index"

const TRANSITION_MS = 300

Component({

  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

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
    height3: {
      type: Number,
      value: 0,
    }
  },

  data: {
    TRANSITION_MS,
    enable: true,
    show: true,
    _toggleTimeout: 0,
  },

  methods: {

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
      }, cfg.frame_duration)
    }

  }


})