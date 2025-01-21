import { useThreadShowStore } from "~/hooks/stores/useThreadShowStore"
import type { ThreadShow, StateShow } from "~/types/types-content"
import time from "~/utils/basic/time"
import cui from "~/components/custom-ui"
import dbOp from "../db-op"
import commonPack from "~/utils/controllers/tools/common-pack"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { SnackbarRes, SnackbarParam } from "~/types/other/types-snackbar"
import { i18n } from "~/locales"
import { mapStateColor } from "~/config/state-color"
import cloudOp from "../cloud-op"
import liuUtil from "~/utils/liu-util"

interface SelectStateRes {
  tipPromise?: Promise<SnackbarRes>
  newStateId?: string
  newStateShow?: StateShow
}

interface FloatUpRes {
  tipPromise?: Promise<SnackbarRes>
}

// 用户从 More 里点击 状态 后的公共逻辑
export async function selectState(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
): Promise<SelectStateRes> {
  const newThread = liuUtil.copy.newData(oldThread) 
  const wStore = useWorkspaceStore()

  // 1. 让用户选择
  const stateIdSelected = oldThread.stateId
  const res = await cui.showStateSelector({ stateIdSelected })
  if(res.action === "mask") return {}
  if(res.action === "remove" && !stateIdSelected) return {}
  if(res.action === "confirm" && stateIdSelected === res.stateId) return {}

  // 注: thread 的操作分两步是因为 getStateShow 依赖 wStore 的变化

  // 2. 操作 thread.stateId
  const newStateId = res.stateId
  const newStateStamp = newStateId ? time.getTime() : undefined
  if(res.action === "confirm" && newStateId) {
    newThread.stateId = newStateId
    newThread.stateStamp = newStateStamp
  }
  else if(res.action === "remove") {
    delete newThread.stateId
    delete newThread.stateStamp
  }

  // 4. 操作 thread.stateShow 字段
  let tmpStateShow: StateShow | undefined = undefined
  if(res.action === "confirm" && newStateId) {
    tmpStateShow = commonPack.getStateShow(newStateId, wStore)
    newThread.stateShow = tmpStateShow
  }
  else if(res.action === "remove") {
    delete newThread.stateShow
  }

  // 5. 修改动态的 db
  const operateStamp = await dbOp.setStateId(
    newThread._id, 
    newStateId,
    newStateStamp,
  )

  // 6. 通知到全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 7. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)

  // 8. 显示 snack-bar
  const t = i18n.global.t
  const snackParam: SnackbarParam = {
    action_key: "tip.undo"
  }
  if(newStateId && tmpStateShow) {
    const dot_color = mapStateColor("dot_color", tmpStateShow.colorShow)
    snackParam.dot_color = dot_color
    if(tmpStateShow.text) {
      snackParam.text = t("thread_related.switch_to") + tmpStateShow.text
    }
    else if(newStateId === "FINISHED") {
      snackParam.text_key = "thread_related.finished"
    }
    else {
      snackParam.text_key = "tip.updated"
    }
  }
  else {
    snackParam.text_key = "tip.removed"
  }
  const tipPromise = cui.showSnackBar(snackParam)

  return { tipPromise, newStateId, newStateShow: tmpStateShow }
}

// 撤回状态的修改
export async function undoState(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  // 1. 修改 db
  const operateStamp = await dbOp.setStateId(
    oldThread._id, 
    oldThread.stateId,
    oldThread.stateStamp,
  )

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_collect")

  // 4. upload
  cloudOp.saveContentToCloud(oldThread, operateStamp, true)
}

// 浮上去
export async function floatUp(
  thread: ThreadShow,
  memberId: string,
  userId: string,
): Promise<FloatUpRes> {
  const stateId = thread.stateId
  if(!stateId) return {}
  console.warn("get to float up:::")
  const newThread = liuUtil.copy.newData(thread)
  const newStateStamp = time.getTime()
  newThread.stateStamp = newStateStamp

  // 1. update local db
  const operateStamp = await dbOp.setStateId(
    newThread._id,
    stateId,
    newStateStamp,
  )

  // 2. notify globally
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "float_up")

  // 3. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)

  // 4. 显示 snackbar
  const text_key = "state_related.bubbled"
  const action_key = "tip.undo"
  const tipPromise = cui.showSnackBar({ text_key, action_key })

  return { tipPromise }
}

// 撤回冒泡
export async function undoFloatUp(
  oldThread: ThreadShow,
  memberId: string,
  userId: string,
) {
  console.warn("get to undo float up:::")

  // 1. 修改 db
  const operateStamp = await dbOp.setStateId(
    oldThread._id, 
    oldThread.stateId,
    oldThread.stateStamp,
  )

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([oldThread], "undo_float_up")

  // 3. upload
  cloudOp.saveContentToCloud(oldThread, operateStamp, true)
}


// 只修改 thread 上的 id
export async function setNewStateForThread(
  oldThread: ThreadShow,
  newStateId: string,
) {
  const wStore = useWorkspaceStore()
  const newThread = liuUtil.copy.newData(oldThread)
  const newStateStamp = newStateId ? time.getTime() : undefined

  newThread.stateId = newStateId
  newThread.stateStamp = newStateStamp
  newThread.stateShow = commonPack.getStateShow(newStateId, wStore)

  // 1. 修改 db
  const operateStamp = await dbOp.setStateId(
    newThread._id, 
    newStateId,
    newStateStamp,
  )

  // 2. 通知全局
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 3. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)
  
  return true
}

export async function updateStateForThread(
  oldThread: ThreadShow,
  newStateId: string,
  newStateStamp: number,
) {
  const wStore = useWorkspaceStore()
  const newThread = liuUtil.copy.newData(oldThread)

  newThread.stateId = newStateId
  newThread.stateStamp = newStateStamp
  newThread.stateShow = commonPack.getStateShow(newStateId, wStore)

  // 1. update local db
  const operateStamp = await dbOp.setStateId(
    newThread._id,
    newThread.stateId,
    newStateStamp,
  )

  // 2. notify globally
  const tsStore = useThreadShowStore()
  tsStore.setUpdatedThreadShows([newThread], "state")

  // 3. upload
  cloudOp.saveContentToCloud(newThread, operateStamp)

  return true
}
