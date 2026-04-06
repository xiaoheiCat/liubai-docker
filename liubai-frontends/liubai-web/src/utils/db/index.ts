import Dexie, { type Table, type IndexableType, type PromiseExtended } from 'dexie';
import type { 
  UserLocalTable, 
  WorkspaceLocalTable, 
  MemberLocalTable,
  DraftLocalTable,
  ContentLocalTable,
  CollectionLocalTable,
  DownloadTaskLocalTable,
  UploadTaskLocalTable,
} from "~/types/types-table"
import type { DexieChanges } from "~/types/other/types-dexie";
import { dbSchema, DB_VERSION } from './db-idx';

/**
 * 注意：
 *   1. 只在已有的 interface CustomTable 里新增 数据类型，并不需要提升 version
 *   2. 唯有 新增数据表（objectStore），或者 修改索引时，需要提升 version
 *   3. 没有在 this.version(3).stores() 里定义的数据表，会被删除（以前定义过，后来移除了，就会被删除）
 *   4. 只提升 version 并不会造成原有数据丢失，除非 this.version(3).stores() 里头没有定义了
 */

type LiuDexieTable<T, TKey extends IndexableType = string> =
  Omit<Table<T, TKey, T>, "update" | "upsert" | "bulkUpdate"> & {
    update(
      key: TKey | T,
      changes: DexieChanges<T> | ((obj: T, ctx: { value: any; primKey: IndexableType }) => void | boolean),
    ): PromiseExtended<number>
    upsert(key: TKey | T, changes: DexieChanges<T>): PromiseExtended<boolean>
    bulkUpdate(
      keysAndChanges: ReadonlyArray<{ key: TKey; changes: DexieChanges<T> }>
    ): PromiseExtended<number>
  }

export class LiuDexie extends Dexie {

  users!: LiuDexieTable<UserLocalTable>
  workspaces!: LiuDexieTable<WorkspaceLocalTable>
  members!: LiuDexieTable<MemberLocalTable>
  drafts!: LiuDexieTable<DraftLocalTable>
  contents!: LiuDexieTable<ContentLocalTable>
  collections!: LiuDexieTable<CollectionLocalTable>
  download_tasks!: LiuDexieTable<DownloadTaskLocalTable>
  upload_tasks!: LiuDexieTable<UploadTaskLocalTable>

  constructor() {
    super('LiubaiDatabase')
    this.version(DB_VERSION).stores(dbSchema)
  }

}

export const db = new LiuDexie()
export type DexieTable<T> = LiuDexieTable<T>
