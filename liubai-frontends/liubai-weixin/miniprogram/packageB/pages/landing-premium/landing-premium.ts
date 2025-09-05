import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { pageBehavior } from "../../behaviors/page-behavior";
import type { LpKey } from "./tools/types";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { getOrderData, getWxpayParam } from "./tools/useLandingPremium";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { Loginer } from "~/packageB/utils/login/Loginer";
import { ShowTip } from "~/packageB/utils/managers/ShowTip";
import type { Res_OrderData } from "~/packageB/requests/req-types";
import { useI18n } from "~/packageB/locales/index";
import valTool from "~/packageB/utils/val-tool";

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
    buyBtnText: "",
    _paymentData: {
      stamp1: 0,
      planId: "",
      orderId: "",
    },
  },

  methods: {

    onLoad() {
      this.handleOrderData()
    },


    async handleOrderData() {
      const orderData = await getOrderData()
      if(!orderData) return
      const paymentData = this.data._paymentData
      paymentData.stamp1 = LiuTime.getTime()
      paymentData.planId = orderData.plan_id ?? ""
      paymentData.orderId = orderData.order_id
      this.handleOrderAmt(orderData)
      return orderData.order_id
    },

    handleOrderAmt(
      orderData: Res_OrderData,
    ) {
      const amt = orderData.orderAmount

      // 1. turn into yuan
      let x = (amt / 100).toFixed(2)
      const available = valTool.isStringAsNumber(x)
      if(!available) return

      // 2. remove .00
      if(x.endsWith(".00")) x = x.slice(0, -3)

      // 3. translate
      const { t } = useI18n()
      const buyBtnText = t("landing-premium.x_yuan", { x })
      this.setData({ buyBtnText })
    },

    async onTapBuy() {
      LiuApi.vibrateShort({ type: "medium" })

      // 1. get wx_mini_openid
      const loginData = Loginer.getLoginDataSync()
      const wx_mini_openid = loginData?.wx_mini_openid
      if(!wx_mini_openid) {
        ShowTip.showErrMsg("no wx_mini_openid")
        return
      }

      // 2. check out availability of orderId
      const paymentData = this.data._paymentData
      let orderId: string | undefined = paymentData.orderId
      const within10mins = LiuTime.isWithinMillis(
        paymentData.stamp1,
        LiuTime.MINUTE * 10,
      )
      if(!orderId || !within10mins) {
        orderId = await this.handleOrderData()
        if(!orderId) return
      }

      // 3. get wxpay param
      const wxpayParam = await getWxpayParam(orderId, wx_mini_openid)
      if(!wxpayParam) return

      // 4. pay
      const _this = this
      LiuApi.requestPayment({
        ...wxpayParam,
        success(res4) {
          console.warn("requestPayment success: ", res4)
          _this.setData({ hasPaid: true })
          Loginer.justPaid(paymentData.planId)
        },
        fail(err4) {
          console.warn("requestPayment fail: ", err4)
        }
      })
    },

    onTapBackAfterPaid() {
      LiuApi.vibrateShort({ type: "medium" })
      LiuApi.navigateBack()
    },

    onTapLearnMore() {
      LiuApi.vibrateShort({ type: "light" })
      LiuApi.navigateTo({
        url: "/packageB/pages/article/article?key=premium",
      })
    },




  },


})