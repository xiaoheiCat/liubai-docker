import { LiuReq } from "~/packageB/requests/LiuReq";
import APIs from "../../../requests/APIs";
import { WxMiniAPI } from "~/packageB/types/types-wx";
import { PeopleTasksAPI } from "~/packageB/requests/req-types";
import { DateUtil } from "~/packageB/utils/date-util";
import type { TaskDetail } from "./types";

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


export function showDetail(data: PeopleTasksAPI.Res_GetWxTask) {
  const postedTimeStr = DateUtil.showBasicTime(data.insertedStamp)
  const detail: TaskDetail = {
    desc: data.desc,
    owner_openid_list: [data.owner_openid],
    activity_id: data.activity_id,
    assigneeList: data.assigneeList,
    assignees: data.assigneeList.map(v => v.group_openid),
    insertedStamp: data.insertedStamp,
    editedStamp: data.editedStamp,
    endStamp: data.endStamp,
    postedTimeStr,
  }
  return detail
}