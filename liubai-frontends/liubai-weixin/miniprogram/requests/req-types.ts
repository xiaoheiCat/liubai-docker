
import type { LocalTheme } from "~/types/types-atom"
import type { 
  CloudStorageService, 
  LiuSpaceAndMember, 
  UserSubscription,
} from "~/types/types-cloud"
import type { LocalLocale } from "~/types/types-locale"
import type { WxMiniAPI } from "~/types/types-wx"

/********************** Hello World *******************/
export interface Res_HelloWorld {
  stamp: number
}

/********************** User Login and Settings *******************/
export namespace UserLoginAPI {
  export interface Res_Normal {
    // 只有一个 user 符合时
    open_id?: string
    github_id?: number
    theme?: LocalTheme
    language?: LocalLocale
    spaceMemberList?: LiuSpaceAndMember[]
    subscription?: UserSubscription
    serial_id?: string
    token?: string
    userId?: string
  }

  export interface Res_WxMiniSession extends Res_Normal {
    operateType: "wx_mini_session"
    wx_mini_openid: string
  }
}

export namespace UserSettingsAPI {
  export interface Res_Enter {
    email?: string
    github_id?: number
    open_id?: string
    theme: LocalTheme
    language: LocalLocale
    spaceMemberList: LiuSpaceAndMember[]
    subscription?: UserSubscription
    phone_pixelated?: string
    
    /** wechat data */
    wx_gzh_openid?: string
    wx_gzh_nickname?: string
  
    new_serial?: string
    new_token?: string
  }

  export type Res_Latest = Omit<Res_Enter, "new_serial" | "new_token">
}


/****************** Happy System api ***************/
export namespace HappySystemAPI {
  export interface Res_GetShowcase {
    operateType: "get-showcase"
    title: string
    imageUrl?: string
    imageH2W?: string
    footer?: string
  }

  export interface Res_GetWeixinAd {
    operateType: "get-weixin-ad"
    adUnitId: string
    conversationCountFromAd: number
    conversationToAd: number
    credential: string
  }

  export interface Res_PostWeixinAd {
    operateType: "post-weixin-ad"
    conversationCountFromAd: number
  }

  /********************** for Coupons *********************/
  export interface CouponItem {
    _id: string
    title?: string
    copytext?: string
    image_url?: string
    image_h2w?: string
    emoji?: string
    brand?: string
    expireStamp: number

    // for detail
    isMine?: boolean
    drawn?: boolean
  }

  export interface Res_FastSearch {
    fromType: "query" | "cache"
    queryList: CouponItem[]
    searchList?: CouponItem[]
  }

  export interface Res_CouponPost {
    couponId?: string
  }

  export interface Res_CouponStatus {
    can_i_use: boolean
    membership: "free" | "premium"
    tmpl_id_1?: string
    tmpl_id_2?: string
    max_coupons?: number
    posted_coupons?: number
  }
  
  export interface Res_CouponCheck {
    operateType: "coupon-check"
    pass: boolean
    credential?: string
    failReason?: string
  }

  export interface Res_CouponDetail {
    operateType: "coupon-detail"
    detail: CouponItem
  }

  export interface Res_CouponMine {
    operateType: "coupon-mine"
    drawnList: CouponItem[]
    postedList: CouponItem[]
  }

  export interface Param_CouponUpdate {
    operateType: "coupon-update"
    couponId: string
    image_url?: string
    image_h2w?: string
    copytext?: string
    availableDays?: number
  }
}


/************************ Uploading File ********************/
export namespace FileSetAPI {
  export interface Param {
    operateType: "get-upload-token"
    purpose?: "coupon-upload" | "coupon-tmp"
  }

  export interface Res_UploadToken {
    cloudService: CloudStorageService
    uploadToken: string
    prefix: string
  }

  export interface Res_QiniuUploaded {
    cloud_url: string
  }
}

/************************ people tasks ********************/
export namespace PeopleTasksAPI {
  export interface Res_EnterWxChatTool {
    operateType: "enter-wx-chat-tool"
    chatInfo: WxMiniAPI.ChatInfo
  }

  export interface AssigneeItem {
    group_openid: string
    doneStamp?: number
  }
  
  export interface Res_GetWxTask {
    operateType: "get-wx-task"
    infoType: "TASK" | "ACTIVITY"
    id: string
    activity_id?: string
    desc: string
    owner_openid: string
    opengid?: string
    open_single_roomid?: string
    chat_type: WxMiniAPI.ChatType
    assigneeList: AssigneeItem[]
    isMine?: boolean
    insertedStamp: number
    editedStamp?: number
    endStamp?: number
    closedStamp?: number
  }

  export type WxTaskItem = Omit<Res_GetWxTask, "operateType">

  export interface Res_ListWxTasks {
    operateType: "list-wx-tasks"
    tasks: WxTaskItem[]
  }
}