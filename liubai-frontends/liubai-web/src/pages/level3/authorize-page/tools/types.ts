import type { PageState } from "~/types/types-atom";

export interface ApData {
  pageState: PageState
  state: string
  credential: string
  code?: string
}