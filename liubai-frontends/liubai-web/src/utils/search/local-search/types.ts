import type { OState } from "~/types/types-basic";
import type { ContentInfoType } from "~/types/types-atom";
import type { SearchOpt } from "~/utils/controllers/search-controller/types";

export interface SearchIndexDoc {
  [key: string]: string | number
  id: string
  title: string
  body: string
  spaceId: string
  infoType: ContentInfoType
  oState: OState
  editedStamp: number
}

export interface SearchSyncPayload {
  upserts?: SearchIndexDoc[]
  removals?: string[]
}

export interface WorkerSearchParams {
  text: string
  mode: SearchOpt["mode"]
  spaceId: string
  excludeThreads: string[]
}

export interface WorkerSearchResult {
  ids: string[]
}

export type SearchWorkerAction = "init" | "search" | "sync" | "clear"

export interface SearchWorkerRequestMap {
  init: undefined
  search: WorkerSearchParams
  sync: SearchSyncPayload
  clear: undefined
}

export interface SearchWorkerResponseMap {
  init: { ready: true }
  search: WorkerSearchResult
  sync: { done: true }
  clear: { cleared: true }
}

export interface SearchWorkerRequest<T extends SearchWorkerAction> {
  id: string
  action: T
  payload: SearchWorkerRequestMap[T]
}

export interface SearchWorkerResponse<T extends SearchWorkerAction> {
  id: string
  action: T
  ok: boolean
  payload?: SearchWorkerResponseMap[T]
  error?: string
}
