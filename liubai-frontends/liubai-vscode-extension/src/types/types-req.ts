import type { LiuSpaceAndMember } from "./types-cloud"


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