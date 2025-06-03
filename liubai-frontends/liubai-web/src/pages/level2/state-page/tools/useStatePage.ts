import { provide, reactive, ref, watch } from "vue"
import { useThrottleFn, useWindowSize } from "~/hooks/useVueUse"
import { stateProvideKey } from "./types"
import type { 
  StateWhichPage, 
  KanbanData,
  StateProvideData,
  StatePageCtx,
} from "./types"
import type { KanbanColumn } from "~/types/types-content"
import type { LiuAtomState, WhyThreadChange } from "~/types/types-atom"
import stateController from "~/utils/controllers/state-controller/state-controller"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import { storeToRefs } from "pinia"
import { useLiuWatch } from "~/hooks/useLiuWatch"
import { kanbanInnerChangeKey } from "~/utils/provide-keys"
import time from "~/utils/basic/time"
import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import cui from "~/components/custom-ui"
import cfg from "~/config"
import ider from "~/utils/basic/ider"
import liuUtil from "~/utils/liu-util"
import localCache from "~/utils/system/local-cache"
import type { 
  LiuDownloadParcel, 
  SyncGet_ThreadList, 
  SyncGet_CheckContents,
} from "~/types/cloud/sync-get/types"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import { CloudEventBus } from "~/utils/cloud/CloudEventBus"
import { useAwakeNum } from "~/hooks/useCommon"

export function useStatePage() {

  /************** 处理布局 *************/
  // 1: 列表;    2: 看板
  const whichPage = ref<StateWhichPage>(0)

  // 判断 优先展示列表还是看板
  const { width } = useWindowSize()
  if(width.value < 600) whichPage.value = 1
  else whichPage.value = 2

  const onNaviChange = (index: StateWhichPage) => {
    whichPage.value = index
  }


  /*************** 处理数据 ***********/
  const kanban = reactive<KanbanData>({
    name: "kanban_is_really_cool",
    columns: []
  })
  const showReload = ref(false)
  const ctx: StatePageCtx = {
    kanban,
    showReload,
  }


  initKanbanColumns(ctx)

  /*************** 监听 thread-show 的变化 **********/
  listenThreadShowChanged(ctx)

  /*************** 传递 reload 给子组件 ************** */
  initProvideData(ctx)

  return {
    whichPage,
    onNaviChange,
    kanban,
  }
}


function initProvideData(
  ctx: StatePageCtx
) {

  const onTapReload = () => {
    toRefresh(ctx)
  }

  const onTapAddState = () => {
    toAddState(ctx)
  }

  const stateProvideData: StateProvideData = {
    showReload: ctx.showReload,
    tapreload: onTapReload,
    tapaddstate: onTapAddState,
  }

  provide(stateProvideKey, stateProvideData)
}

async function toAddState(
  ctx: StatePageCtx,
) {
  const stateList = stateController.getStates()
  if(stateList.length >= cfg.max_kanban_column) {
    cui.showModal({
      title_key: "state_related.kanban_h1",
      content_key: "state_related.kanban_b1",
      content_opt: { max: "8" },
      showCancel: false
    })
    return
  }

  const res = await cui.showStateEditor({ mode: "create" })
  if(res.action !== "confirm" || !res.data) return
  const rData = res.data

  // 检查名称是否重复
  let replicated = false
  stateList.forEach(v => {
    if(v.text === rData.text) replicated = true
  })
  if(replicated) {
    cui.showModal({
      title_key: "tip.tip",
      content_key: "state_related.replicate_kanban_name",
      showCancel: false,
    })
    return
  }

  const now = time.getTime()

  // 去创建
  const atom: LiuAtomState = {
    id: ider.createStateId(),
    showInIndex: rData.showInIndex,
    showFireworks: rData.showFireworks,
    text: rData.text,
    color: rData.color,
    updatedStamp: now,
    insertedStamp: now,
  }
  stateList.splice(0, 0, atom)
  const res2 = await stateController.setNewStateList(stateList, {
    speed: "instant",
  })
  
  // 在视图上创建一个
  const { kanban } = ctx
  const col: KanbanColumn = {
    id: atom.id,
    showInIndex: atom.showInIndex,
    showFireworks: atom.showInIndex,
    text: atom.text,
    colorShow: liuUtil.colorToShow(atom.color as string),
    threads: [],
    updatedStamp: now,
    insertedStamp: now,
    hasMore: false,
  }
  kanban.columns.splice(0, 0, col)
}

async function toRefresh(
  ctx: StatePageCtx,
  snackbar = true
) {
  const { kanban } = ctx
  const stateList = stateController.getStates()
  const columns = transferStateListToColumns(stateList)
  const oldList = kanban.columns
  const newList: KanbanColumn[] = []
  for(let i=0; i<columns.length; i++) {
    const v1 = columns[i]
    const v2 = oldList.find(v => v.id === v1.id)
    if(v2) {
      newList.push(v2)
    }
    else {
      newList.push(v1)
    }
  }
  kanban.columns = newList

  await toGetThreads(ctx)
  if(snackbar) cui.showSnackBar({ text_key: "tip.refreshed" })
}


