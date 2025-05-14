


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
}


