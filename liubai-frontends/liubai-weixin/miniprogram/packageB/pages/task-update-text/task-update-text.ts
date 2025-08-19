import { i18nBehavior } from "~/packageB/behaviors/i18n-behavior";
import { navibarBehavior } from "~/packageB/behaviors/navibar-behavior";
import { pageBehavior } from "~/packageB/behaviors/page-behavior";
import { themeBehavior } from "~/packageB/behaviors/theme-behavior";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { defaultData } from "~/packageB/config/default-data";
import type { UpdateTaskText } from "~/packageB/types/types-tunnel";
import type { UpdateTaskTextType } from "~/packageB/types/types-atom";
import { toConfirm } from "./tools/useTaskUpdateText";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-update-text"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],


  data: {
    id: "",
    text: "",
    canSubmit: false,
    focus: false,
    noteMaxLength: defaultData.note_max_length,
    titleMaxLength: defaultData.title_max_length,
    _initedText: "",
    updateType: undefined as UpdateTaskTextType | undefined,
  },

  methods: {

    onLoad() {
      this.toInit()
    },

    async toInit() {
      const res1 = await LiuTunnel.takeStuff<UpdateTaskText>("update-task-text")
      if(!res1) return

      // 1. init data
      let canSubmit = false
      let text = res1.text ?? ""
      let focus = true
      const _initedText = text
      const updateType = res1.updateType

      // 2. read clipboard
      if(res1.read_clipboard) {
        try {
          const res2 = await LiuApi.getClipboardData()
          const txt2 = res2?.data
          if(txt2 && txt2 !== text) {
            text = txt2.trim()
            canSubmit = true
            focus = false
          }
        }
        catch(err) {
          console.warn("fail to get clipboard data")
        }
      }

      // 3. handle maxlength
      let maxLength = defaultData.note_max_length
      if(updateType === "title") {
        maxLength = defaultData.title_max_length
      }
      if(text.length > maxLength) {
        text = text.substring(0, maxLength)
      }
      
      // 4. set data
      this.setData({ 
        text, 
        id: res1.id, 
        focus, 
        canSubmit, 
        updateType,
        _initedText,
      })
    },

    onInput(e: any) {
      const inputTxt: string = e.detail.value ?? ""
      this.data.text = inputTxt
      
      let canSubmit = Boolean(inputTxt !== this.data._initedText)
      if(canSubmit && this.data.updateType === "title") {
        if(inputTxt.trim() === "") {
          canSubmit = false
        }
      }

      if(canSubmit !== this.data.canSubmit) {
        this.setData({ canSubmit })
      }
    },

    onTapConfirm() {
      if(!this.data.canSubmit) return
      LiuApi.vibrateShort({ type: "medium" })
      const { id, text, updateType } = this.data
      if(!updateType) return
      toConfirm(id, text, updateType)
    },



  },

})