import { 
  FileUploader, 
  type ImageUploaderResult,
} from "~/packageA/utils/FileUploader"
import APIs from "~/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import { HappySystemAPI } from "~/requests/req-types"
import { LiuRqReturn } from "~/requests/tools/types"


export class CouponAddManager {

  // for poster
  private static _file: WechatMiniprogram.MediaFile | null = null
  private static _uploadPromise: Promise<ImageUploaderResult> | null = null

  // for copytext
  private static _copytext: string | null = null

  // for both
  private static _credPromise: Promise<LiuRqReturn<HappySystemAPI.Res_CouponCheck>> | null = null

  static async addPoster(file: WechatMiniprogram.MediaFile) {
    this._file = file
    this._uploadPoster()
    
    if(this._uploadPromise) {
      const res2 = await this._uploadPromise
      if(!res2.pass) return
      const cloud_url = res2.data
      this._checkPoster(cloud_url)
    }
    
  }

  static async getCredential() {
    
    

  }




  static async addCopytext(copytext: string) {
    this._copytext = copytext
    this._checkText()
  }

  private static _checkText() {
    const copytext = this._copytext
    if(!copytext) return false
    const url1 = APIs.HAPPY_SYSTEM
    const opt1 = {
      operateType: "coupon-check",
      copytext,
    }
    this._credPromise = LiuReq.request<HappySystemAPI.Res_CouponCheck>(url1, opt1)
    return true
  }

  private static _uploadPoster() {
    const file = this._file
    if(!file) return false
    this._uploadPromise = FileUploader.uploadViaQiniu(
      file.tempFilePath, 
      "coupon-upload"
    )
    return true
  }

  private static _checkPoster(image_url: string) {
    const url1 = APIs.HAPPY_SYSTEM
    const opt1 = {
      operateType: "coupon-check",
      image_url,
    }
    this._credPromise = LiuReq.request<HappySystemAPI.Res_CouponCheck>(url1, opt1)
    return true
  }

  static reset() {
    this._file = null
    this._uploadPromise = null
    this._copytext = null
    this._credPromise = null
  }


}