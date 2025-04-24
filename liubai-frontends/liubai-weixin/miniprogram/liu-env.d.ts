// 扩展 "miniprogram-api-typings" 依赖

declare namespace WechatMiniprogram {
  interface LaunchOptionsApp {
    mode: "default" | "embedded" | "halfPage" | "singlePage"
  }
}