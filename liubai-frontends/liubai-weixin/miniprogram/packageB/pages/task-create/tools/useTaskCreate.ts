import { LiuApi } from "~/packageB/utils/LiuApi"
import { Loginer } from "~/packageB/utils/login/Loginer"
import { TaskManager } from "../../shared/TaskManager"
import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/packageB/requests/LiuReq"
import { LiuUtil } from "~/packageB/utils/liu-util/index"
import { ShowTip } from "~/packageB/utils/managers/ShowTip"
import { LiuTunnel } from "~/packageB/utils/LiuTunnel"
import { JustCreateTask } from "~/packageB/types/types-tunnel"
import { LiuTime } from "~/packageB/utils/LiuTime"

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
  // if(!res2) return
  const chatInfo = TaskManager.getChatInfo()
  // if(!chatInfo) return

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
  const code4 = res3.code
  const id = res3?.data?.id
  if(code4 !== "0000" || !id) {
    ShowTip.showErrMsg("🤨", res3)
    return
  }

  showCreated(id)
}

async function showCreated(id: string) {
  const data1: JustCreateTask = {
    stamp: LiuTime.getTime(),
    id,
  }
  await LiuTunnel.setStuff("just-create-task", data1)

  LiuUtil.showCustomModal({
    content_key: "task-create.created_1",
    confirm_key: "shared.view",
    showCancel: false,
    success() {
      navigateToDetailById(id)
    }
  })
}

async function navigateToDetailById(id: string) {
  const pages = LiuApi.getPages()
  const pageLength = pages.length
  if(pageLength > 1) {
    const prevPage = pages[pageLength - 2]
    const prevName = prevPage.data.pageName
    if(prevName === "task-detail") {
      LiuApi.navigateBack()
      return
    }
  }

  const url = `/packageB/pages/task-detail/task-detail?id=${id}`
  LiuApi.redirectTo({ 
    url,
    success(res) {
      console.log("navigateToDetailById success 111: ", res)
    },
    fail(err) {
      console.warn("navigateToDetailById fail 111: ", err)
    }
  })
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