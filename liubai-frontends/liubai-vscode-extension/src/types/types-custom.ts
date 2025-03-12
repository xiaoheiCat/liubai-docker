

export interface ContentConfig {
  showCountdown?: boolean
  allowComment?: boolean
  lastToggleCountdown?: number  // last stamp when user toggle showCountdown
  lastOStateStamp?: number           // last stamp when user edited oState
  lastOperateStateId?: number     // last stamp when user edited stateId
  lastOperatePin?: number        // last stamp when user edited pin
  lastOperateTag?: number        // last stamp when user edited tag
  lastOperateWhenRemind?: number   // last stamp when user 
                                   // edited whenStamp / remindStamp / remind
  lastUpdateEmojiData?: number      // last stamp when emojiData is updated
  lastUpdateLevelNum?: number   // last stamp when levelOne or 
                                // levelOneAndTwo is updated
}

export interface WorkspaceConfig {
  // last stamp when user edited tagList of workspace
  lastOperateTag?: number
}

export interface MemberConfig {
  searchKeywords?: string[]
  searchTagIds?: string[]
  lastOperateName?: number     // last stamp when user edited name
}

export interface MemberNotification {
  ww_qynb_toggle?: boolean
}