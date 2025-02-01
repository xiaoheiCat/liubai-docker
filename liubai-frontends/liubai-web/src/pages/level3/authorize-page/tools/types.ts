import type { 
  LiuAppType, 
  PageState,
} from "~/types/types-atom";

export interface ApData {
  pageState: PageState
  state: string
  credential: string
  appType?: LiuAppType
  serial?: string
  code?: string
}