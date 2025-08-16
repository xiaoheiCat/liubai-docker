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
      LiuApi.vibrateShort({ type: "light" })

      if(type === "phone") {
        this.whenTapPhone(text)
        return
      }

      // 1. show hover
      const idx = dataset.idx
      const res1 = this.handleHover(idx, true)

      // 2. copy text
      await LiuUtil.toCopy(text)

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

    async whenTapPhone(text: string) {
      LiuUtil.showCustomActionSheet({
        alertText: text,
        item_key_list: [
          "shared.copy",
          "shared.call",
          "shared.sms",
        ],
        success(res) {
          LiuApi.vibrateShort({ type: "light" })
          const idx = res.tapIndex
          if(idx === 0) {
            LiuUtil.toCopy(text)
          }
          else if(idx === 1) {
            LiuApi.makePhoneCall({ phoneNumber: text })
          }
          else if(idx === 2) {
            LiuApi.sendSms({ phoneNumber: text })
          }
        }
      })
    },



  }

})