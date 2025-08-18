import type { PeopleTasksAPI } from "~/packageB/requests/req-types"
import { LiuAi } from "~/packageB/types/types-cloud"

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

  // remind
  whenStr?: string
  remindStr?: string
  aiHelpStr?: string
  aiWorker?: LiuAi.AiWorker
  note?: string
}

export type BindingStatus = "followed" | "unfollowed"

export type BtnType = "CompleteTask" | "Reminder" | "Urge" | "Share" | "CreateTask"
  | "CloseTask"
  | "More"
  | "AddNote"