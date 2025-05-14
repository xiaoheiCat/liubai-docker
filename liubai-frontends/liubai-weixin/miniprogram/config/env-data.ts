import pre_cfg from "./pre_config"

export type LiuEnvData = {
  LIU_VERSION: string
  API_DOMAIN?: string
  GZH_USERNAME?: string
}

export const envData: LiuEnvData = {
  ...pre_cfg,
}