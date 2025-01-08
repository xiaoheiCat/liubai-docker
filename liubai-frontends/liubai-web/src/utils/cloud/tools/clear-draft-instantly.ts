import type { Res_SyncSet_Client, SyncSetAtom } from "~/types/cloud/sync-set/types"
import { whenDraftClear } from "./add-upload-task"
import ider from "~/utils/basic/ider"
import time from "~/utils/basic/time"
import liuReq from "~/requests/liu-req"
import APIs from "~/requests/APIs"
import usefulTool from "~/utils/basic/useful-tool"

export async function clearDraftInstantly(draftId: string, userId: string) {

  // 1. clear local draft operations
  await whenDraftClear(draftId, userId)

  // 2. package atom
  const atom: SyncSetAtom = {
    taskType: "draft-clear",
    taskId: ider.createUploadTaskId(),
    operateStamp: time.getTime(),
    draft: { id: draftId, oState: "POSTED" }
  }
  const opt2 = {
    operateType: "general_sync",
    plz_enc_atoms: [atom],
  }

  // 3. request
  const url3 = APIs.SYNC_SET
  const res3 = await liuReq.request<Res_SyncSet_Client>(url3, opt2)

  // 4. handle response
  const results = res3.data?.results
  const theRes = results?.[0]
  const code4 = theRes?.code

  if(usefulTool.isRequestSuccess(code4)) {
    return true
  }

  return false
}
