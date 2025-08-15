import APIs from "~/packageB/requests/APIs"
import { LiuReq } from "~/packageB/requests/LiuReq"
import type { HasNewTaskNote } from "~/packageB/types/types-tunnel"
import { LiuUtil } from "~/packageB/utils/liu-util/index"
import { LiuApi } from "~/packageB/utils/LiuApi"
import { LiuTunnel } from "~/packageB/utils/LiuTunnel"
import { ShowTip } from "~/packageB/utils/managers/ShowTip"

export async function toConfirm(
  id: string,
  note: string,
) {

  // 1. package data for tunnel
  const data1: HasNewTaskNote = { id, note }
  LiuTunnel.setStuff("has-new-task-note", data1)
  LiuApi.navigateBack()

  // 2. to fetch
  const url2 = APIs.PPL_TASKS
  const w2 = {
    operateType: "update-task-note",
    id,
    note,
  }
  const res2 = await LiuReq.request(url2, w2)
  const code2 = res2.code
  if(code2 !== "0000" && code2 !== "0001") {
    console.warn("fail to update note: ", res2)
    ShowTip.showErrMsg("Fail to update note", res2)
    return
  }

  LiuUtil.showCustomToast({
    title_key: "task-detail.updated",
    icon: "success",
  })
}