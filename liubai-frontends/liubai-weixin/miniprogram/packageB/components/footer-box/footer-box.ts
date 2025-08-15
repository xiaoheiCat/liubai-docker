import { calculateTextList } from "./tools/useFooterBox"
import type { TextItem } from "./tools/types"
import { themeBehavior } from "~/packageB/behaviors/theme-behavior"
import { sharedBehavior } from "~/packageB/behaviors/shared-behavior"
import { LiuApi } from "~/packageB/utils/LiuApi"
import valTool from "~/packageB/utils/val-tool"
import { LiuUtil } from "~/packageB/utils/liu-util/index"

Component({

  behaviors: [
    sharedBehavior(),
    themeBehavior(),
  ],

  properties: {
    content: {
      type: String,
      value: "",
      observer(newV, oldV) {
        if(newV === oldV) return
        const textList = calculateTextList(newV)
        this.setData({ textList })
      }
    }
  },

  data: {
    textList: [] as TextItem[],
  },

  methods: {
    async onTapCopy(e: WechatMiniprogram.BaseEvent) {
      const dataset = e.currentTarget.dataset
      const text = dataset.text
      const type = dataset.type
      if(!text || !type) return

      // 1. show hover
      const idx = dataset.idx
      const res1 = this.handleHover(idx, true)

      // 2. vibrate and copy text
      LiuApi.vibrateShort({ type: "light" })
      try {
        await LiuApi.setClipboardData({ data: text })

        // 3. toast
        LiuUtil.showCustomToast({ title_key: "shared.copied" })
      }
      catch(err) {
        console.warn("fail to set clipboard")
        console.log(err)
      }

      // 4. close hover
      if(res1) {
        await valTool.waitMilli(300)
        this.handleHover(idx, false)
      }
    },


    /** 由于 span 标签的 hover-class 无法作用 
     *  skyline 模式下 opacity 不生效，所以需要手动
     *  用脚本设置 hover
    */
    handleHover(
      idx: number,
      show: boolean,
    ) {
      const item = this.data.textList[idx]
      if(!item) return false
      if(item.isHover === show) return false

      const b1: Record<string, any> = {}
      b1[`textList[${idx}].isHover`] = show
      this.setData(b1)
      return true
    },



  }

})