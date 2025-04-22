

export class LiuApi {


  static getPages() {
    const pages = getCurrentPages()
    return pages
  }

  static navigateTo(opt: WechatMiniprogram.NavigateToOption) {
    wx.navigateTo(opt)
  }

  static navigateBack(opt?: WechatMiniprogram.NavigateBackOption) {
    wx.navigateBack(opt)
  }

  static reLaunch(opt: WechatMiniprogram.ReLaunchOption) {
    wx.reLaunch(opt)
  }

  static getWindowInfo() {
    return wx.getWindowInfo()
  }

  static getMenuButtonBoundingClientRect() {
    return wx.getMenuButtonBoundingClientRect()
  }

  static getEnterOptionsSync() {
    return wx.getEnterOptionsSync()
  }


}