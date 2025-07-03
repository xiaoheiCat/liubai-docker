import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"
import { LiuApi } from "~/utils/LiuApi"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("coupon-add-success"),
    navibarBehavior(),
    themeBehavior(),
  ],
  
  data: {
    pageName: "coupon-add-success",
  },

  methods: {

    onTapPostAgain() {
      LiuApi.navigateBack({ delta: 2 })
    },

    onTapBack() {
      LiuApi.navigateBack({ delta: 3 })
    },

  },


})