import type { LiuTimeout } from "~/utils/basic/type-tool"

export interface BcParam {
  code: string
  language?: string | null
}

export interface BcData {
  code: string
  language?: string | null
  show: boolean
  enable: boolean
  copiedTimeout?: LiuTimeout
}

export interface BcResult {
  closed: boolean
}

export type BcResolver = (res: BcResult) => void
