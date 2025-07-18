import { LiuUtil, type CustomModalOpt } from "../liu-util/index";

export class ShowTip {

  static cannotUse() {
    LiuUtil.showCustomModal({
      title_key: "shared.cannot_use_1",
      content_key: "shared.try_again_later",
      showCancel: false,
      confirm_key: "shared.confirm",
    })
  }

  static async showErrMsg(
    title: string,
    err?: any,
  ) {
    let content = "请截图本页面，联系客服"

    if(typeof err === "string") {
      content += `:\n${err}`
    }
    else if(err?.errMsg && typeof err.errMsg === "string") {
      content += `:\n${err.errMsg}`
    }
    else if(err?.toString && typeof err.toString === "function") {
      content += `:\n${err.toString()}`
    }
    const opt: CustomModalOpt = {
      title,
      content,
      confirm_key: "shared.contact_us",
      success(res) {
        if(res.confirm) {
          LiuUtil.toContactUs()
        }
      }
    }
    LiuUtil.showCustomModal(opt)
  }

  static showOpenMiniForBrowseOnly() {
    LiuUtil.showCustomModal({
      title_key: "shared.open_mini_1",
      content_key: "shared.open_mini_2",
      confirm_key: "shared.got_it",
      showCancel: false,
    })
  }

}