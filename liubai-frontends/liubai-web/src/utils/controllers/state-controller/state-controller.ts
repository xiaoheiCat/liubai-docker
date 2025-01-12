import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import type { LiuStateConfig, LiuAtomState } from "~/types/types-atom"
import type { AddUploadTaskOpt } from "~/utils/cloud/tools/types"
import type { TcListOption } from "../thread-controller/type"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"
import type { ThreadShow } from "~/types/types-content"
import cfg from "~/config"
import threadController from "../thread-controller/thread-controller"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"

interface GetThreadsOfStateOpt {
  stateId: string
  excludeInKanban: boolean        // 是否排除 kanban 上的动态
  lastItemStamp?: number
}

interface GetThreadsOfStateRes {
  threads: ThreadShow[]
  hasMore: boolean
}


/** 获取 "状态" 的列表 */
// 默认会有 TODO / FINISHED 两个列表
function getStates() {
  const wStore = useWorkspaceStore()
  return wStore.getStateList()
}


async function getThreads(
  opt: GetThreadsOfStateOpt
): Promise<GetThreadsOfStateRes> {
  // 1. define listOpt
  const { stateId, lastItemStamp, excludeInKanban } = opt
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const listOpt: TcListOption = {
    viewType: "STATE",
    spaceId,
    stateId,
    lastItemStamp,
    limit: cfg.max_kanban_thread,
  }
  const NOTHING_DATA: GetThreadsOfStateRes = { 
    threads: [], 
    hasMore: false,
  }
  if(!spaceId) return NOTHING_DATA

  // 2. get the last one on kanban for stateStamp
  if(excludeInKanban && !lastItemStamp) {
    const tmpOpt = { ...listOpt }
    const res2 = await threadController.getList(tmpOpt)
    const len2 = res2.length
    if(len2 < 1) return NOTHING_DATA
    const lastOne2 = res2[len2 - 1]
    const lastStateStamp = lastOne2.stateStamp
    if(!lastStateStamp) return NOTHING_DATA
    listOpt.lastItemStamp = lastStateStamp
  }

  // 3. to load
  const res3 = await threadController.getList(listOpt)
  const len3 = res3.length
  const hasMore = len3 >= cfg.max_kanban_thread

  return {
    hasMore,
    threads: res3
  }
}

// 重新排列 workspace.LiuStateConfig.stateList
async function stateListSorted(
  newStateIds: string[]
) {
  const tmpList = getStates()
  const newList: LiuAtomState[] = []
  for(let i=0; i<newStateIds.length; i++) {
    const id = newStateIds[i]
    const data = tmpList.find(v => v.id === id)
    if(data) newList.push(data)
  }

  const res = await setNewStateList(newList)
  return res
}

// 设置新的 stateList 进 stateConfig 里
async function setNewStateList(
  newList: LiuAtomState[],
  opt?: AddUploadTaskOpt,
) {
  const wStore = useWorkspaceStore()
  const currentSpace = wStore.currentSpace
  if(!currentSpace) return false
  const spaceId = wStore.spaceId
  if(!spaceId) return false

  let stateCfg = currentSpace.stateConfig
  if(!stateCfg) {
    stateCfg = wStore.getDefaultStateCfg()
  }
  const now = time.getTime()
  stateCfg.stateList = newList
  stateCfg.updatedStamp = now

  const res = await wStore.setStateConfig(stateCfg)
  LocalToCloud.addTask({
    target_id: spaceId,
    uploadTask: "workspace-state_config",
    operateStamp: now,
  }, opt)

  return res
}

export default {
  getStates,
  getThreads,
  stateListSorted,
  setNewStateList,
}

