import type { BoolFunc, StrFunc } from "./basic/type-tool"


export class LiuApi {

  static getPages() {
    const pages = getCurrentPages()
    return pages
  }

  static navigateTo(
    opt: WechatMiniprogram.NavigateToOption,
    router?: WechatMiniprogram.Component.Router,
  ) {
    if(router) {
      router.navigateTo(opt)
      return
    }
    wx.navigateTo(opt)
  }

  static navigateBack(opt?: WechatMiniprogram.NavigateBackOption) {
    wx.navigateBack(opt)
  }

  static redirectTo(opt: WechatMiniprogram.RedirectToOption) {
    wx.redirectTo(opt)
  }

  static reLaunch(opt: WechatMiniprogram.ReLaunchOption) {
    wx.reLaunch(opt)
  }

  static getWindowInfo() {
    // 在快照模式 browseOnly 的情况下，可能返回 undefined
    const res = wx.getWindowInfo()
    if(res) return res

    const res2 = wx.getSystemInfoSync()
    if(!res2) return

    // mock
    const res3: WechatMiniprogram.WindowInfo = {
      pixelRatio: res2.pixelRatio,
      screenWidth: res2.screenWidth,
      screenHeight: res2.screenHeight,
      windowWidth: res2.windowWidth,
      windowHeight: res2.windowHeight,
      statusBarHeight: res2.statusBarHeight,
      safeArea: res2.safeArea,
      screenTop: 0,
    }
    return res3
  }

  static getMenuButtonBoundingClientRect() {
    return wx.getMenuButtonBoundingClientRect()
  }

  static onMenuButtonBoundingClientRectWeightChange(
    listener: WechatMiniprogram.OnMenuButtonBoundingClientRectWeightChangeCallback
  ) {
    if(!wx.onMenuButtonBoundingClientRectWeightChange) return
    return wx.onMenuButtonBoundingClientRectWeightChange(listener)
  }

  static offMenuButtonBoundingClientRectWeightChange(
    listener: WechatMiniprogram.OffMenuButtonBoundingClientRectWeightChangeCallback
  ) {
    if(!wx.offMenuButtonBoundingClientRectWeightChange) return
    return wx.offMenuButtonBoundingClientRectWeightChange(listener)
  }

  static getEnterOptionsSync() {
    return wx.getEnterOptionsSync()
  }

  static getApiCategory(): WechatMiniprogram.ApiCategory {
    // 在快照模式 browseOnly 的情况下，可能返回 undefined
    const res = wx.getApiCategory()
    if(!res) return "browseOnly"
    return res as WechatMiniprogram.ApiCategory
  }

  static onApiCategoryChange(
    listener: WechatMiniprogram.OnApiCategoryChangeCallback
  ) {
    wx.onApiCategoryChange(listener)
  }

  static offApiCategoryChange(
    listener?: WechatMiniprogram.OnApiCategoryChangeCallback,
  ) {
    wx.offApiCategoryChange(listener)
  }

  static getSkylineInfoSync() {
    return wx.getSkylineInfoSync()
  }

  static getDeviceInfo() {
    // 在快照模式 browseOnly 的情况下，可能返回 undefined
    const res = wx.getDeviceInfo()
    if(res) return res

    const res2 = wx.getSystemInfoSync()
    if(!res2) return

    // mock
    const res3: WechatMiniprogram.DeviceInfo = {
      abi: "",
      deviceAbi: "",
      benchmarkLevel: res2.benchmarkLevel,
      brand: res2.brand,
      model: res2.model,
      system: res2.system,
      platform: res2.platform,
      cpuType: "",
      memorySize: "",
    }
    return res3
  }

  static getAppBaseInfo() {
    // 在快照模式 browseOnly 的情况下，可能返回 undefined
    const res = wx.getAppBaseInfo()
    if(res) return res

    const res2 = wx.getSystemInfoSync()
    if(!res2) return

    // mock
    const res3: WechatMiniprogram.AppBaseInfo = {
      SDKVersion: res2.SDKVersion,
      enableDebug: res2.enableDebug,
      host: res2.host,
      language: res2.language,
      version: res2.version,
      theme: res2.theme,
      fontSizeScaleFactor: 1,
      fontSizeSetting: res2.fontSizeSetting,
    }
    return res3
  }

  static request(opt: WechatMiniprogram.RequestOption) {
    return wx.request(opt)
  }

  static uploadFile(opt: WechatMiniprogram.UploadFileOption) {
    return wx.uploadFile(opt)
  }

  static getFileSystemManager() {
    return wx.getFileSystemManager()
  }

  static getEnv() {
    return wx.env
  }

