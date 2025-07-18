import { envData } from "~/packageB/config/env-data"
import type { ArticleKey } from "./tools/types"
import type { UserLoginAPI } from "~/packageB/requests/req-types"
import { Loginer } from "~/packageB/utils/login/Loginer"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  data: {
    url: "",
  },

  methods: {

    onLoad(query?: Record<string, string>) {
      if(!query) return
      const key = query.key as ArticleKey
      if(key === "wxmini-login") {
        this.handleWxMiniLogin()
      }

    },

    handleWxMiniLogin() {
      let url = envData.LIU_WEB_DOMAIN
      if(!url) return
      url += "/wxmini-login"
      this.setData({ url })
    },

    onWebViewMessage(e: any) {
      console.log("onWebViewMessage: ", e)
      const { data } = e.detail
      console.log("data: ", data)
      if(!data || data.length === 0) return
      
      const msg = data[0] as UserLoginAPI.Res_WxGzhForMini
      if(!msg) return
      if(msg.operateType === "wx_gzh_for_mini") {
        this.saveUserInfo(msg)
      }
    },

    async saveUserInfo(msg: UserLoginAPI.Res_WxGzhForMini) {
      const { nickname, headimgurl } = msg
      if(!nickname) return

      const loginData = await Loginer.getLoginData()
      if(!loginData) return

      if(!loginData.nickname) {
        loginData.nickname = nickname
      }
      if(headimgurl && !loginData.avatarUrl) {
        loginData.avatarUrl = headimgurl
      }
      await Loginer.setLoginData(loginData)
    },

    

  },
  
})