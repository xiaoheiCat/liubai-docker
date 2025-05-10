import type { BoolFunc } from "./basic/type-tool"


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

  static getSkylineInfoSync() {
    return wx.getSkylineInfoSync()
  }

  static getDeviceInfo() {
    return wx.getDeviceInfo()
  }

  static getAppBaseInfo() {
    return wx.getAppBaseInfo()
  }

  static request(opt: WechatMiniprogram.RequestOption) {
    return wx.request(opt)
  }

  static getFileSystemManager() {
    return wx.getFileSystemManager()
  }

  static getEnv() {
    return wx.env
  }

  static async vibrateShort(opt: WechatMiniprogram.VibrateShortOption) {
    const res = await wx.vibrateShort(opt)
    return res
  }

  static async exitMiniProgram() {
    const res = await wx.exitMiniProgram()
    return res
  }

  static nextTick() {
    const _wait = (a: BoolFunc) => {
      wx.nextTick(() => {
        a(true)
      })
    }
    return new Promise(_wait)
  }

  static openOfficialAccountProfile(
    opt: WechatMiniprogram.OpenOfficialAccountProfileOption
  ) {
    wx.openOfficialAccountProfile(opt)
  }

  static openOfficialAccountArticle(
    opt: WechatMiniprogram.OpenOfficialAccountArticleOption,
  ) {
    wx.openOfficialAccountArticle(opt)
  }

}