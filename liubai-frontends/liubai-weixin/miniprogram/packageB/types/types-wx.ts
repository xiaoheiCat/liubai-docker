

export namespace WxMiniAPI {

  export type ChatType = 1 | 2 | 3 | 4
  
  export interface ChatInfo {
    opengid?: string
    open_single_roomid?: string
    group_openid?: string
    chat_type?: ChatType
  }


}