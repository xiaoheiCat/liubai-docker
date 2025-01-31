import type { LiuAppType } from "~/types/types-atom";


export interface AuthorizeViewProps {
  appType: LiuAppType
  code?: string
}