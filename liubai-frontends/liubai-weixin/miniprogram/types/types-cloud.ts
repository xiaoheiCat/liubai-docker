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


/*************************** AI ************************/
export namespace LiuAi {

  export type AiProvider = "aliyun-bailian" | "baichuan" | "deepseek" | "tencent-hunyuan" 
  | "minimax" | "moonshot" | "stepfun" | "zero-one" | "zhipu" | "jina"

  export type AiSecondaryProvider = "siliconflow" | "gitee-ai" | "qiniu" | "tencent-lkeap"
  | "suanleme"

  export type ComputingProvider = AiProvider | AiSecondaryProvider

  // AiCharacter 不跟供应商绑定，它是角色，只不过现在各个供应商都有自己的 To C 角色罢了
  export type AiCharacter = "baixiaoying" | "deepseek" | "hailuo" | "hunyuan" | "kimi" | "yuewen" | 
  "wanzhi" | "zhipu" | "ds-reasoner" | "tongyi-qwen"

  export interface AiWorker {
    computingProvider: ComputingProvider
    model: string
    character?: AiCharacter
    stream?: boolean
  }

}