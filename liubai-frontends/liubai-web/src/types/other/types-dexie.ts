// Dexie 4.4+ expands nested key paths more aggressively in UpdateSpec<T>.
// Our tables only rely on top-level field updates, so keep the local update
// contract shallow to avoid recursive type explosions on self-nested models.
export type DexieChanges<T> = Partial<T>

// the atom of bulkUpdate(),
// where T is Table
export interface DexieBulkUpdateAtom<T> {
  key: string
  changes: DexieChanges<T>
}
