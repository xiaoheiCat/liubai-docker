


export interface IbData {
  a2hs: boolean
  newVersion: boolean
  webPush: boolean
}

export type IbDataKey = keyof IbData

export interface IbChildProps {
  title: string
  desc: string
  confirmText: string
  expand: boolean
}

export interface IbChildEmits {
  (evt: "confirm"): void
  (evt: "cancel"): void
}

export interface IbChildData {
  enable: boolean
  show: boolean
}