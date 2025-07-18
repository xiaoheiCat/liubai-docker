import { LiuReq } from "../../requests/LiuReq"
import APIs from "../../requests/APIs"
import { LiuApi } from "../../utils/LiuApi"
import { LiuApp } from "../../utils/usePackageB"
import type { WxMiniAPI } from "../../types/types-wx"
import type { PeopleTasksAPI } from "../../requests/req-types"
import { LiuTunnel } from "../../utils/LiuTunnel"
import valTool from "../../utils/val-tool"

export class TaskManager {

  static chatInfo: WxMiniAPI.ChatInfo | null = null

  static async init() {

    // 0. get chat info from tunnel
    const res0 = await LiuTunnel.takeStuff<WxMiniAPI.ChatInfo>("wx-chat-info")
    if(res0) {
      this.chatInfo = res0
      return true
    }

    // 1. login first
    const res1 = await LiuApp.autoLogin()
    if(!res1) return false

    // 2. get chat tool info which is encrypted
    const res2 = await LiuApi.getChatToolInfo()
    if(!res2) {
      return false
    }

    // 3. fetch chat tool info
    const url3 = APIs.PPL_TASKS
    const u3 = {
      operateType: "enter-wx-chat-tool",
      wxData: res2,
    }
    const res3 = await LiuReq.request<PeopleTasksAPI.Res_EnterWxChatTool>(
      url3, u3
    )
    console.log("TaskManager init res3: ", res3)
    if(res3.code === "0000" && res3.data) {
      this.chatInfo = res3.data.chatInfo
    }

    // 4. listen to api category change
    const _this = this
    const _change: WechatMiniprogram.OnApiCategoryChangeCallback = (
      res4
    ) => {
      const apiCategory4 = res4.apiCategory
      if(apiCategory4 !== "chatTool") {
        _this.chatInfo = null
        LiuApi.offApiCategoryChange(_change)
      }
    }
    LiuApi.onApiCategoryChange(_change)

    return true
  }

  static getChatInfo() {
    return valTool.copyObject(this.chatInfo)
  }


}
