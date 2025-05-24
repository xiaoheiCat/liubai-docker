
export type BcrResult = WechatMiniprogram.BoundingClientRectCallbackResult | null
export type BoundingClientRectResolver = (res: BcrResult) => void
export type GetImagePath = () => string