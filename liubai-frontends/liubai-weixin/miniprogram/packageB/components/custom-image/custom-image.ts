import { i18nBehavior } from "../../behaviors/i18n-behavior"
import { themeBehavior } from "../../behaviors/theme-behavior"
import { defaultData } from "../../config/default-data"
import valTool from "../../utils/val-tool"

Component({

  behaviors: [
    i18nBehavior("err"),
    themeBehavior(),
  ],

  properties: {
    imageUrl: {
      type: String,
    },

    h2w: {
      type: String,
      value: "",
      observer() {
        this.calculatePercentH2W()
      }
    },

    imageMode: {
      type: String,
      value: "aspectFit",
    }

  },

  data: {
    percentH2W: defaultData.imageRatio,
    enable: true,
    loaded: false,
    isErr: false,
  },

  methods: {

    onTapImage() {
      this.triggerEvent("tap")
    },

    calculatePercentH2W() {
      const h2w = this.properties.h2w
      const res1 = valTool.isStringAsNumber(h2w)
      if(!res1) {
        if(this.data.percentH2W) {
          this.setData({ 
            percentH2W: defaultData.imageRatio,
          })
        }
        return
      }
      const h2wNum = Math.round(Number(h2w) * 100)
      this.setData({ percentH2W: `${h2wNum}%` })
    },

    onImageLoaded() {
      this.setData({ loaded: true })
    },

    onImageError() {
      this.setData({ isErr: true })
    },

    async onTapRefresh() {
      this.setData({ enable: false, loaded: false, isErr: false })
      await valTool.waitMilli(defaultData.duration_ms_1)
      this.setData({ enable: true })
    },

  },



})