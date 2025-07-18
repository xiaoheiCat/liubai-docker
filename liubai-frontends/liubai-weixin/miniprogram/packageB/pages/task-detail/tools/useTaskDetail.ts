import { LiuReq } from "~/packageB/requests/LiuReq";
import APIs from "../../../requests/APIs";
import type { WxMiniAPI } from "~/packageB/types/types-wx";
import type { 
  HappySystemAPI, 
  PeopleTasksAPI,
} from "~/packageB/requests/req-types";
import type { TaskDetail } from "./types";
import { DateUtil } from "~/packageB/utils/date-util";
import valTool from "~/packageB/utils/val-tool";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { useI18n } from "~/packageB/locales/index";
import { LiuRewardedVideo } from "./liu-rewarded-video";
import { LiuUtil } from "~/packageB/utils/liu-util/index";

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
  chatInfo: WxMiniAPI.ChatInfo,
  data: PeopleTasksAPI.Res_GetWxTask,
) {
  const assigneeList = data.assigneeList
  const postedTimeStr = DateUtil.showBasicTime(data.insertedStamp)

  // calculate some state
  const isMyTask = chatInfo.group_openid === data.owner_openid
  let hasAnyIncomplete = assigneeList.some(v => !v.doneStamp)
  let canIComplete = assigneeList.some(v => {
    if(v.group_openid === chatInfo.group_openid) {
      return !Boolean(v.doneStamp)
    }
    return false
  })
  
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
    isMyTask,
    hasAnyIncomplete,
    canIComplete,
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
  // 1. pull ad
  const req1 = { operateType: "get-ad-data" }
  const url1 = APIs.HAPPY_SYSTEM
  const res1 = await LiuReq.request<HappySystemAPI.Res_GetAdData>(url1, req1)
  const rewardedAdUnitId = res1.data?.rewardedAdUnitId
  if(!rewardedAdUnitId) return

  let hasShownModal = false
  const ad = LiuRewardedVideo.init(rewardedAdUnitId)
  if(!ad) {
    showYouAreGreat()
    return
  }
  ad.onLoad(res => {
    console.log("rewardedVideoAd onLoad......", res)
    if(hasShownModal) return
    hasShownModal = true
    showYouAreGreat()
  })
  ad.onError(err => {
    console.warn("rewardedVideoAd onError: ", err)
  })
  LiuRewardedVideo.tryToLoad() 
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
    success(res) {
      if(!res.confirm) return
      LiuRewardedVideo.showRewardedVideoAd()
    }
  })
}