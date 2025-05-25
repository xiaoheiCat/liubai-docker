
export type BcrResult = WechatMiniprogram.BoundingClientRectCallbackResult | null
export type BoundingClientRectResolver = (res: BcrResult) => void
export type GetImagePath = () => string

export interface MiniProgramContext<D = Record<string, any>> {
  data: D
  setData: (data: Partial<D>) => void
}