import type { LiuContent, LiuRemindMe, LiuUploadTask } from "./types-atom"
import type { BaseIsOn, OState } from "./types-basic"
import type { Cloud_ImageStore, LiuSpaceAndMember } from "./types-cloud"
import type { EmojiData } from "./types-content"
import type { ContentConfig } from "./types-custom"


/********************** Hello World *******************/
export interface Res_HelloWorld {
  stamp: number
}

/****************** user-login api ***************/
export namespace UserLoginAPI {
  export interface Param_AuthRequest {
    operateType: "auth_request"
    redirect_uri: string
    state: string
  }

  export interface Res_AuthRequest {
    operateType: "auth_request"
    credential: string
    baseUrl: string
  }

  export interface Param_AuthSubmit {
    operateType: "auth_submit"
    credential: string
    code: string
    enc_client_key: string
  }

  export interface Res_Init {
    publicKey?: string
    githubOAuthClientId?: string
    googleOAuthClientId?: string
    wxGzhAppid?: string
    state?: string
  }

  export interface Res_Normal {
    spaceMemberList?: LiuSpaceAndMember[]
    serial_id?: string
    token?: string
    userId?: string
  }

}

/****************** user-settings api ***************/
export namespace UserSettingsAPI {
  export interface Res_Enter {
    email?: string
    github_id?: number
    open_id?: string
    spaceMemberList: LiuSpaceAndMember[]
  
    new_serial?: string
    new_token?: string
  }

  export type Res_Latest = Omit<Res_Enter, "new_serial" | "new_token">
}


export namespace SyncSetAPI {

  export interface LiuUploadBase {
    id?: string          // 如果是已上传过的内容，必须有此值，这是后端的 _id
    first_id?: string    // 能传就传
    spaceId?: string     // 发表时，必填，表示存到哪个工作区
  
    liuDesc?: LiuContent[]
    images?: Cloud_ImageStore[]

    editedStamp?: number
  }

  export interface LiuUploadThread extends LiuUploadBase {

    // 仅在 thread-post 时有效且此时必填
    oState?: Exclude<OState, "DELETED">
  
    title?: string
    calendarStamp?: number
    remindStamp?: number
    whenStamp?: number
    remindMe?: LiuRemindMe
    pinStamp?: number
  
    createdStamp?: number
    removedStamp?: number
  
    tagIds?: string[]
    tagSearched?: string[]
    stateId?: string
    stateStamp?: number
  
    // 只在 thread-post 时有效，且此时必填
    emojiData?: EmojiData
    config?: ContentConfig
  
    // 只在 thread-hourglass 时有效，且为必填，不得为 undefined
    showCountdown?: boolean
  
    // ai chat associated with this thread
    // in compose page, we have to set aiChatId
    aiChatId?: string
    aiReadable?: BaseIsOn
  }

  export interface Atom {
    taskType: LiuUploadTask
    taskId: string
  
    thread?: LiuUploadThread
  
    operateStamp: number // 表示这个操作被发起的时间戳，非常重要，用于校时用
  }

  export interface AtomRes {
    code: string
    taskId: string
    errMsg?: string
    first_id?: string  // the first id of either content or draft
    new_id?: string    // the new id of either content or draft
  }

  export interface Param_SingleSync {
    operateType: "single_sync"
    plz_enc_atoms: Atom[]
  }

  export interface Res_Client {
    results: AtomRes[]
  }

}