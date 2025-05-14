import { defaultData } from "~/config/default-data"
import valTool from "~/utils/val-tool"


Component({

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
  },

  methods: {

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
    }

  },



})