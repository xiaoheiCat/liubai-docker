import pre_cfg from "./pre_config"

export type LiuEnvData = {
  LIU_VERSION: string
  API_DOMAIN?: string
  GZH_USERNAME?: string
  LIU_CUSTOMER_SERVICE?: string
  LIU_WECOM_CORPID?: string
}

export const envData: LiuEnvData = {
  ...pre_cfg,
}