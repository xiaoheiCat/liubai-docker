import pre_cfg from "./pre_config"

export type LiuEnvData = {
  LIU_VERSION: string
  API_DOMAIN?: string
  GZH_USERNAME?: string
  LIU_WEB_DOMAIN?: string
  LIU_CUSTOMER_SERVICE?: string
  LIU_WECOM_CORPID?: string
  LIU_QINIU_UPLOAD?: string
  LIU_DOCS_DOMAIN?: string
  LIU_I_COMPLETED?: string
}

export const envData: LiuEnvData = {
  ...pre_cfg,
}