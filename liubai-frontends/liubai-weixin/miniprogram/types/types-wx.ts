

export namespace WxMiniAPI {

  /**
   * 1: 微信单聊
   * 2: 企业微信联系人单聊
   * 3: 普通微信群聊
   * 4: 企业微信互通群聊
   */
  export type ChatType = 1 | 2 | 3 | 4
  
  export interface ChatInfo {
    opengid?: string
    open_single_roomid?: string
    group_openid?: string
    chat_type?: ChatType
  }

}