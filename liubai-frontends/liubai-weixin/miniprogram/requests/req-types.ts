


/********************** Hello World *******************/
export interface Res_HelloWorld {
  stamp: number
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
}


