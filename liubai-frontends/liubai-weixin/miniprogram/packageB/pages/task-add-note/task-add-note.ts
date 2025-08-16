import { i18nBehavior } from "~/packageB/behaviors/i18n-behavior";
import { navibarBehavior } from "~/packageB/behaviors/navibar-behavior";
import { pageBehavior } from "~/packageB/behaviors/page-behavior";
import { themeBehavior } from "~/packageB/behaviors/theme-behavior";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { defaultData } from "~/packageB/config/default-data";
import type { AddTaskNote } from "~/packageB/types/types-tunnel";
import { toConfirm } from "./tools/useTaskAddNote";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-add-note"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],


  data: {
    id: "",
    note: "",
    canSubmit: false,
    focus: false,
    noteMaxLength: defaultData.note_max_length,
    _initedNote: "",
  },

  methods: {

    onLoad() {
      this.toInit()
    },

    async toInit() {
      const res1 = await LiuTunnel.takeStuff<AddTaskNote>("add-task-note")
      if(!res1) return

      let canSubmit = false
      let note = res1.note ?? ""
      let focus = true
      const _initedNote = note
      if(res1.read_clipboard) {
        try {
          const res2 = await LiuApi.getClipboardData()
          const txt2 = res2?.data
          if(txt2 && txt2 !== note) {
            note = txt2.trim()
            canSubmit = true
            focus = false
          }
        }
        catch(err) {
          console.warn("fail to get clipboard data")
        }
      }
      const maxLength = defaultData.note_max_length
      if(note.length > maxLength) {
        note = note.substring(0, maxLength)
      }
      
      this.setData({ note, id: res1.id, focus, canSubmit, _initedNote })
    },

    onInput(e: any) {
      const inputTxt: string = e.detail.value ?? ""
      this.data.note = inputTxt
      
      const canSubmit = Boolean(inputTxt !== this.data._initedNote)
      if(canSubmit !== this.data.canSubmit) {
        this.setData({ canSubmit })
      }
    },

    onTapConfirm() {
      if(!this.data.canSubmit) return
      LiuApi.vibrateShort({ type: "medium" })
      const { id, note } = this.data
      toConfirm(id, note)
    },



  },

})