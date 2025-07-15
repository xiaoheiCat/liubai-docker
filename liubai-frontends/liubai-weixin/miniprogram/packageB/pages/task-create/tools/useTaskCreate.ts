import { LiuApi } from "~/packageB/utils/LiuApi"
import { Loginer } from "~/packageB/utils/login/Loginer"
import { TaskManager } from "../../shared/TaskManager"
import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/requests/LiuReq"
import { LiuUtil } from "~/packageB/utils/liu-util/index"

let hasCheckedName = false

export async function handlePost(
  desc: string,
  assignees: string[],
) {

  // 1. check if my name exists
  if(!hasCheckedName) {
    hasCheckedName = true
    const res1 = await checkOutName()
    if(!res1) return
  }

  // 2. wait for chatInfo
  const res2 = await TaskManager.init()
  if(!res2) return
  const chatInfo = TaskManager.getChatInfo()
  if(!chatInfo) return

  // 3. to fetch
  const w3 = {
    operateType: "create-wx-task",
    desc,
    assignees,
    chatInfo,
  }
  const url3 = APIs.PPL_TASKS
  LiuUtil.showCustomLoading({ title_key: "shared.hold_on" })
  const res3 = await LiuReq.request(url3, w3)
  LiuApi.hideLoading()

  // 4. handle result
  console.log("handlePost res3: ", res3)

}


async function checkOutName() {
  const loginData = await Loginer.getLoginData()

  console.log("checkOutName loginData: ", loginData)

  if(!loginData) return false
  if(loginData.nickname) return true
  
  LiuApi.navigateTo({ 
    url: "/packageB/pages/article/article?key=wxmini-login",
  })
  return false
}