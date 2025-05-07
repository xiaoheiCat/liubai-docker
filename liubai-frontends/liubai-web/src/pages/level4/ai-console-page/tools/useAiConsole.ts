
import { onActivated, reactive, watch } from "vue"
import type { AcData } from "./types"
import { pageStates } from "~/utils/atom";
import middleBridge from "~/utils/middle-bridge";
import liuEnv from "~/utils/liu-env";
import { useActiveSyncNum } from "~/hooks/useCommon";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { UserSettingsAPI } from "~/requests/req-types";

export function useAiConsole() {
  const acData = reactive<AcData>({
    pageState: pageStates.LOADING,
  })
  initAiConsole(acData)

  watch(() => acData.voicePreference, (newV, oldV) => {
    if(newV === oldV) return
    if(!oldV) return
    toSetAiConsole(acData)
  })

  onActivated(() => {
    middleBridge.setAppTitle({ val_key: "ai_console.title" })
  })

  return {
    acData,
  }
}


async function toSetAiConsole(
  acData: AcData,
) {
  const url = APIs.AI_CONSOLE
  const body = { 
    operateType: "ai-console-set",
    voicePreference: acData.voicePreference ?? "female",
  }
  await liuReq.request(url, body)
}

async function toGetAiConsole(
  acData: AcData,
) {
  const url = APIs.AI_CONSOLE
  const body = { operateType: "ai-console-get" }
  const res1 = await liuReq.request<UserSettingsAPI.Res_AiConsoleGet>(url, body)
  const { code, data } = res1

  if(code === "E4003") {
    acData.pageState = pageStates.NO_AUTH
    return
  }
  if(code.startsWith("F") || code.startsWith("B") || !data) {
    acData.pageState = pageStates.NETWORK_ERR
    return
  }

  acData.voicePreference = data.voicePreference ?? "female"
  acData.pageState = pageStates.OK
}

async function initAiConsole(
  acData: AcData,
) {
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) {
    acData.pageState = pageStates.NEED_BACKEND
    return
  }

  const { activeSyncNum } = useActiveSyncNum()
  watch(activeSyncNum, (newV) => {
    if(newV > 0) toGetAiConsole(acData)
  }, { immediate: true })
}