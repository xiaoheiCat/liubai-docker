import { watch } from "vue"
import type { SyncGet_ContentList } from "~/types/cloud/sync-get/types"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import { CloudMerger } from "./CloudMerger"
import localCache from "~/utils/system/local-cache"
import { useDocumentVisibility } from "~/hooks/useVueUse"

export type PreDownloadLoadType = "CREATE_FIRST" | "EDIT_FIRST"

export interface PreDownloadCheckpoint {
  spaceId: string
  lastItemStamp?: number
}

// CREATE_FIRST 跑满 500 轮 (8000 条) 就 markCreateFirstDone，以后不再回填。
// 不考虑云端 > 8000 条的情况：那么多数据已经足够塞爆前端 IndexedDB。
const MAX_STEPS: Record<PreDownloadLoadType, number> = {
  CREATE_FIRST: 500,
  EDIT_FIRST: 20,
}
const BATCH_SIZE = 9
const REQ_INTERVAL = 2000   // 服务端限流下限 (ms)
const IDLE_TIMEOUT = 3000   // requestIdleCallback 超时上限 (ms)

let isRunning = false

function saveCheckpoint(cp: PreDownloadCheckpoint) {
  localCache.setPreference("preDownloadCheckpoint", cp)
}

function clearCheckpoint() {
  localCache.setPreference("preDownloadCheckpoint", undefined)
}

function loadCheckpoint(): PreDownloadCheckpoint | undefined {
  return localCache.getPreference().preDownloadCheckpoint
}

function markCreateFirstDone(spaceId: string) {
  const pf = localCache.getPreference()
  const done = pf.preDownloadCreateFirstDone ?? []
  if (!done.includes(spaceId)) {
    done.push(spaceId)
    localCache.setPreference("preDownloadCreateFirstDone", done)
  }
}

function isCreateFirstDone(spaceId: string): boolean {
  const pf = localCache.getPreference()
  return pf.preDownloadCreateFirstDone?.includes(spaceId) ?? false
}

// 等下一轮可以发请求：2s 硬下限 + idle (有就等，没有就算)
async function waitForNext() {
  await valTool.waitMilli(REQ_INTERVAL)
  if (typeof requestIdleCallback === "undefined") return
  await new Promise<void>(resolve => {
    requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT })
  })
}

async function preLoadEditFirst(spaceId: string) {
  const editUpperBound = localCache.getPreference().loadEditStamp
  const arg: SyncGet_ContentList = {
    taskType: "content_list",
    spaceId,
    loadType: "EDIT_FIRST",
  }
  let lastItemStamp: number | undefined
  let stepCount = 0

  while (stepCount < MAX_STEPS.EDIT_FIRST) {
    stepCount++
    await waitForNext()

    if (lastItemStamp) arg.lastItemStamp = lastItemStamp

    const parcels = await CloudMerger.request(arg)
    if (!parcels) return

    if (stepCount === 1) {
      localCache.setPreference("loadEditStamp", time.getTime())
    }

    if (parcels.length < BATCH_SIZE) return

    const lastParcel = parcels[parcels.length - 1]
    if (lastParcel?.parcelType === "content") {
      lastItemStamp = lastParcel.content?.editedStamp
    }
    if (!lastItemStamp) return

    if (editUpperBound && editUpperBound > lastItemStamp) return
  }
}

async function preLoadCreateFirst(cp: PreDownloadCheckpoint) {
  const arg: SyncGet_ContentList = {
    taskType: "content_list",
    spaceId: cp.spaceId,
    loadType: "CREATE_FIRST",
  }
  let stepCount = 0

  while (stepCount < MAX_STEPS.CREATE_FIRST) {
    stepCount++
    await waitForNext()

    if (cp.lastItemStamp) arg.lastItemStamp = cp.lastItemStamp

    const parcels = await CloudMerger.request(arg)
    if (!parcels) return

    if (parcels.length < BATCH_SIZE) {
      clearCheckpoint()
      markCreateFirstDone(cp.spaceId)
      return
    }

    const lastParcel = parcels[parcels.length - 1]
    let newStamp: number | undefined
    if (lastParcel?.parcelType === "content") {
      newStamp = lastParcel.content?.createdStamp
    }
    if (!newStamp) {
      clearCheckpoint()
      return
    }

    cp.lastItemStamp = newStamp
    saveCheckpoint(cp)
  }

  clearCheckpoint()
  markCreateFirstDone(cp.spaceId)
}

async function runCreateFirst(cp: PreDownloadCheckpoint) {
  isRunning = true
  try {
    await preLoadCreateFirst(cp)
  } finally {
    isRunning = false
  }
}

async function runEditFirst(spaceId: string) {
  isRunning = true
  try {
    await preLoadEditFirst(spaceId)
  } finally {
    isRunning = false
  }
}

export function preDownloadStart(
  spaceId: string,
  loadType: PreDownloadLoadType,
) {
  if (isRunning) return

  if (loadType === "EDIT_FIRST") {
    runEditFirst(spaceId)
    return
  }

  if (isCreateFirstDone(spaceId)) return

  const existing = loadCheckpoint()
  if (existing) {
    if (existing.spaceId === spaceId) {
      runCreateFirst(existing)
      return
    }
    clearCheckpoint()
  }

  const cp: PreDownloadCheckpoint = { spaceId }
  saveCheckpoint(cp)
  runCreateFirst(cp)
}

export function preDownloadResume() {
  if (isRunning) return
  const cp = loadCheckpoint()
  if (!cp) return
  // 老版本会给 EDIT_FIRST 也存 checkpoint，带 loadType 字段；
  // 新版本只有 CREATE_FIRST 持久化，碰到老格式直接清掉，避免拿 EDIT_FIRST 的
  // lastItemStamp 误当 CREATE_FIRST 的起点 → 触发疯狂轮询。
  const legacyLoadType = (cp as { loadType?: string }).loadType
  if (legacyLoadType && legacyLoadType !== "CREATE_FIRST") {
    clearCheckpoint()
    return
  }
  runCreateFirst(cp)
}

export function setupPreDownload() {
  const visibility = useDocumentVisibility()
  watch(visibility, (v) => {
    if (v === "visible") preDownloadResume()
  })
}
