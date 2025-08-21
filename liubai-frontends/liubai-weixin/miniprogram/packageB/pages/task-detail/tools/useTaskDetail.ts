import { LiuReq } from "~/packageB/requests/LiuReq";
import APIs from "../../../requests/APIs";
import type { WxMiniAPI } from "~/packageB/types/types-wx";
import type {
  PeopleTasksAPI,
  Res_OC_BindWeChat,
  Res_OC_GetWeChat,
} from "~/packageB/requests/req-types";
import type { TaskDetail } from "./types";
import { DateUtil } from "~/packageB/utils/date-util";
import valTool from "~/packageB/utils/val-tool";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { useI18n } from "~/packageB/locales/index";
import { LiuUtil } from "~/packageB/utils/liu-util/index";
import { defaultData } from "~/packageB/config/default-data";
import { Loginer } from "~/packageB/utils/login/Loginer";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import type { UpdateTaskText } from "~/packageB/types/types-tunnel";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { TaskManager } from "../../shared/TaskManager";
import type { LiuRemindMe } from "~/packageB/types/types-atom";

export async function fetchTaskDetail(
  id: string,
  chatInfo: WxMiniAPI.ChatInfo,
) {
  const w1 = {
    operateType: "get-wx-task",
    id,
    chatInfo,
  }
  const url1 = APIs.PPL_TASKS
  const res1 = await LiuReq.request<PeopleTasksAPI.Res_GetWxTask>(url1, w1)
  return res1
}


export function showDetail(
  data: PeopleTasksAPI.Res_GetWxTask,
  chatInfo?: WxMiniAPI.ChatInfo,
) {
  const assigneeList = data.assigneeList
  const postedTimeStr = DateUtil.showBasicTime(data.insertedStamp)

  // calculate some state
  let isMine = data.isMine
  if(typeof isMine === "undefined") {
    isMine = chatInfo?.group_openid === data.owner_openid
  }
  let hasAnyIncomplete = assigneeList.some(v => !v.doneStamp)
  let canIComplete = assigneeList.some(v => {
    if(v.group_openid === chatInfo?.group_openid) {
      return !Boolean(v.doneStamp)
    }
    return false
  })

  // when & remind
  let whenStr: string | undefined
  let remindStr: string | undefined
  let whenStamp: number | undefined
  let remindMe: LiuRemindMe | undefined
  if(data.whenStamp) {
    whenStr = DateUtil.showBasicTime(data.whenStamp)
    whenStamp = data.whenStamp
  }
  if(data.remindMe && data.remindStamp) {
    remindStr = DateUtil.getRemindMeStrAfterPost(
      data.remindStamp, 
      data.remindMe,
    )
    remindMe = data.remindMe
  }

  // ai help
  const { t } = useI18n()
  let aiHelpStr: string | undefined
  if(data.aiWorker?.character) {
    const aiName = t(`ai-character.${data.aiWorker.character}`)
    aiHelpStr = t(`ai-related.help_to_organize`, { name: aiName })
  }
  
  
  // set detail
  const detail: TaskDetail = {
    desc: data.desc,
    owner_openid_list: [data.owner_openid],
    activity_id: data.activity_id,
    assigneeList,
    assignees: assigneeList.map(v => v.group_openid),
    insertedStamp: data.insertedStamp,
    editedStamp: data.editedStamp,
    endStamp: data.endStamp,
    closedStamp: data.closedStamp,
    postedTimeStr,
    isMine,
    hasAnyIncomplete,
    canIComplete,
    isActivity: data.infoType === "ACTIVITY",
    whenStr,
    remindStr,
    whenStamp,
    remindMe,
    aiHelpStr,
    aiWorker: data.aiWorker,
    note: data.note,
  }
  return detail
}


export function toNotifyMembers(
  id: string,
  detail: TaskDetail,
) {
  const assigneeList = detail.assigneeList
  if(!assigneeList) return
  
  // 1. handle members
  const list1 = assigneeList.filter(v => !v.doneStamp)
  const members = list1.map(v => v.group_openid)
  if(members.length < 1) return
  console.log("members: ", members)

  // 2. handle title
  const desc = detail.desc
  const title = getNotifyTitle(desc)
  if(!title) {
    toForward(id, desc)
    return
  }
  const res2 = Math.abs(desc.length - title.length)
  if(res2 > 5 && title.length < 10) {
    toForward(id, desc)
    return
  }
  console.log("getNotifyTitle result:", title)

  // 3. handle entrancePath
  const entrancePath = `packageB/pages/task-detail/task-detail?id=${id}`

  // 4. to call notifyMembers
  LiuApi.notifyGroupMembers({
    title,
    members,
    entrancePath,
    type: "complete",
    success(res) {
      console.log("notifyGroupMembers success: ", res)
    },
    fail(err) {
      console.warn("notifyGroupMembers fail: ", err)
      const errMsg = err?.errMsg
      if(errMsg.includes("cancel")) return
      // ShowTip.showErrMsg("提醒失败", err)
      toForward(id, desc)
    }
  })
}

