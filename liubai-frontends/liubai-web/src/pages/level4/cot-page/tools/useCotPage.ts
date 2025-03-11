import { onActivated, reactive, watch } from "vue";
import type { CotPageData } from "./types";
import { pageStates } from "~/utils/atom";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import valTool from "~/utils/basic/val-tool";
import liuEnv from "~/utils/liu-env";
import liuReq from "~/requests/liu-req";
import APIs from "~/requests/APIs";
import type { SyncOperateAPI } from "~/types/types-cloud";
import middleBridge from "~/utils/middle-bridge";

export function useCotPage() {
  const cpData = reactive<CotPageData>({
    pageState: pageStates.LOADING,
  })
  initCotPage(cpData)

  onActivated(() => {
    middleBridge.setAppTitle({ val_key: "ai_detail.thinking_process" })
  })

  return {
    cpData
  }
}

function initCotPage(
  cpData: CotPageData,
) {
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) {
    cpData.pageState = pageStates.NEED_BACKEND
    return
  }

  const rr = useRouteAndLiuRouter()
  watch(() => rr.route, (newV) => {
    const chatId = newV.query.chatId
    const isChatIdValid = valTool.isStringWithVal(chatId)
    if(!isChatIdValid) return
    if(cpData.chatId === chatId) return
    cpData.chatId = chatId
    getInfo(cpData)
  }, { immediate: true })
}

async function getInfo(
  cpData: CotPageData,
) {
  const url1 = APIs.SYNC_OPERATE
  const opt1: SyncOperateAPI.Param = {
    operateType: "get-ai-detail",
    chatId: cpData.chatId as string,
  }
  const res1 = await liuReq.request<SyncOperateAPI.Res_GetAiDetail>(url1, opt1)
  const { code, data } = res1

  if(code === "E4003") {
    cpData.pageState = pageStates.NO_AUTH
    return
  }
  if(code.startsWith("F") || code.startsWith("B")) {
    cpData.pageState = pageStates.NETWORK_ERR
    return
  }
  if(!data?.reasoningContent) {
    cpData.pageState = pageStates.NO_DATA
    return
  }

  cpData.reasoningContent = data.reasoningContent
  cpData.pageState = pageStates.OK
}