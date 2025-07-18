import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"
import { LiuApi } from "~/utils/LiuApi"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("coupon-add-date"),
    navibarBehavior(),
    themeBehavior(),
  ],
  
  data: {
    pageName: "coupon-add-date",
    _justPosted: false,
  },


  methods: {

    goToSuccess() {
      this.data._justPosted = true
      LiuApi.navigateTo({
        url: "/packageA/pages/coupon-add-success/coupon-add-success",
        routeType: "wx://modal-navigation",
        routeConfig: {
          allowEnterRouteSnapshotting: true,
          allowExitRouteSnapshotting: true,
        },
      }, this.router)
    },

    onShow() {
      if(this.data._justPosted) {
        LiuApi.navigateBack()
        this.data._justPosted = false
        return
      }
    },


  }


})