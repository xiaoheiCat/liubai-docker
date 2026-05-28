

export namespace LiuAi {

  export type AiProvider = "aliyun-bailian" | "baichuan" | "deepseek" | "tencent-hunyuan" 
  | "minimax" | "moonshot" | "stepfun" | "zero-one" | "zhipu" | "antgroup"

  export type AiSecondaryProvider = "siliconflow" | "gitee-ai" | "qiniu" | "tencent-lkeap"
  | "suanleme" | "opencode-go"

  export type ComputingProvider = AiProvider | AiSecondaryProvider
  
}