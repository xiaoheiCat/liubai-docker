import { UpdateTaskTextType } from "./types-atom"

export interface JustCreateTask {
  stamp: number
  id: string
}

export interface PleaseCreateTask {
  stamp: number
}

export interface UpdateTaskText {
  stamp: number
  id: string
  updateType: UpdateTaskTextType
  text?: string
  read_clipboard?: boolean
}

export interface HasNewTaskText {
  id: string
  text: string
  updateType: UpdateTaskTextType
}