import { useGlobalLoading } from "./tools/useGlobalLoading"
import { useGlobalEvent } from "./tools/useGlobalEvent";
import liuApi from "~/utils/liu-api"
import { init as initForSystem } from "~/utils/system/init"
import { onMounted, onUnmounted, provide } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";
import liuEnv from "~/utils/liu-env";
import { useIdsChanged } from "./tools/useIdsChanged";
import localCache from "~/utils/system/local-cache";
import { deviceChaKey } from "~/utils/provide-keys";
import type { GetChaRes } from "~/utils/liu-api/tools/types";
import { listenLoaded, listenWxJSBridgeReady } from "./tools/listen-loaded"
import { initServiceWorker } from "./pwa/useServiceWorker"
import { initListenError } from "./tools/initListenError";
import { initAnalytics } from "./tools/initAnalytics";
import type { LocalOnceData } from "~/utils/system/tools/types";
import { useScreenOrientation } from "./useVueUse";
import time from "~/utils/basic/time";
import { initAwake } from "./tools/initAwake";
import limit from "~/utils/limit";
import { initLayout } from "./tools/initLayout";
import { initListenDexie } from "./tools/initListenDexie";
import searchController from "~/utils/controllers/search-controller";
import { getVConsole } from "./useVConsole";

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  initListenError()
  initListenDexie()

  const cha = liuApi.getCharacteristic()
  const onceData = initOnceData()

  // init device characteristics
  initDeviceCha(cha)

  // init mobile
  initMobile(cha, onceData)

  // 监听路由变化，若加载过久，窗口顶部会出现加载条
  useGlobalLoading()

  // 监听全局事件
  useGlobalEvent()

  // init analytics
  initAnalytics()

  // init search worker and db hooks
  searchController.init()

  // init space & CloudFiler & LocalToCloud or initForPureLocalMode
  initForSystem()

  // init text selection
  initListenSelection()

  // init useIdsChanged
  useIdsChanged()

  // listen to document loaded
  listenLoaded()

  // listen to wx jsbridge ready
  if (cha.isWeChat) {
    listenWxJSBridgeReady()
  }

  // init service worker
  initServiceWorker()

  // 在一段时间后，监听页面被显示
  initAwake()

  initLayout()

  limit.init()

  return {
    cha,
  }
}


function initOnceData() {
  const onceData = localCache.getOnceData()
  if (!onceData.launchStamp) {
    const now = time.getTime()
    onceData.launchStamp = now
    localCache.setOnceData("launchStamp", now)
  }

  const launchNum = onceData.launchNum ?? 0
  localCache.setOnceData("launchNum", launchNum + 1)

  return onceData
}


function initDeviceCha(cha: GetChaRes) {
  provide(deviceChaKey, cha)
}

function printInit() {
  const version = LIU_ENV.version
  const _env = liuEnv.getEnv()
  const email = _env.EMAIL_1 ?? LIU_ENV.author?.email
  const versionLabel = `v${version}`

  // gradient title
  const titleStyle = [
    "font-family: 'Arial Black', 'Helvetica Neue', sans-serif",
    "font-size: 56px",
    "font-weight: 900",
    "letter-spacing: 6px",
    "line-height: 1.6",
    "background: linear-gradient(135deg, #1c5671, #2a6885, #88d1ff, #bfdfed, #88d1ff, #2a6885)",
    "color: transparent",
    "-webkit-background-clip: text",
    "background-clip: text",
    "text-shadow: 0 2px 12px rgba(42, 104, 133, 0.3)",
  ].join(";")

  const versionStyle = [
    "color: #88d1ff",
    "font-family: Menlo, Monaco, 'Courier New', monospace",
    "font-size: 11px",
    "font-weight: 700",
    "letter-spacing: 0.6px",
    "background: linear-gradient(135deg, #1c5671, #2a6885)",
    "padding: 3px 10px",
    "border-radius: 10px",
    "margin-left: 4px",
  ].join(";")

  const lines = [`%cLiUBAi %c${versionLabel}`]
  const styles: string[] = [titleStyle, versionStyle]

  if (email) {
    lines.push(
      `%c\n%c  We're recruiting!  %c  %c${email}`,
    )
    styles.push(
      "",
      [
        "color: #fff",
        "background: linear-gradient(135deg, #1c5671, #2a6885, #3a8aaa)",
        "padding: 4px 12px",
        "border-radius: 10px",
        "font-family: 'Helvetica Neue', sans-serif",
        "font-size: 11px",
        "font-weight: 800",
        "letter-spacing: 0.5px",
      ].join(";"),
      "",
      [
        "color: #2a6885",
        "font-family: Menlo, Monaco, 'Courier New', monospace",
        "font-size: 12px",
        "font-weight: 600",
        "letter-spacing: 0.3px",
      ].join(";"),
    )
  }

  console.log(lines.join(""), ...styles)
  console.log(" ")
}

function initListenSelection() {
  const gStore = useGlobalStateStore()
  let lastText = ""

  // 如果 selection 发生了改变则触发
  // 但如果上一次选中的文字和这一次的都是空白的，那么则忽略
  const whenSelect = (e: Event) => {
    const nowText = liuApi.getSelectionText()
    if (!nowText && !lastText) return
    lastText = nowText
    gStore.setLatestSelectionChange()
  }

  onMounted(() => {
    document.addEventListener("selectionchange", whenSelect)
  })

  onUnmounted(() => {
    document.removeEventListener("selectionchange", whenSelect)
  })
}


async function initMobile(
  cha: GetChaRes,
  onceData: LocalOnceData,
) {
  // 1. lock screen orientation
  if (cha.isMobile) {
    setTimeout(() => {
      toLockOrientation(cha)
    }, time.SECOND)
  }

  // 2. open vconsole
  const _open = async () => {
    const VConsole = await getVConsole()
    if (!VConsole) {
      printInit()
      console.warn("vconsole is unavailable in current environment")
      return
    }

    new VConsole({
      onReady() {
        printInit()
        console.log("characteristic: ", cha)
        console.log(" ")
      }
    })
    import("~/styles/mobile-style.css")
  }

  if (onceData.mobile_debug) {
    _open()
    return
  }

  printInit()
}


async function toLockOrientation(
  cha: GetChaRes,
) {
  const {
    isSupported,
    orientation,
  } = useScreenOrientation()

  if (!isSupported.value) {
    console.log("screen orientation is not supported")
    return
  }

  // const oType = orientation.value
  // console.log("let me see orientation: ", oType)

}
