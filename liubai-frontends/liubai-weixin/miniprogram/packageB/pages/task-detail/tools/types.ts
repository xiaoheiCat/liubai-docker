import type { PeopleTasksAPI } from "~/packageB/requests/req-types"

export interface TaskDetail {
  desc: string
  owner_openid_list: string[]
  activity_id?: string
  assigneeList: PeopleTasksAPI.AssigneeItem[]
  assignees: string[]
  insertedStamp: number
  editedStamp?: number
  endStamp?: number
  closedStamp?: number
  postedTimeStr: string

  // calculate some state
  isMine: boolean
  hasAnyIncomplete: boolean
  canIComplete: boolean

  // activity
  isActivity: boolean
}