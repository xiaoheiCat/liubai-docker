import APIs from "~/requests/APIs";
import { LiuReq } from "~/requests/LiuReq";
import type { PeopleTasksAPI } from "~/requests/req-types";
import { LiuApi } from "~/utils/LiuApi";
import { LiuTunnel } from "~/utils/LiuTunnel";
import { LiuApp } from "~/utils/useApp";

export async function handleGroupInfo() {

  // 1. check out scene while entering
  const enterInfo = LiuApi.getEnterOptionsSync()
  const scene = enterInfo.scene

  // 1008: 群聊会话里的小程序卡片
  // 1158: 群工具打开小程序
  // 1160: 群待办
  // 1185: 群公告
  const aboutGroupScenes = [1158, 1160, 1185]
  if(!aboutGroupScenes.includes(scene)) return

  // 2. wait for autoLogin
  const res2 = await LiuApp.autoLogin()
  if(!res2) return

  // 3. get group enter info
  LiuApi.getGroupEnterInfo({
    allowSingleChat: true,
    needGroupOpenID: true,
    success(res) {
      console.log("getGroupEnterInfo success", res)
      fetchGroupInfo(res)
    },
    fail(err) {
      console.warn("getGroupEnterInfo fail", err)
    }
  })
}


async function fetchGroupInfo(
  wxData: WechatMiniprogram.GetGroupEnterInfoSuccessCallbackResult
) {
  const url1 = APIs.PPL_TASKS
  const u1 = {
    operateType: "enter-wx-chat-tool",
    wxData,
  }
  const res1 = await LiuReq.request<PeopleTasksAPI.Res_EnterWxChatTool>(url1, u1)
  console.log("fetchGroupInfo res1: ", res1)

  // 2. handle result after fetching
  const code2 = res1.code
  const data2 = res1.data
  if(code2 !== "0000") return
  if(!data2) return
  const chatInfo = data2.chatInfo
  const chatType = chatInfo.chat_type
  if(!chatType) return
  const roomid = chatInfo.opengid ?? chatInfo.open_single_roomid
  if(!roomid) return

  // 3. invoke openChatTool
  const url3 = "/packageB/pages/task-create/task-create"
  LiuTunnel.setStuff("wx-chat-info", chatInfo)
  LiuApi.openChatTool({
    url: url3,
    roomid,
    chatType,
    success(res) {
      console.log("fetchGroupInfo openChatTool success", res)
    },
    fail(err) {
      console.warn("fetchGroupInfo openChatTool fail", err)
      LiuTunnel.clear()
    }
  })

  
}