export function toForward(
  id: string,
  title?: string,
  justCreated?: boolean,
) {
  if(!title) {
    const { t } = useI18n()
    title = t("task-detail.forward_2")
  }
  const path = `packageB/pages/task-detail/task-detail?id=${id}`
  let imageUrl = "/packageB/images/shared/task-reminder.jpg"
  if(justCreated) {
    imageUrl = "/packageB/images/shared/you-have-a-new-task.jpg"
  }

  LiuApi.shareAppMessageToGroup({ 
    title,
    path,
    imageUrl,
    success(res) {
      console.log("shareAppMessageToGroup success: ", res)
    },
    fail(err) {
      console.warn("shareAppMessageToGroup fail: ", err)
    }
  })
}

function getNotifyTitle(desc: string) {
  desc = desc.trim()
  let title = ""
  let num = 0
  for(let i=0; i<desc.length; i++) {
    const char = desc[i]

    if(num >= 30) break

    // 1. for chinese
    const cnNum = valTool.getChineseCharNum(char)
    if(cnNum > 0) {
      if(valTool.isChinesePunctuation(char)) {
        console.warn("isChinesePunctuation: ", char)
        continue
      }
      num += 2
      title += char
      continue
    }

    // 2. for english
    if(valTool.isAllEnglishChar(char)) {
      num += 1
      title += char
      continue
    }

    // 3. for number
    if(valTool.isStringAsNumber(char)) {
      num += 1
      title += char
      continue
    }
    
  }

  return title
}

export async function fetchCloseTask(id: string) {
  const w1 = {
    operateType: "close-wx-task",
    id,
  }
  const url1 = APIs.PPL_TASKS
  const res1 = await LiuReq.request(url1, w1)
  return res1
}

export async function fetchCompleteTask(id: string) {
  const w1 = {
    operateType: "complete-wx-task",
    id,
  }
  const url1 = APIs.PPL_TASKS
  const res1 = await LiuReq.request(url1, w1)
  return res1
}

export async function afterCompleteTask() {
  showYouAreGreat()
}

function showYouAreGreat() {
  const list = ["1", "2", "3", "4", "5"]
  const r = Math.floor(Math.random() * list.length)
  const index = list[r]
  const content_key = `task-detail.great_${index}`
  LiuUtil.showCustomModal({
    title_key: "task-detail.done_it",
    content_key,
    showCancel: false,
  })
}

export function toCreateOtherTask(
  chatInfo: WxMiniAPI.ChatInfo,
) {
  const _pushRoute = () => {
    LiuUtil.navigateWithPopup("/packageB/pages/task-create/task-create")
  }

  const pages = LiuApi.getPages()
  if(pages.length > 1) {
    _pushRoute()
    return
  }

  const alert_text_key = "task-detail.create_for_title"
  let first_key = "task-detail.create_for_current_chat"
  if(chatInfo.opengid) {
    first_key = "task-detail.create_for_current_group"
  }
  const item_key_list = [
    first_key,
    "task-detail.create_for_others",
  ]
  LiuUtil.showCustomActionSheet({
    alert_text_key,
    item_key_list,
    success(res) {
      if(res.tapIndex === 0) {
        LiuApi.vibrateShort({ type: "medium" })
        _pushRoute()
        return
      }
      const url = defaultData.homePath + "?key2=CREATE_TASK"
      LiuApi.restartMiniProgram({ path: url })
    },
    fail(err) {
      console.warn("showCustomActionSheet fail: ", err)
    }
  })
}

export async function checkForUpdatingTitle(
  id: string,
  oldTitle: string,
) {
  // 1. wait and fetch
  await valTool.waitMilli(1500)
  const chatInfo = TaskManager.getChatInfo()
  if(!chatInfo) {
    console.warn("no chatInfo in checkForUpdatingTitle")
    return
  }

  // 2. fetch
  const res1 = await fetchTaskDetail(id, chatInfo)
  const code1 = res1.code
  const data1 = res1.data
  if(code1 !== "0000" || !data1) return

  // 3. check out desc (title)
  const newTitle = data1.desc
  if(newTitle === oldTitle) {
    console.warn("it's weird that the title is not updated")
    console.log("newTitle: ", newTitle)
    console.log("oldTitle: ", oldTitle)
    return
  }

  // 4. show modal
  LiuUtil.showCustomModal({
    title_key: "task-detail.updated",
    content_key: "task-detail.updated_tip",
    confirm_key: "shared.ok",
    success(res3) {
      if(!res3.confirm) return
      const { t } = useI18n()
      const title3 = t("task-detail.updated_prefix", { desc: newTitle })
      toForward(id, title3)
    }
  })
}

