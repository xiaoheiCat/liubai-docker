import { envData } from "~/packageB/config/env-data"
import type { ArticleKey } from "./tools/types"
import type { UserLoginAPI } from "~/packageB/requests/req-types"
import { Loginer } from "~/packageB/utils/login/Loginer"
import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/packageB/requests/LiuReq"

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
      const { data } = e.detail
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

      // 1. save locally
      const loginData = await Loginer.getLoginData()
      if(!loginData) return

      if(!loginData.nickname) {
        loginData.nickname = nickname
      }
      if(headimgurl && !loginData.avatarUrl) {
        loginData.avatarUrl = headimgurl
      }
      await Loginer.setLoginData(loginData)

      // 2. save to cloud
      const url2 = APIs.USER_SETTINGS
      const w2 = {
        operateType: "member-name",
        name: nickname,
        memberId: loginData.memberId,
      }
      await LiuReq.request(url2, w2)
    },

    

  },
  
})