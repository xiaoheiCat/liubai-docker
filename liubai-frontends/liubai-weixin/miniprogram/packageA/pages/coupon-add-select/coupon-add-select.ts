import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"
import { LiuApi } from "~/utils/LiuApi"
import { ShowTip } from "~/utils/managers/ShowTip"
import { ImageHelper } from "~/packageA/utils/ImageHelper"
import { CouponAddManager } from "../shared/CouponAddManager"
import { CouponManager } from "../shared/CouponManager"
import { LiuUtil } from "~/utils/liu-util/index"
import { LiuTime } from "~/utils/LiuTime"

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
    _initClipboardStamp: 0,
  },

  methods: {

    async onTapPoster() {

      // 0. are you ok
      if(!this.areYouOK()) return

      // 1. choose image
      const res1 = await LiuApi.chooseMedia({ 
        mediaType: ["image"], 
        count: 1, 
        sourceType: ["album"],
        sizeType: ["original"]
      })
      if(!res1) return
      const file = res1.tempFiles[0]
      if(!file) return

      // 2. compress
      const imgHelper = new ImageHelper(file)
      const res2 = await imgHelper.run()
      if(!res2) return

      // 3. are you ok again
      if(!this.areYouOK()) return

      // 4. save image
      CouponAddManager.addPoster(res2)

      this.goToAddDate()
    },

    async onTapClipboard() {
      // 0. are you ok
      if(!this.areYouOK()) return

      // 1. show tip if never ever used clipboard
      if(!this.data._initClipboardStamp) {
        const res1 = await LiuUtil.showCustomModal({
          title_key: "shared.privacy_tip",
          content_key: "coupon-related.tip_3",
          confirm_key: "shared.ok",
        })
        if(!res1.confirm) return
        const now1 = LiuTime.getTime()
        this.data._initClipboardStamp = now1
        LiuUtil.setOneKey("once-data", "initClipboardStamp", now1)
      }
      
      // 2. get clipboard
      const res2 = await LiuApi.getClipboardData()
      if(!res2) {
        this.showClipboardErr()
        return
      }
      const txt2 = res2.data.trim()
      if(!txt2 || txt2.length < 20) {
        LiuUtil.showCustomModal({
          title: "🤨",
          content_key: "coupon-related.tip_4",
          confirm_key: "shared.got_it",
          showCancel: false,
        })
        return
      }

      CouponAddManager.addCopytext(txt2)
      this.goToAddDate()
    },

    goToAddDate() {
      LiuApi.navigateTo({
        url: "/packageA/pages/coupon-add-date/coupon-add-date",
        routeType: "wx://modal-navigation",
        routeConfig: {
          allowEnterRouteSnapshotting: true,
          allowExitRouteSnapshotting: true,
        },
      }, this.router)
    },

    showClipboardErr(err?: any) {
      ShowTip.showErrMsg("读取剪贴板失败", err)
    },

    onShow() {
      CouponManager.fetchStatus()
      this.getOnceData()
    },

    async getOnceData() {
      const stamp = await LiuUtil.getOneKey<number>("once-data", "initClipboardStamp")
      this.data._initClipboardStamp = stamp ?? 0
    },

    areYouOK() {
      const couponStatus = CouponManager.getStatus()
      if(!couponStatus) return true
      if(!couponStatus.can_i_use) {
        ShowTip.cannotUse()
        return false
      }
      const { 
        membership,
        max_coupons = 3, 
        posted_coupons = 0,
      } = couponStatus
      if(posted_coupons >= max_coupons) {
        if(membership === "premium") {
          this.showReachedMaxCouponsForPremium()
        }
        else if(membership === "free") {
          this.goToPremium()
        }
        return false
      }

      return true
    },

    async showReachedMaxCouponsForPremium() {
      const res = await LiuUtil.showCustomModal({
        title_key: "coupon-related.tip_1",
        content_key: "coupon-related.tip_2",
        confirm_key: "coupon-related.manage",
      })
      if(res.confirm) {
        LiuApi.navigateTo({
          url: "/packageA/pages/coupon-mine/coupon-mine",
        })
      }
    },

    goToPremium() {
      LiuApi.navigateTo({ 
        url: "/packageB/pages/landing-premium/landing-premium?key=max-coupon",
      })
    }

  }


})