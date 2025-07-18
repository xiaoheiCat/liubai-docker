import { LiuApi } from "~/packageB/utils/LiuApi"

export class LiuRewardedVideo {
  private static rewardedVideoAd: WechatMiniprogram.RewardedVideoAd | undefined

  static init(
    adUnitId: string,
  ) {
    // 1. destroy first
    this.destroyRewardedVideoAd()

    // 2. create an new instance
    const ad = LiuApi.createRewardedVideoAd({ adUnitId })
    this.rewardedVideoAd = ad

    return ad
  }

  static async tryToLoad() {
    const ad = this.rewardedVideoAd
    if(!ad) return
    try {
      const res3 = await ad.load()
      console.log("rewardedVideoAd load res: ", res3)
    }
    catch(err) {}
  }

  static async showRewardedVideoAd() {
    const ad = this.rewardedVideoAd
    if(!ad) return
    let errMsg = ""
    try {
      const res = await ad.show()
      console.log("showRewardedVideoAd res: ", res)
      return
    }
    catch(err) {
      console.warn("showRewardedVideoAd err: ")
      console.log(err)
      errMsg = (err as any)?.errMsg ?? ""
    }

    if(errMsg.includes("please invoke load()")) {
      this.tryToLoad()
    }
  }

  static destroyRewardedVideoAd() {
    const ad = this.rewardedVideoAd
    if(!ad) return
    ad.destroy()
    this.rewardedVideoAd = undefined
  }



}