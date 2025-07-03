import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"
import { LiuApi } from "~/utils/LiuApi"
import { fetchCouponStatus } from "../shared/shared-fetch"
import { HappySystemAPI } from "~/requests/req-types"
import { ShowTip } from "~/utils/managers/ShowTip"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("coupon-add-select"),
    navibarBehavior(),
    themeBehavior(),
  ],
  
  data: {
    pageName: "coupon-add-select",
    _couponStatus: null as HappySystemAPI.Res_CouponStatus | null,
  },

  methods: {
    onTapPoster() {
      if(!this.areYouOK()) return
      LiuApi.navigateTo({
        url: "/packageA/pages/coupon-add-date/coupon-add-date",
        routeType: "wx://modal-navigation",
        routeConfig: {
          allowEnterRouteSnapshotting: true,
          allowExitRouteSnapshotting: true,
        },
      }, this.router)
    },

    onShow() {
      this.checkStatus()
    },


    async checkStatus() {
      const res1 = await fetchCouponStatus()
      console.log("res1: ", res1)
      if(res1.code === "0000" && res1.data) {
        this.data._couponStatus = res1.data
      }

    },

    areYouOK() {
      const couponStatus = this.data._couponStatus
      if(!couponStatus) return true
      if(!couponStatus.can_i_use) {
        ShowTip.cannotUse()
        return false
      }
      return true
    }

  }


})