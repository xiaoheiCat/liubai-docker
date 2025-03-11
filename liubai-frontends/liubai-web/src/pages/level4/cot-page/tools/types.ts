import type { PageState } from "~/types/types-atom";

export interface CotPageData {
  pageState: PageState
  chatId?: string
  reasoningContent?: string
}