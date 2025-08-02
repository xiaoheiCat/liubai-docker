import type { LocalTheme } from "../types/types-atom"
import type { 
  CloudStorageService, 
  LiuSpaceAndMember, 
  UserSubscription,
} from "../types/types-cloud"
import type { LocalLocale } from "../types/types-locale"
import type { WxMiniAPI } from "../types/types-wx"

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

  export interface Res_WxGzhForMini {
    operateType: "wx_gzh_for_mini"
    nickname: string
    headimgurl?: string
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


export namespace HappySystemAPI {
  export interface Res_GetAdData {
    operateType: "get-ad-data"
    rewardedAdUnitId?: string
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

}
