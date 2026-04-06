import type { ContentLocalTable } from "~/types/types-table";
import type { SearchOpt } from "~/utils/controllers/search-controller/types";

export interface SearchProvider {
  init(): void
  searchContents(opt: SearchOpt): Promise<ContentLocalTable[]>
  clear(): Promise<void>
}
