import type { LiuRemindMe } from "~/packageB/types/types-atom"

export interface DateItem {
  text: string
  year: number
  month: number   // from 0
  date: number
}

export interface RemindItem {
  text: string
  early_minute: number
}

export interface SubmitData {
  whenStamp: number
  remindStamp: number
  remindMe: LiuRemindMe
}
