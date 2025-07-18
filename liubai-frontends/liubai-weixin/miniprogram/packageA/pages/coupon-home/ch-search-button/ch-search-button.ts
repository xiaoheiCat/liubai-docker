import { LiuUtil } from "~/utils/liu-util/index"
import { LiuApi } from "~/utils/LiuApi"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"

Component({

  properties: {
    canSearch: {
      type: Boolean,
      value: false,
    }
  },

  behaviors: [
    i18nBehavior("coupon-home"),
    themeBehavior(),
  ],

  methods: {

    onTapButton() {
      const canSearch = this.properties.canSearch
      if(!canSearch) {
        LiuApi.vibrateShort({ type: "light" })
        LiuUtil.showCustomModal({
          title_key: "coupon-related.try_1",
          content_key: "coupon-related.try_2",
          confirm_key: "coupon-related.got_it",
          showCancel: false,
        })
        return
      }
      this.triggerEvent("tap")
    }


  }


})