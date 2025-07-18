import type { BaseIsOn } from "./types-atom"


export interface Cloud_ImageStore {
  id: string
  name: string
  lastModified: number       // 文件最后修改的时间戳，精确到 ms
  mimeType?: string
  width?: number
  height?: number
  h2w?: string
  url: string
  url_2?: string             // 低分辨率的图片地址
  blurhash?: string
  someExif?: any
  size?: number              // 单位为 bytes
}


export interface LiuSpaceAndMember {
  // 关于 member 的信息
  memberId: string
  member_name?: string
  member_avatar?: Cloud_ImageStore
}

/** 用户的订阅方案 */
export interface UserSubscription {
  isOn: BaseIsOn
  plan: string
  isLifelong: boolean
  autoRecharge?: boolean
  createdStamp: number
  chargedStamp?: number
  firstChargedStamp?: number
  expireStamp?: number
  chargeTimes?: number
}

/*************************** 云存储 **********************/
// 云存储服务
export type CloudStorageService = "qiniu" | "tecent_cos" | "aliyun_oss"