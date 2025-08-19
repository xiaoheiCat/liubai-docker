import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/packageB/requests/LiuReq"
import { LiuRqReturn } from "~/packageB/requests/tools/types"
import type { UpdateTaskTextType } from "~/packageB/types/types-atom"
import type { HasNewTaskText } from "~/packageB/types/types-tunnel"
import { LiuUtil } from "~/packageB/utils/liu-util/index"
import { LiuApi } from "~/packageB/utils/LiuApi"
import { LiuTunnel } from "~/packageB/utils/LiuTunnel"
import { ShowTip } from "~/packageB/utils/managers/ShowTip"

export async function toConfirm(
  id: string,
  text: string,
  updateType: UpdateTaskTextType,
) {
  text = text.trim()

  // 1. package data for tunnel
  const data1: HasNewTaskText = { id, text, updateType }
  LiuTunnel.setStuff("has-new-task-text", data1)
  LiuApi.navigateBack()

  // 2. to fetch
  let res2: LiuRqReturn<Record<string, any>> | undefined
  if(updateType === "title") {
    res2 = await toUpdateTitle(id, text)
  }
  else if(updateType === "note") {
    res2 = await toUpdateNote(id, text)
  }
  if(!res2) return

  // 3. handle result
  const code2 = res2.code
  if(code2 !== "0000" && code2 !== "0001") {
    console.warn("fail to update text: ", res2)
    ShowTip.showErrMsg("Fail to update text", res2)
    return
  }

  LiuUtil.showCustomToast({
    title_key: "task-detail.updated",
    icon: "success",
  })
}

async function toUpdateNote(
  id: string,
  note: string,
) {
  const url1 = APIs.PPL_TASKS
  const w1 = {
    operateType: "update-task-note",
    id,
    note,
  }
  const res1 = await LiuReq.request(url1, w1)
  return res1
}

async function toUpdateTitle(
  id: string,
  title: string,
) {
  const url1 = APIs.PPL_TASKS
  const w1 = {
    operateType: "update-task-title",
    id,
    title,
  }
  const res2 = await LiuReq.request(url1, w1)
  return res2
}
  