  static async vibrateShort(opt: WechatMiniprogram.LiuVibrateShortOption) {
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

  static async setClipboardData(
    opt: WechatMiniprogram.SetClipboardDataOption,
  ) {
    const res = await wx.setClipboardData(opt)
    return res
  }

  static async showToast(opt: WechatMiniprogram.ShowToastOption) {
    const res = await wx.showToast(opt)
    return res
  }

  static async showModal(opt: WechatMiniprogram.ShowModalOption) {
    const res = await wx.showModal(opt)
    return res
  }

  static async previewImage(
    opt: WechatMiniprogram.PreviewImageOption,
  ) {
    const res = await wx.previewImage(opt)
    return res
  }

  static openCustomerServiceChat(
    opt: WechatMiniprogram.OpenCustomerServiceChatOption,
  ) {
    wx.openCustomerServiceChat(opt)
  }

  static login() {
    const _wait = (a: StrFunc) => {
      wx.login({
        timeout: 5000,
        success(res) {
          a(res.code)
        },
        fail(err) {
          console.warn("login failed: ", err)
          a("")
        }
      })
    }
    return new Promise(_wait)
  }

  static checkSession() {
    const _wait = (a: BoolFunc) => {
      wx.checkSession({
        success() {
          a(true)
        },
        fail(err) {
          console.warn("checkSession failed: ", err)
          a(false)
        }
      })
    }
    return new Promise(_wait)
  }

  static setStorage(opt: WechatMiniprogram.SetStorageOption) {
    opt.key = `liu_${opt.key}`
    return wx.setStorage(opt)
  }

  static async getStorage(opt: WechatMiniprogram.GetStorageOption) {
    opt.key = `liu_${opt.key}`
    try {
      const res = await wx.getStorage(opt)
      return res
    }
    catch(err) {
      return null
    }
  }

  static removeStorage(opt: WechatMiniprogram.RemoveStorageOption) {
    opt.key = `liu_${opt.key}`
    return wx.removeStorage(opt)
  }

  static getLaunchOptionsSync() {
    return wx.getLaunchOptionsSync()
  }

  static onNetworkStatusChange(
    listener: WechatMiniprogram.OnNetworkStatusChangeCallback
  ) {
    wx.onNetworkStatusChange(listener)
  }

  static offNetworkStatusChange(
    listener?: WechatMiniprogram.OnNetworkStatusChangeCallback
  ) {
    wx.offNetworkStatusChange(
      listener as unknown as WechatMiniprogram.OffNetworkStatusChangeCallback
    )
  }

  static downloadFile(
    opt: WechatMiniprogram.DownloadFileOption,
  ) {
    return wx.downloadFile(opt)
  }
  
  static showShareImageMenu(
    opt: WechatMiniprogram.ShowShareImageMenuOption,
  ) {
    return wx.showShareImageMenu(opt)
  }


  static async getSetting(withSubscriptions = true) {
    try {
      const res = await wx.getSetting({ withSubscriptions })
      return res
    }
    catch(err) {
      console.warn("getSetting failed: ", err)
      return
    }
  }

  static async openSetting(withSubscriptions = true) {
    try {
      const res = await wx.openSetting({ withSubscriptions })
      return res
    }
    catch(err) {
      console.warn("openSetting failed: ", err)
      return
    }
  }

  static async requestSubscribeMessage(tmplIds: string[]) {
    try {
      const res = await wx.requestSubscribeMessage({ tmplIds })
      return res
    }
    catch(err) {
      console.warn("requestSubscribeMessage failed: ", err)
      return
    }
  }

  static async openAppAuthorizeSetting() {
    try {
      const res = await wx.openAppAuthorizeSetting()
      return res
    }
    catch(err) {
      console.warn("openAppAuthorizeSetting failed: ", err)
      return
    }
  }

  static getAppAuthorizeSetting() {
    const res = wx.getAppAuthorizeSetting()
    return res
  }

  static chooseContact(opt: WechatMiniprogram.ChooseContactOption) {
    wx.chooseContact(opt)
  }

  static async chooseMedia(opt: WechatMiniprogram.ChooseMediaOption) {
    try {
      const res = await wx.chooseMedia(opt)
      return res
    }
    catch(err) {
      console.warn("chooseMedia err: ")
      console.log(err)
      return
    }
  }

  static async compressImage(opt: WechatMiniprogram.CompressImageOption) {
    try {
      const res = await wx.compressImage(opt)
      return res
    }
    catch(err) {
      console.warn("compressImage err: ")
      console.log(err)
      return
    }
  }

  static async getImageInfo(opt: WechatMiniprogram.GetImageInfoOption) {
    try {
      const res = await wx.getImageInfo(opt)
      return res
    }
    catch(err) {
      console.warn("getImageInfo err: ")
      console.log(err)
      return
    }
  }

  static cropImage(opt: WechatMiniprogram.CropImageOption) {
    wx.cropImage(opt)
  }

  static previewMedia(opt: WechatMiniprogram.PreviewMediaOption) {
    return wx.previewMedia(opt)
  }

  static async getClipboardData() {
    try {
      const res = await wx.getClipboardData()
      return res
    }
    catch(err) {
      console.warn("getClipboardData err: ")
      console.log(err)
      return
    }
  }

  static async showLoading(opt: WechatMiniprogram.ShowLoadingOption) {
    try {
      const res = await wx.showLoading(opt)
      return res
    }
    catch(err) {
      console.warn("showLoading err: ")
      console.log(err)
      return
    }
  }

  static async hideLoading() {
    try {
      const res = await wx.hideLoading()
      return res
    }
    catch(err) {
      console.warn("hideLoading err: ")
      console.log(err)
      return
    }
  }

  static async getChatToolInfo() {
    try {
      const res = await wx.getChatToolInfo({})
      return res
    }
    catch(err) {
      console.warn("getChatToolInfo err: ")
      console.log(err)
      return
    }
  }

  static async selectGroupMembers(opt: WechatMiniprogram.SelectGroupMembersOption) {
    wx.selectGroupMembers(opt)
  }

  static async shareAppMessageToGroup(opt: WechatMiniprogram.ShareAppMessageToGroupOption) {
    try {
      const res = await wx.shareAppMessageToGroup(opt)
      return res
    }
    catch(err) {
      console.warn("shareAppMessageToGroup err: ")
      console.log(err)
      return
    }
  }

  

}