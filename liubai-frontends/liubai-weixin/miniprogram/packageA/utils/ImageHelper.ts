import type { BoolFunc } from "~/utils/basic/type-tool"
import { LiuApi } from "~/utils/LiuApi"
import valTool from "~/utils/val-tool"

export type CropScale = '16:9' | '9:16' | '4:3' | '3:4' | '5:4' | '4:5' | '1:1'

export interface ImageHelperOpt {
  compressKB?: number
  maxH2W?: number
  cropScale?: CropScale
}

export class ImageHelper {

  private _tempFile: LiuMiniprogram.MediaFile
  private _compressKB = 250
  private _maxPixel = 1080
  private _maxH2W = 2
  private _cropScale: CropScale = "9:16"    // width : height

  constructor(
    file: LiuMiniprogram.MediaFile,
    opt?: ImageHelperOpt,
  ) {
    this._tempFile = file
    if(opt?.compressKB) {
      this._compressKB = opt.compressKB
    }
    if(opt?.maxH2W) {
      this._maxH2W = opt.maxH2W
    }
    if(opt?.cropScale) {
      this._cropScale = opt.cropScale
    }
  }

  async run() {
    // 0. pre check
    const res0 = await this.preCheck()
    if(!res0) return

    // 1. check the ratio of height to width
    const res1 = await this.checkH2W()
    if(!res1) return

    // 2. check size
    const res2 = await this.checkSize()
    if(!res2) return
    
    // 3. return new file
    const res3 = valTool.copyObject(this._tempFile)
    return res3 as WechatMiniprogram.MediaFile
  }

  async preCheck() {
    const { height, width } = this._tempFile
    if(height && width) return true
    const res1 = await this.toSeekInfo()
    if(!res1) return false
    return true
  }

  async toSeekInfo() {
    const src = this._tempFile.tempFilePath
    const res = await LiuApi.getImageInfo({ src })
    // console.log("toSeekInfo getImageInfo res: ", res)
    if(!res) return false
    this._tempFile.height = res.height
    this._tempFile.width = res.width
    return true
  }

  private async checkH2W() {
    const file = this._tempFile as WechatMiniprogram.MediaFile
    const height = file.height
    const width = file.width
    const h2w = height / width
    if(h2w > this._maxH2W) {
      const res1 = await this.toCrop()
      if(!res1) return false
    }
    return true
  }

  private async toCrop() {
    const file = this._tempFile
    const cropScale = this._cropScale

    const _wait2 = async (a: BoolFunc, tempPath: string) => {
      const res2 = await LiuApi.getImageInfo({ src: tempPath })
      // console.log("toCrop getImageInfo res2: ", res2)
      if(!res2) {
        a(false)
        return
      }
      file.height = res2.height
      file.width = res2.width
      a(true)
    }

    const _wait1 = (a: BoolFunc) => {
      LiuApi.cropImage({ 
        src: file.tempFilePath, 
        cropScale,
        success(res) {
          // console.log("cropImage res: ", res)
          file.tempFilePath = res.tempFilePath
          _wait2(a, res.tempFilePath)
        },
        fail(err) {
          console.warn("cropImage err: ", err)
          a(false)
        }
      })
    }
    return new Promise(_wait1)
  }

  private async checkSize() {
    const size = this._tempFile.size
    const max = this._compressKB * 1024
    if(size > max) {
      const res1 = await this.toCompress()
      if(!res1) return false
    }
    return true
  }

  private async toCompress() {
    // 1. get file info
    const file = this._tempFile as WechatMiniprogram.MediaFile
    const tempFilePath = file.tempFilePath
    const height = file.height
    const width = file.width
    const size = file.size
    const mB = size / 1024 / 1024

    // 2. set opt
    const quality = mB > 2 ? 70 : 80
    const opt2: WechatMiniprogram.CompressImageOption = {
      src: tempFilePath,
      quality,
    }
    if(height > this._maxPixel && height >= width) {
      opt2.compressedHeight = this._maxPixel
    }
    else if(width > this._maxPixel && width > height) {
      opt2.compressedWidth = this._maxPixel
    }

    // 3. start to compress
    const res3 = await LiuApi.compressImage(opt2)
    if(!res3) return false
    if(!res3.tempFilePath) return false

    // 4. handle width & height
    if(opt2.compressedHeight) {
      file.height = opt2.compressedHeight
      file.width = Math.round(width * (opt2.compressedHeight / height))
    }
    else if(opt2.compressedWidth) {
      file.width = opt2.compressedWidth
      file.height = Math.round(height * (opt2.compressedWidth / width))
    }
    file.tempFilePath = res3.tempFilePath
    return true
  }

}