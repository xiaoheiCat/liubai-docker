import type { PeopleTasksAPI } from "~/requests/req-types";

export interface TaskItem extends PeopleTasksAPI.WxTaskItem {
  allDone?: boolean
  doneCount?: number
  eachOtherDone?: boolean
}