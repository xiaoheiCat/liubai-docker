import { LiuReq } from "~/packageB/requests/LiuReq";
import APIs from "../../../requests/APIs";
import type { WxMiniAPI } from "~/packageB/types/types-wx";
import type { PeopleTasksAPI } from "~/packageB/requests/req-types";
import type { TaskDetail } from "./types";
import { DateUtil } from "~/packageB/utils/date-util";

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
    assignees: data.assigneeList.map(v => v.group_openid),
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