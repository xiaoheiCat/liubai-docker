import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { TaskManager } from "../shared/TaskManager";
import valTool from "../../utils/val-tool";
import { defaultData } from "~/packageB/config/default-data";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { ShowTip } from "~/packageB/utils/managers/ShowTip";
import { handlePost } from "./tools/useTaskCreate";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-create"),
    navibarBehavior(),
    themeBehavior(),
  ],

  data: {
    pageName: "task-create",
    focus: false,
    canSubmit: false,
    assignees: [] as string[],
    _val: "",
  },

  methods: {

    onInput(e: any) {
      const inputTxt: string = e.detail.value ?? ""
      const trimTxt = inputTxt.trim()
      this.data._val = trimTxt
      
      const newCanSubmit = Boolean(trimTxt.length > 1)
      if(newCanSubmit !== this.data.canSubmit) {
        this.setData({ canSubmit: newCanSubmit })
      }
    },


    async onTapAsignees() {
      const _this = this
      LiuApi.vibrateShort({ type: "medium" })

      const assignees = this.data.assignees
      if(assignees.length > 0) {
        this.setData({ assignees: [] })
        return
      }

      LiuApi.selectGroupMembers({ 
        maxSelectCount: 20,
        success(res1) {
          console.log("onTapAsignees res1: ", res1)
          _this.setData({ assignees: res1.members })
        }
      })
    },

    onTapClearAssignee(e: WechatMiniprogram.BaseEvent) {
      const { idx } = e.currentTarget.dataset
      if(typeof idx !== "number") return
      LiuApi.vibrateShort({ type: "light" })
      const assignees = this.data.assignees
      assignees.splice(idx, 1)
      this.setData({ assignees })
    },

    onTapIssue() {
      LiuApi.vibrateShort({ type: "light" })
      ShowTip.showBug1()
    },

    onTapPost() {
      if(!this.data.canSubmit) return
      LiuApi.vibrateShort({ type: "medium" })
      handlePost(this.data._val, this.data.assignees)
    },

    onLoad() {
      TaskManager.init()
    },

    onReady() {
      this.toAutoFocus()
    },

    async toAutoFocus() {
      const res = LiuApi.getSkylineInfoSync()
      if(!res.isSupported) return
      await valTool.waitMilli(defaultData.duration_ms_2)
      this.setData({ focus: true })
    },

  },


})