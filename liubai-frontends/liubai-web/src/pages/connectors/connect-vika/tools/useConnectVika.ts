import { reactive, watch } from "vue"
import type { CwData } from "./types"
import liuEnv from "~/utils/liu-env"
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router"
import type { Res_OC_GetVika } from "~/requests/req-types"
import { pageStates } from "~/utils/atom"
import { useAwakeNum } from "~/hooks/useCommon"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import { useDebounceFn, useThrottleFn } from "~/hooks/useVueUse"
import { showErrMsg } from "~/pages/level1/tools/show-msg"
import cui from "~/components/custom-ui"
import time from "~/utils/basic/time"

let lastUserInputStamp = 0

export function useConnectVika() {
  const hasBE = liuEnv.hasBackend()
  const rr = useRouteAndLiuRouter()

  const cwData = reactive<CwData>({
    pageState: hasBE ? pageStates.LOADING : pageStates.NEED_BACKEND,
    backup_toggle: false,
    canSave: false,
    isSaving: false,
    original_api_token: "",
    original_datasheet_id: "",
  })

  const { awakeNum, syncNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    if(newV < 1) return
    if(syncNum.value < 1) return
    if(!hasBE) return
    checkoutData(cwData, rr)
  }, { immediate: true })

  const onBackupChanged = useThrottleFn((newV: boolean) => {
    toChangeBackup(cwData, newV)
  }, 400)

  const onBackupInput = useDebounceFn(() => {
    lastUserInputStamp = time.getTime()
    const oldV1 = cwData.original_api_token
    const oldV2 = cwData.original_datasheet_id
    const newV1 = cwData.api_token ?? ""
    const newV2 = cwData.datasheet_id ?? ""
    const isDifferent = Boolean(oldV1 !== newV1 || oldV2 !== newV2)
    cwData.canSave = isDifferent
  }, 100)

  const onTapConfigMethod = () => {
    const link = "https://docs.liubai.cc/guide/connect/vika"
    window.open(link, "_blank")
  }
  
  return {
    cwData,
    onBackupChanged,
    onBackupInput,
    onTapSave: () => toSave(cwData),
    onTapConfigMethod,
  }
}

async function toSave(
  cwData: CwData,
) {
  if(!cwData.canSave) return
  if(cwData.isSaving) return

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2.1 check out api_token
  const tmp_token = cwData.api_token ?? ""
  const api_token = tmp_token.trim()
  if(api_token) {
    const res1 = api_token.length >= 10
    if(!res1) {
      cwData.canSave = false
      cui.showModal({
        title: "🤔",
        content_key: "connect.vika_apitoken_err",
        isTitleEqualToEmoji: true,
        showCancel: false,
      })
      return
    }
  }

  // 2.2 check out datasheet id
  const tmp_datasheet_id = cwData.datasheet_id ?? ""
  const datasheet_id = tmp_datasheet_id.trim()
  if(datasheet_id) {
    const res1 = datasheet_id.length >= 10 && datasheet_id.startsWith("dst")
    if(!res1) {
      cwData.canSave = false
      cui.showModal({
        title: "🤔",
        content_key: "connect.vika_datasheet_err",
        isTitleEqualToEmoji: true,
        showCancel: false,
      })
      return
    }
  }

  // 3. construct query
  const url3 = APIs.OPEN_CONNECT
  const q3 = {
    operateType: "set-vika",
    memberId,
    enable: "Y",
    plz_enc_vika_api_token: api_token,
    plz_enc_vika_datasheet_id: datasheet_id,
  }
  lastUserInputStamp = time.getTime()
  cwData.isSaving = true
  const res3 = await liuReq.request(url3, q3)
  cwData.isSaving = false
  
  // 4. handle result
  const code4 = res3.code
  if(code4 !== "0000") {
    showErrMsg("other", res3)
    return
  }
  cwData.original_api_token = api_token
  cwData.original_datasheet_id = datasheet_id
  cwData.canSave = false
  cui.showSnackBar({ text_key: "common.saved" })
}

async function toChangeBackup(
  cwData: CwData,
  newVal: boolean,
) {
  cwData.backup_toggle = newVal

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. construct query
  const data2 = {
    operateType: "set-vika",
    memberId,
    enable: newVal ? "Y" : "N",
  }
  lastUserInputStamp = time.getTime()
  const url2 = APIs.OPEN_CONNECT
  const res2 = await liuReq.request(url2, data2)
  
  // 3. handle result
  const code3 = res2.code
  if(code3 !== "0000") {
    cwData.backup_toggle = !newVal
    showErrMsg("other", res2)
    return
  }

  if(newVal && cwData.api_token && cwData.datasheet_id) {
    cui.showSnackBar({ text_key: "common.opened" })
  }
  else if(!newVal) {
    cui.showSnackBar({ text_key: "common.closed" })
  }
}

async function checkoutData(
  cwData: CwData,
  rr: RouteAndLiuRouter,
) {

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. fetch data
  const url2 = APIs.OPEN_CONNECT
  const w2 = {
    operateType: "get-vika",
    memberId,
  }
  const res2 = await liuReq.request<Res_OC_GetVika>(url2, w2)

  // 3. handle data
  const code3 = res2.code
  const data3 = res2.data

  // 4. handle response
  if(code3 === "E4003") {
    cwData.pageState = pageStates.NO_AUTH
  }
  else if(code3 === "E4004") {
    cwData.pageState = pageStates.NO_DATA
  }
  else if(code3 === "0000") {
    cwData.pageState = pageStates.OK
  }
  else {
    cwData.pageState = pageStates.NETWORK_ERR
  }

  // 5. handle some required data
  if(code3 !== "0000" || !data3) return
  if(time.isWithinMillis(lastUserInputStamp, 1000)) return
  cwData.backup_toggle = Boolean(data3.enable === "Y")

  const new_api_token = data3.api_token ?? ""
  if(new_api_token !== cwData.original_api_token) {
    cwData.api_token = data3.api_token
    cwData.original_api_token = new_api_token
  }

  const new_datasheet_id = data3.datasheet_id ?? ""
  if(new_datasheet_id !== cwData.original_datasheet_id) {
    cwData.datasheet_id = data3.datasheet_id
    cwData.original_datasheet_id = new_datasheet_id
  }
}