import pre_cfg from "./pre_config"

export type LiuCfg = {
  frame_duration: number
  frame_duration_2: number
  LIU_VERSION: string
  API_DOMAIN?: string
}

export const cfg: LiuCfg = {
  frame_duration: 12,           // 一个经验值，表示每一帧数（刷新周期）毫秒数
                                // setTimeout 的延时比指定值更长的原因见:
                                // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0
  frame_duration_2: 56,         // 一个经验值，等待 css 响应的毫秒数
                                // 通常用于某个组件刚启动时
  ...pre_cfg,
}