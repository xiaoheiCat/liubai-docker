import { LiuApi } from "~/packageB/utils/LiuApi"
import { LiuTime } from "~/packageB/utils/LiuTime"
import { Loginer } from "~/packageB/utils/login/Loginer"

let lastCheckNameStamp = 0

export function checkNameExisted() {
  // 1. check out frequency
  const inOneMinute = LiuTime.isWithinMillis(lastCheckNameStamp, LiuTime.MINUTE)
  if(inOneMinute) return true
  lastCheckNameStamp = LiuTime.getTime()

  // 2. check nickname
  const loginData = Loginer.getLoginDataSync()
  if (!loginData?.nickname) {
    LiuApi.navigateTo({
      url: "/packageB/pages/article/article?key=wxmini-login",
    })
    return false
  }
  return true
}