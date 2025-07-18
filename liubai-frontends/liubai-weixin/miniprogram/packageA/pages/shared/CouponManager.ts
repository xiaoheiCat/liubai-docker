
import type { HappySystemAPI } from "~/requests/req-types"
import { fetchCouponStatus } from "./shared-fetch"
import valTool from "~/utils/val-tool"
import { LiuTime } from "~/utils/LiuTime"

export class CouponManager {

  // coupon status
  private static _lastFetchStamp: number = 0
  private static _status: HappySystemAPI.Res_CouponStatus | null = null

  static async fetchStatus(
    duration = LiuTime.SECOND * 5,
  ) {
    if(this._status) {
      const stamp = this._lastFetchStamp
      const withinDuration = LiuTime.isWithinMillis(stamp, duration)
      if(withinDuration) return
    }
    const res1 = await fetchCouponStatus()
    if(res1.code === "0000" && res1.data) {
      this._status = res1.data
      this._lastFetchStamp = LiuTime.getTime()
    }
  }

  static getStatus() {
    return valTool.copyObject(this._status)
  }
}