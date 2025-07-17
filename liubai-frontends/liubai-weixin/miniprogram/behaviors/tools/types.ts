import type { LiuTimeout } from "~/utils/basic/type-tool"

export interface NbData {
  height1: number
  height2: number
  height3: number
  lastResizeTimeout: LiuTimeout
  visible: boolean
  alwaysArrowBack: boolean
}