import pre_cfg from "./pre_config"

export type LiuCfg = {
  LIU_VERSION: string
  API_DOMAIN?: string
}

export const cfg: LiuCfg = {
  ...pre_cfg,
}