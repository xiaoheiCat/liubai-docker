import type { LiuLoginData } from "~/types/index";
import { LiuApi } from "../LiuApi";
import { fetchEnter, fetchLogin } from "./tools/fetch-user";
import { getLoginLocally, removeLoginLocally, setLoginLocally } from "./tools/local-login";
import { LiuTime } from "../LiuTime";
import type { LiuSpaceAndMember } from "~/types/types-cloud";


export class Loginer {

  static hasFetched = false

  static canILogin() {
    const res = LiuApi.getApiCategory()
    if(res === "browseOnly") return false
    return true
  }

  static async getLoginData(
    checkingSession = false,
  ) {
    // 1. get login data
    const res1 = await getLoginLocally()
    if(!res1) return
    if(!checkingSession) return res1

    // 2. check session
    const res2 = await LiuApi.checkSession()
    if(!res2) return

    return res1
  }

  static async run() {
    // 1. get login data
    const res1 = await this.getLoginData(true)
    if(res1) {
      const res1_2 = await this.toRefresh()
      return res1_2
    }

    // 2. to login
    const res2 = await this.toLogin()
    return res2
  }

  private static async toLogin() {
    // 1. get js_code
    const js_code = await LiuApi.login()
    if(!js_code) return

    // 2. fetch login
    const res2 = await fetchLogin(js_code)
    if(!res2) return

    // 3. handle data
    const data3 = res2.data
    if(!data3) return
    if(!data3.serial_id || !data3.token) return
    
    // 4. get avatar & nickname
    const avaNick = this._getAvatarAndNickname(data3.spaceMemberList)
    const newLoginData: LiuLoginData = {
      theme: data3.theme,
      language: data3.language,
      token: data3.token,
      serial: data3.serial_id,
      subscription: data3.subscription,
      nickname: avaNick.nickname,
      avatarUrl: avaNick.avatarUrl,
      wx_mini_openid: data3.wx_mini_openid,
      lastSetStamp: LiuTime.getTime(),
    }
    
    // 5. to set login data
    await setLoginLocally(newLoginData)
    this.hasFetched = true
    return true
  }

  private static async toRefresh() {
    // 1. fetch
    const res1 = await fetchEnter()
    if(!res1) return
    const code1 = res1.code
    console.log("toRefresh res1: ", res1)

    // 2. if the login state has been expired
    if(code1 === "E4003" || code1 === "E4004") {
      removeLoginLocally()
      const res2 = await this.toLogin()
      return res2
    }
    const data1 = res1.data
    if(!data1) return

    // 3. merge login data
    const oldData = await this.getLoginData()
    const avaNick = this._getAvatarAndNickname(data1.spaceMemberList)
    const newData: LiuLoginData = {
      ...oldData,
      theme: data1.theme,
      language: data1.language,
      subscription: data1.subscription,
      nickname: avaNick.nickname,
      avatarUrl: avaNick.avatarUrl,
      lastSetStamp: LiuTime.getTime(),
    }
    if(data1.new_serial && data1.new_token) {
      newData.serial = data1.new_serial
      newData.token = data1.new_token
    }
    
    // 4. to update
    await setLoginLocally(newData)
    this.hasFetched = true
    return true
  }


  private static _getAvatarAndNickname(
    spaceMemberList?: LiuSpaceAndMember[],
  ) {
    if(!spaceMemberList) return {}
    const spaceMember = spaceMemberList[0]
    const avatarUrl = spaceMember.member_avatar?.url
    const nickname = spaceMember.member_name
    return { avatarUrl, nickname }
  }


}