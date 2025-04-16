import { computed } from "vue"
import type { TctProps } from "./types"
import type { TooltipPlacement } from "~/components/common/liu-tooltip/tools/types"
import cui from "~/components/custom-ui"
import { i18n } from "~/locales"
import { showModelName } from "~/utils/show/custom-show"
import { useSystemStore } from "~/hooks/stores/useSystemStore"
import { storeToRefs } from "pinia"
import { showIdeFullName } from "~/utils/show/custom-show"

export function useTcTopbar(
  props: TctProps,
) {
  const td = computed(() => props.threadData)
  const systemStore = useSystemStore()
  const { supported_theme: theme } = storeToRefs(systemStore)

  const aiCharacterUrl = computed(() => {
    const _td = td.value

    // 1. judged by aiModel
    if(_td.aiModel) {
      const modelName = showModelName(_td.aiModel)
      if(modelName === "DeepSeek R1") return "ds_r.png"
      if(modelName === "DeepSeek V3") return "deepseek.svg"
      if(modelName === "QwQ 32B") return "tongyi-qwen.svg"
      if(modelName === "GLM Z1") return "zhipu.svg"
    }

    // 2. judged by aiCharacter
    const a = _td.aiCharacter
    if(!a) return
    if(a === "baixiaoying") return "baichuan.svg"
    if(a === "deepseek") return "deepseek.svg"
    if(a === "ds-reasoner") return "ds_r.png"
    if(a === "hailuo") return "hailuo.svg"
    if(a === "hunyuan") return "hunyuan.svg"
    if(a === "kimi") return "kimi.png"
    if(a === "tongyi-qwen") return "tongyi-qwen.svg"
    if(a === "wanzhi") return "01-ai.png"
    if(a === "yuewen") return "yuewen.svg"
    if(a === "zhipu") return "zhipu.svg"
  })

  const ideIconName = computed(() => {
    const _td = td.value
    const ideType = _td.ideType
    if(!ideType) return

    const prefix = "logos-"

    if(ideType === "cnb.cool") return `${prefix}cnb-cool`
    if(ideType === "cursor") {
      if(theme.value === "light") return `${prefix}cursor`
      return `${prefix}cursor_dark`
    }
    if(ideType === "github.dev") return `${prefix}github`
    if(ideType === "gitpod.io") return `${prefix}gitpod`
    if(ideType === "project-idx") return `${prefix}project-idx`
    if(ideType === "stackblitz.com") return `${prefix}stackblitz`
    if(ideType === "tencent-cloud-studio") return `${prefix}tencent-cloud-studio`
    if(ideType === "trae") return `${prefix}trae`
    if(ideType === "vscode") return `${prefix}vscode`
    if(ideType === "vscode.dev") return `${prefix}vscode`
    if(ideType === "vscode-insiders") return `${prefix}vscode-insiders`
    if(ideType === "vscodium") return `${prefix}vscodium`
    if(ideType === "windsurf") return `${prefix}windsurf`
  })

  const showTopbar = computed(() => {
    const t = td.value
    if(t.pinStamp) return true
    if(t.stateId && t.stateShow) return true
    if(!t.aiReadable || t.aiReadable === "N") return true
    if(t.storageState === `LOCAL` || t.storageState === `ONLY_LOCAL`) return true
    if(aiCharacterUrl.value) return true
    if(ideIconName.value) return true
    return false
  })

  const cloudOffPlacement = computed<TooltipPlacement>(() => {
    const _td = td.value
    if(_td.stateShow) return `bottom`
    if(_td.aiCharacter) return `bottom`
    if(_td.ideType) return `bottom`
    return `bottom-end`
  })

  const onTapAiCharacter = () => {
    const _td = td.value
    const a = _td.aiCharacter
    const { t } = i18n.global

    let name = ""
    let company = ""

    // 1. judged by character
    if(a) {
      name = t(`ai_character.${a}`)
      company = t(`ai_provider.${a}`)
    }

    // 2.1 company is judged by computingProvider
    const computingProvider = _td.computingProvider
    if(computingProvider) {
      const company2 = t(`computing_provider.${computingProvider}`)
      if(company2) company = company2
    }

    // 2.2 name is judged by aiModel
    if(_td.aiModel) {
      const modelName = showModelName(_td.aiModel)
      if(modelName) name = modelName
    }


    if(!name || !company) return
    const isTheSame = name === company
    let content = ""
    if(isTheSame) {
      content = t("thread_related.created_by_ai2", { name })
    }
    else {
      content = t("thread_related.created_by_ai", { name, company })
    }
    
    cui.showModal({
      title: "🪄",
      content,
      showCancel: false,
      confirm_key: "common.ok",
      isTitleEqualToEmoji: true,
    })
  }

  const onTapNoAI = () => {
    cui.showModal({
      title: "🔒",
      content_key: "thread_related.no_ai_desc",
      showCancel: false,
      confirm_key: "tip.got_it",
      isTitleEqualToEmoji: true,
    })
  }

  const onTapIDEType = () => {
    const _td = td.value
    const ideType = _td.ideType
    if(!ideType) return
    const dateTime = _td.createdStr
    const ide = showIdeFullName(ideType)
    cui.showModal({
      title: "🧑‍💻",
      content_key: "thread_related.ide_desc",
      content_opt: { dateTime, ide },
      showCancel: false,
      confirm_key: "common.ok",
      isTitleEqualToEmoji: true,
    })
  }


  return {
    td,
    showTopbar,
    cloudOffPlacement,
    aiCharacterUrl,
    ideIconName,
    onTapAiCharacter,
    onTapNoAI,
    onTapIDEType,
  }
}