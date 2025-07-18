// index.ts

import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { sharedBehavior } from "~/behaviors/shared-behavior"
import { useI18n } from "~/locales/index"
import { LiuApi } from "~/utils/LiuApi"
import { handleImageSearch } from "./tools/useCouponHome"
import { Loginer } from "~/utils/login/Loginer"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"
import { ShowTip } from "~/utils/managers/ShowTip"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  data: {
    pageName: "coupon-home",
    canSearch: false,
    isBrowseOnly: false,
    _searchValue: "",
  },

  behaviors: [
    i18nBehavior("coupon-home"),
    navibarBehavior(),
    sharedBehavior(),
    themeBehavior(),
  ],

  lifetimes: {

    attached() {},

  },

  methods: {

    onTapImage() {
      handleImageSearch()
    },

    onSearchInput(e: any) {
      const inputTxt: string = e.detail.value ?? ""
      const trimTxt = inputTxt.trim()
      const canSearch = Boolean(trimTxt.length > 1)
      if(canSearch !== this.data.canSearch) {
        this.setData({ canSearch })
      }
      this.data._searchValue = trimTxt
    },

    toSearch() {
      const searchValue = this.data._searchValue
      const canSearch = this.data.canSearch
      if(!searchValue || !canSearch) return
      
      LiuApi.vibrateShort({ type: "heavy" })
      console.log("to search: ", searchValue)
    },

    toOpenMiniProgram() {
      ShowTip.showOpenMiniForBrowseOnly()
    },

    onTapAdd() {
      LiuApi.vibrateShort({ type: "medium" })
      LiuApi.navigateTo({
        url: "/packageA/pages/coupon-add-select/coupon-add-select",
        routeType: "wx://modal",
        routeConfig: {
          barrierColor: "rgba(0, 0, 0, 0.6)",
          barrierDismissible: true,
          popGestureDirection: "multi",
          fullscreenDrag: false,
          allowEnterRouteSnapshotting: true,
          allowExitRouteSnapshotting: true,
        },
      })
    },

    async onTapMine() {},

    onLoad() {
      const canLogin = Loginer.canILogin()
      if(!canLogin) {
        this.setData({ isBrowseOnly: true })
      }
    },

    onShareAppMessage() {
      const { t } = useI18n()
      const title = t("coupon-related.slogan")
      return { title }
    }

  },
})
