import { LiuApi } from "~/utils/LiuApi"
import type { MiniProgramContext } from "~/types"
import { WatchVideoData } from "./types"
import { LiuUtil } from "~/utils/liu-util/index"
import { fetchPost } from "./useWatchVideo"
import { envData } from "~/config/env-data"

let rewardedVideoAd: WechatMiniprogram.RewardedVideoAd | undefined


function toContactUs() {
  const link = envData.LIU_CUSTOMER_SERVICE
  const corpId = envData.LIU_WECOM_CORPID
  if(!link || !corpId) return
  LiuApi.vibrateShort({ type: "medium" })
  LiuApi.openCustomerServiceChat({
    extInfo: {
      url: link,
    },
    corpId,
    success(res) {
      console.log("openCustomerServiceChat success: ", res)
    },
    fail(err) {
      console.error("openCustomerServiceChat fail: ", err)
    }
  })
}


export async function initRewardedVideoAd(
  ctx: MiniProgramContext<WatchVideoData>,
) {
  // 1. destroy first and get adUnitId
  destroyRewardedVideoAd()
  const adUnitId = ctx.data._adUnitId
  console.log("adUnitId: ", adUnitId)
  
  // 2. init and define callbacks
  rewardedVideoAd = LiuApi.createRewardedVideoAd({ adUnitId })
  rewardedVideoAd.onClose((res) => {
    console.log("rewardedVideoAd onClose: ", res)
    if(res.isEnded) {
      // 1. fetch
      fetchPost(ctx.data._credential)

      // 2. add num
      const {
        conversationToAd,
        conversationCountFromAd,
      } = ctx.data
      const bind = {
        conversationCountFromAd: conversationToAd + conversationCountFromAd,
      }
      ctx.setData(bind)
    }
    else {
      LiuUtil.showCustomModal({
        title: "👀",
        content_key: "watch-video.tip_1",
        showCancel: false,
      })
    }
  })

  rewardedVideoAd.onError((err) => {
    console.warn("rewardedVideoAd onError: ", err)
    const errCode = err.errCode
    const errMsg = err.errMsg

    // see https://developers.weixin.qq.com/miniprogram/dev/api/ad/RewardedVideoAd.onError.html
    // 1000: 后端错误调用失败，该项错误不是开发者的异常情况
    // 1003: 内部错误，该项错误不是开发者的异常情况
    if(errCode === 1000 || errCode === 1003) {
      LiuUtil.showCustomToast({ title_key: "shared.try_again_later" })
      return
    }

    // 无适合的广告
    if(errCode === 1004) {
      LiuUtil.showCustomModal({
        title_key: "watch-video.tip_2",
        content_key: "watch-video.tip_3",
        showCancel: false,
      })
      return
    }

    LiuUtil.showCustomModal({
      title_key: "err.video_err",
      content_key: "err.err_reason",
      content_opt: { msg: errMsg, code: errCode },
      confirm_key: "shared.contact_us",
      success(res) {
        if(res.confirm) {
          toContactUs()
        }
      }
    })
  })

  rewardedVideoAd.onLoad((res) => {
    console.log("rewardedVideoAd onLoad: ", res)
  })

  // 3. load
  try {
    const res3 = await rewardedVideoAd.load()
    console.log("rewardedVideoAd load res: ", res3)
  }
  catch(err) {}
}



export function destroyRewardedVideoAd() {
  if(!rewardedVideoAd) return
  rewardedVideoAd.destroy()
}


export async function showRewardedVideoAd() {
  if(!rewardedVideoAd) return
  try {
    const res = await rewardedVideoAd.show()
    console.log("showRewardedVideoAd res: ", res)
  }
  catch(err) {
    console.warn("showRewardedVideoAd err: ")
    console.log(err)
  }
}