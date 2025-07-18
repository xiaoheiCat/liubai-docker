// 扩展 "miniprogram-api-typings" 依赖

declare namespace WechatMiniprogram {
  interface LaunchOptionsApp {
    mode: "default" | "embedded" | "halfPage" | "singlePage"
  }

  interface LiuVibrateShortOption extends WechatMiniprogram.VibrateShortOption {
    type: "heavy" | "medium" | "light"
  }

  type ApiCategory = "default" 
    | "nativeFunctionalized" 
    | "browseOnly" 
    | "embedded" 
    | "chatTool"
}

declare namespace LiuMiniprogram {

  interface MediaFile {
    duration?: number
    fileType: 'image' | 'video'
    height?: number
    size: number
    tempFilePath: string
    thumbTempFilePath?: string
    width?: number
  }

}