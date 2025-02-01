import { reactive, watch } from "vue";
import type { ApData } from "./types";
import { pageStates } from "~/utils/atom";
import liuEnv from "~/utils/liu-env";
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router";
import valTool from "~/utils/basic/val-tool";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { UserSettingsAPI } from "~/requests/req-types";
import { showErrMsg } from "~/pages/level1/tools/show-msg";


export function useAuthoizePage() {

  const apData = reactive<ApData>({
    pageState: pageStates.LOADING,
    state: "",
    credential: "",
  })

  const rr = useRouteAndLiuRouter()
  initAuthorizePage(apData, rr)

  return {
    apData,
  }
}


function initAuthorizePage(
  apData: ApData,
  rr: RouteAndLiuRouter,
) {
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) {
    apData.pageState = pageStates.NEED_BACKEND
    return
  }

  watch(rr.route, (newV) => {
    const q = newV.query
    const { state, credential } = q
    const hasVal1 = valTool.isStringWithVal(state)
    const hasVal2 = valTool.isStringWithVal(credential)
    if(hasVal1 && hasVal2) {
      getAuthInfo(apData, state, credential)
    }
  }, { immediate: true })
}


async function getAuthInfo(
  apData: ApData,
  state: string,
  credential: string,
) {
  apData.state = state
  apData.credential = credential

  // 1. fetch 
  const url1 = APIs.AUTHORIZE
  const opt1 = {
    operateType: "auth-get-info",
    credential,
  }
  const res1 = await liuReq.request<UserSettingsAPI.Res_AuthGetInfo>(url1, opt1)
  const { code, data } = res1

  console.log("see code: ", code)

  // 2. handle result after fetching
  if(code === "E4003") {
    apData.pageState = pageStates.NO_AUTH
    return
  }
  if(code === "E4004") {
    apData.pageState = pageStates.NO_DATA
    return
  }
  if(!data) {
    apData.pageState = pageStates.NETWORK_ERR
    showErrMsg("other", res1)
    return
  }

  apData.appType = data.appType
  apData.serial = data.serial
  apData.pageState = pageStates.OK
}