import { LiuApi } from "~/packageB/utils/LiuApi"
import { TaskManager } from "./TaskManager"
import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/packageB/requests/LiuReq"
import { LiuUtil } from "~/packageB/utils/liu-util/index"
import { ShowTip } from "~/packageB/utils/managers/ShowTip"
import { LiuTunnel } from "~/packageB/utils/LiuTunnel"
import type { JustCreateTask, PleaseCreateTask } from "~/packageB/types/types-tunnel"
import { LiuTime } from "~/packageB/utils/LiuTime"
import { LiuRqReturn } from "~/packageB/requests/tools/types"
import type { MiniProgramContext } from "~/packageB/types"

type CreateTaskResolver = (res: LiuRqReturn<any> | null) => void
type JumpToDetailFunc = "navigateTo" | "navigateBack"

let hasCreatedTask = false
let createTaskPromise: Promise<LiuRqReturn<any> | null> | undefined
let jumpToDetailFunc: JumpToDetailFunc | undefined

function toCreateTask(
  desc: string,
  assignees: string[],
) {
  const _wait = async (a: CreateTaskResolver) => {
    const res2 = await TaskManager.init()
    if(!res2) {
      a(null)
      return
    }
    const chatInfo = TaskManager.getChatInfo()
    if(!chatInfo) {
      a(null)
      return
    }
    const w3 = {
      operateType: "create-wx-task",
      desc,
      assignees,
      chatInfo,
    }
    const url3 = APIs.PPL_TASKS
    const res3 = await LiuReq.request(url3, w3)
    hasCreatedTask = true
    a(res3)
  }
  createTaskPromise = new Promise(_wait)
}


export function prePost(
  desc: string,
  assignees: string[],
  ctx: MiniProgramContext,
) {
  jumpToDetailFunc = undefined
  
  // 1. directly create the task
  toCreateTask(desc, assignees)

  // 2. if the previous page is task-detail, try to navigate back
  const pages = LiuApi.getPages()
  const pageLength = pages.length
  if(pageLength > 1) {
    const prevPage = pages[pageLength - 2]
    const prevName = prevPage.data.pageName
    if(prevName === "task-detail") {
      const plzData: PleaseCreateTask = {
        stamp: LiuTime.getTime(),
      }
      LiuTunnel.setStuff("please-create-task", plzData)
      LiuApi.navigateBack()
      jumpToDetailFunc = "navigateBack"
      return
    }
  }
  
  // 3. wait for createTaskPromise
  waitForCreateTask(ctx)
  jumpToDetailFunc = "navigateTo"
}


export async function waitForCreateTask(
  ctx: MiniProgramContext,
) {
  if(!createTaskPromise) return

  // 1. handle loading 
  let isShowLoading = false
  if(!hasCreatedTask) {
    isShowLoading = true
    LiuUtil.showCustomLoading({ title_key: "shared.hold_on" })
  }
  const res1 = await createTaskPromise
  if(isShowLoading) {
    LiuApi.hideLoading()
  }
  resetStates()
  if(!res1) return
  
  // 2. handle result
  const code2 = res1.code
  const id = res1?.data?.id
  if(code2 !== "0000" || !id) {
    ShowTip.showErrMsg("🤨", res1)
    return
  }

  resetPageData(ctx)
  showCreated(id)
}

function resetPageData(ctx: MiniProgramContext) {
  const pageName = ctx.data.pageName
  if(jumpToDetailFunc === "navigateTo" && pageName === "task-create") {
    ctx.setData({
      _val: "",
      inputValue: "",
      assignees: [],
      canSubmit: false,
    })
  }
  jumpToDetailFunc = undefined
}

function resetStates() {
  hasCreatedTask = false
  createTaskPromise = undefined
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
  const url = `/packageB/pages/task-detail/task-detail?id=${id}`
  LiuApi.navigateTo({ 
    url,
    fail(err) {
      console.warn("navigateToDetailById fail 111: ", err)
    }
  })
}