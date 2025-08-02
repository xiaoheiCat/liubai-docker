import { LiuReq } from "../../requests/LiuReq"
import APIs from "../../requests/APIs"
import { LiuApi } from "../../utils/LiuApi"
import { LiuApp } from "../../utils/usePackageB"
import type { WxMiniAPI } from "../../types/types-wx"
import type { PeopleTasksAPI } from "../../requests/req-types"
import { LiuTunnel } from "../../utils/LiuTunnel"
import valTool from "../../utils/val-tool"
import { LiuTime } from "~/packageB/utils/LiuTime"

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
    const d1_1 = LiuTime.getLocalTime()
    const res1 = await LiuApp.autoLogin()
    const d1_2 = LiuTime.getLocalTime()
    console.log(`TaskManager autoLogin taken: ${d1_2 - d1_1}ms`)
    if(!res1) return false

    // 2. get chat tool info which is encrypted
    const d2_1 = LiuTime.getLocalTime()
    const res2 = await LiuApi.getChatToolInfo()
    const d2_2 = LiuTime.getLocalTime()
    console.log(`TaskManager getChatToolInfo taken: ${d2_2 - d2_1}ms`)
    if(!res2) {
      return false
    }

    // 3. fetch chat tool info
    const url3 = APIs.PPL_TASKS
    const u3 = {
      operateType: "enter-wx-chat-tool",
      wxData: res2,
    }
    const d3_1 = LiuTime.getLocalTime()
    const res3 = await LiuReq.request<PeopleTasksAPI.Res_EnterWxChatTool>(
      url3, u3
    )
    const d3_2 = LiuTime.getLocalTime()
    console.log(`TaskManager enter-wx-chat-tool taken: ${d3_2 - d3_1}ms`)
    console.log("TaskManager init res3: ", res3)
    console.log(" ")
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

  static setChatInfo(chatInfo: WxMiniAPI.ChatInfo) {
    this.chatInfo = chatInfo
  }


}
