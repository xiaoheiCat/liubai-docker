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


function getAuthInfo(
  apData: ApData,
  state: string,
  credential: string,
) {
  apData.state = state
  apData.credential = credential

  // 1. fetch 
  const url1 = APIs.AUTHORIZE

  setTimeout(() => {
    apData.appType = "windsurf"
    apData.pageState = pageStates.OK
  }, 1000)

}