export async function jumpToUpdateTitle(
  id: string,
  detail: TaskDetail,
) {
  const isMine = detail.isMine
  if(!isMine) {
    LiuUtil.showCustomModal({
      title: "🫢",
      content_key: "task-detail.title_for_guests",
      showCancel: false,
    })
    return
  }
  
  const data: UpdateTaskText = {
    stamp: LiuTime.getTime(),
    id,
    updateType: "title",
    text: detail.desc,
  }
  LiuTunnel.setStuff("update-task-text", data)
  LiuUtil.navigateWithPopup("/packageB/pages/task-update-text/task-update-text")
}

export async function getBindingStatus() {
  const loginData = await Loginer.getLoginData()
  console.log("getBindingStatus loginData: ", loginData)
  if(!loginData) return
  const memberId = loginData.memberId
  if(!memberId) return

  const url1 = APIs.OPEN_CONNECT
  const w1 = {
    operateType: "get-wechat",
    memberId,
  }
  const res1 = await LiuReq.request<Res_OC_GetWeChat>(url1, w1)
  console.log("getBindingStatus res1: ", res1)
  if(res1.code !== "0000" || !res1.data) return
  return res1.data
}

export async function getQrCodePicUrlForBindingWx() {
  const loginData = await Loginer.getLoginData()
  const memberId = loginData?.memberId
  if(!memberId) return

  const url1 = APIs.OPEN_CONNECT
  const w1 = {
    operateType: "bind-wechat",
    memberId,
  }
  const res1 = await LiuReq.request<Res_OC_BindWeChat>(url1, w1)
  const data1 = res1.data
  console.log("getQrCodePicUrlForBindingWx res1: ", data1)
  if(res1.code !== "0000" || !data1) return
  const wx_qr_ticket = data1.wx_qr_ticket
  if(!wx_qr_ticket) return
  const ticket = encodeURIComponent(wx_qr_ticket)
  const picUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticket}`
  return picUrl
}


export function whenTapAI(
  detail: TaskDetail,
) {
  LiuApi.vibrateShort({ type: "light" })
  const aiWorker = detail.aiWorker
  if(!aiWorker) return

  const { t } = useI18n()
  const provider = t(`computing_provider.${aiWorker.computingProvider}`)
  if(!provider) return
  const model = aiWorker.model

  LiuUtil.showCustomModal({
    title_key: "ai-related.your_task",
    content_key: "ai-related.your_task_tip",
    content_opt: { model, provider },
    showCancel: false,
  })
}

export function toAddNote(
  id: string,
  detail: TaskDetail,
  promptToReadClipboard = false,
) {
  if(!promptToReadClipboard) {
    jumpToAddNote(id, detail, false)
    return
  }
  
  LiuUtil.showCustomModal({
    title: "📋",
    content_key: "task-detail.read_clipboard_tip",
    confirm_key: "shared.ok",
    success(res) {
      if(res.confirm) {
        LiuApi.vibrateShort({ type: "light" })
      }
      jumpToAddNote(id, detail, res.confirm)
    }
  })
}

function jumpToAddNote(
  id: string,
  detail: TaskDetail,
  read_clipboard: boolean,
) {
  const data: UpdateTaskText = {
    stamp: LiuTime.getTime(),
    id,
    updateType: "note",
    text: detail.note,
    read_clipboard,
  }
  LiuTunnel.setStuff("update-task-text", data)
  LiuApi.navigateTo({ 
    url: "/packageB/pages/task-update-text/task-update-text",
    routeType: "wx://upwards",
  })
}

export function whenTapNote(
  id: string,
  detail: TaskDetail,
) {
  LiuUtil.showCustomActionSheet({
    alert_text_key: "task-detail.note_title",
    item_key_list: [
      "shared.copy",
      "shared.edit",
    ],
    success(res) {
      LiuApi.vibrateShort({ type: "light" })
      const idx = res.tapIndex
      if(idx === 0) {
        LiuUtil.toCopy(detail.note ?? "")
      }
      else if(idx === 1) {
        toAddNote(id, detail)
      }
    }
  })

}