
export interface JustCreateTask {
  stamp: number
  id: string
}

export interface PleaseCreateTask {
  stamp: number
}

export interface AddTaskNote {
  stamp: number
  id: string
  note?: string
  read_clipboard?: boolean
}