function listenThreadShowChanged(
  ctx: StatePageCtx
) {
  const { awakeNum, syncNum, isActivated } = useAwakeNum()
  let reloadRequired = false
  const followEvents: WhyThreadChange[] = [
    "delete", 
    "delete_forever", 
    "undo_delete",
    "state",
    "undo_state",
    "restore",
    "float_up",
    "undo_float_up",
    "edit",
    "new_thread",
  ]

  // 内部改变的时间戳
  const lastInnerStampRef = ref(time.getTime())
  provide(kanbanInnerChangeKey, lastInnerStampRef)

  const tStore = useThreadShowStore()
  tStore.$subscribe((mutation, state) => {
    if(time.isWithinMillis(lastInnerStampRef.value, 600)) return
    
    const tmp = followEvents.includes(state.whyChange)
    if(!tmp) return

    if(isActivated.value) {
      toRefresh(ctx, false)
    }
    else {
      reloadRequired = true
    }
  })

  const _toFetch = useThrottleFn(() => {    
    fetchUserAndRefresh(ctx)
  }, 50 * time.SECOND)

  watch(awakeNum, (newV) => {

    // console.warn("awakeNum newV")
    // console.log(newV)
    // console.log(" ")

    if(reloadRequired) {
      ctx.showReload.value = true
      toRefresh(ctx, false)
      reloadRequired = false
      return
    }

    if(newV < 2) return
    if(syncNum.value < 1) return

    _toFetch()
  })

}

async function fetchUserAndRefresh(
  ctx: StatePageCtx,
) {
  const justLaunched = liuUtil.check.isJustAppSetup()
  if(justLaunched) {
    // console.warn("justLaunched.......")
    toRefresh(ctx, false)
    return
  }

  // console.warn("fetchUserAndRefresh.......")
  const res = await CloudEventBus.getLatestUserInfo()
  if(!res) return
  // console.log("toRefresh triggered by fetchUserAndRefresh")
  toRefresh(ctx, false)
}


function initKanbanColumns(
  ctx: StatePageCtx
) {
  const wStore = useWorkspaceStore()
  const spaceIdRef = storeToRefs(wStore).spaceId

  const _getData = () => {
    // console.log("initKanbanColumns......")
    toGetColumns(ctx)
    toGetThreads(ctx)
  }

  useLiuWatch(spaceIdRef, _getData)
}

function toGetColumns(
  ctx: StatePageCtx
) {
  const { kanban } = ctx
  const stateList = stateController.getStates()
  kanban.columns = transferStateListToColumns(stateList)
}

async function toGetThreads(
  ctx: StatePageCtx,
  cloud = true,
) {
  const { kanban } = ctx
  for(let i=0; i<kanban.columns.length; i++) {
    const col = kanban.columns[i]
    const opt = {
      stateId: col.id, 
      excludeInKanban: false,
    }
    const data = await stateController.getThreads(opt)
    // console.log("see threads: ")
    // console.log(data.threads)
    col.hasMore = data.hasMore
    col.threads = data.threads
  }

  if(cloud) {
    loadCloud(ctx)
  }
}


async function loadCloud(
  ctx: StatePageCtx,
) {
  // 1. check if we has logged in
  const hasBE = localCache.hasLoginWithBackend()
  if(!hasBE) return
  const { kanban } = ctx
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  if(!spaceId) {
    console.warn("no spaceId!")
    return
  }
  const ids: string[] = []

  // 2. to fetch
  const promises: Array<Promise<LiuDownloadParcel[] | undefined>> = []
  for(let i=0; i<kanban.columns.length; i++) {
    const col = kanban.columns[i]
    const param: SyncGet_ThreadList = {
      taskType: "thread_list",
      spaceId,
      viewType: "STATE",
      limit: cfg.max_kanban_thread,
      stateId: col.id,
    }
    const pro = CloudMerger.request(param, { maxStackNum: 5 })
    promises.push(pro)
    ids.push(...col.threads.map(v => v._id))
  }

  // 3. wait all promises
  const res3 = await Promise.all(promises)
  // console.warn("loadCloud in useStatePage: ")
  // console.log(res3)

  // 4. handle ids which are not synced
  let hasAnyPromiseSuccess = false
  for(let i=0; i<res3.length; i++) {
    const parcels = res3[i]
    if(!parcels) continue
    hasAnyPromiseSuccess = true
    for(let j=0; j<parcels.length; j++) {
      const v = parcels[j]
      const idx = ids.indexOf(v.id)
      if(idx >= 0){
        ids.splice(idx, 1)
      }
    }
  }

  // 5. sync ids
  if(hasAnyPromiseSuccess && ids.length > 0) {
    console.warn("check ids: ")
    console.log(ids)
    const param5: SyncGet_CheckContents = {
      taskType: "check_contents",
      ids,
    }
    const res5 = await CloudMerger.request(param5)
    console.log("check ids res5: ")
    console.log(res5)
  }

  if(hasAnyPromiseSuccess) {
    toGetThreads(ctx, false)
  }
}



function transferStateListToColumns(
  stateList: LiuAtomState[]
) {

  const columns = stateList.map(v => {
    // 处理文字
    let text_key = ""
    const text = v.text
    if(!text) {
      if(v.id === "TODO") text_key = "thread_related.todo"
      else if(v.id === "FINISHED") text_key = "thread_related.finished"
    }

    // 处理颜色
    let color = v.color
    if(!color) {
      color = "--liu-state-1"
      if(v.id === "FINISHED") color = "--liu-state-2"
    }
    const colorShow = liuUtil.colorToShow(color)

    const obj: KanbanColumn = {
      id: v.id,
      showInIndex: v.showInIndex,
      showFireworks: v.showFireworks,
      text,
      text_key,
      colorShow,
      threads: [],
      updatedStamp: v.updatedStamp,
      insertedStamp: v.insertedStamp,
      hasMore: false,
    }
    return obj
  })

  return columns
}
