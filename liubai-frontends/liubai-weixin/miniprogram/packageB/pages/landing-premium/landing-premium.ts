import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { pageBehavior } from "../../behaviors/page-behavior";
import type { LpKey } from "./tools/types";
import { LiuApi } from "~/packageB/utils/LiuApi";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("landing-premium"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],
  
  data: {
    pageName: "landing-premium",
    key: "add-calendar" as LpKey | undefined,
    hasPaid: false,
    _wxpayData: {
      stamp: 0,
      orderId: "",
    },
  },

  methods: {


    onTapBackAfterPaid() {
      LiuApi.vibrateShort({ type: "medium" })
      LiuApi.navigateBack()
    },

    onTapLearnMore() {
      LiuApi.vibrateShort({ type: "light" })

    },




  },


})