import type { PeopleTasksAPI } from "~/requests/req-types";

export interface TaskCard extends PeopleTasksAPI.WxTaskItem {
  allDone?: boolean
  doneCount?: number
  eachOtherDone?: boolean

  // 在列表上，显示:
  // 单聊里，相对于当前登录用户，另外一位的 group_openid
  otherOpenidForMe?: string
}