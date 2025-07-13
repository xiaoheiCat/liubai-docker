import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { TaskManager } from "../shared/TaskManager";
import valTool from "../../utils/val-tool";
import { defaultData } from "~/packageB/config/default-data";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { ShowTip } from "~/packageB/utils/managers/ShowTip";

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
    focus: false,
    assignees: [] as string[],
  },

  methods: {


    async onTapAsignees() {
      const _this = this
      LiuApi.vibrateShort({ type: "medium" })

      const chatInfo = TaskManager.getChatInfo()
      const assignees = this.data.assignees
      if(chatInfo?.open_single_roomid && assignees.length > 0) {
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
      LiuApi.vibrateShort({ type: "medium" })
      
    },

    onLoad() {
      TaskManager.init()
    },

    onReady() {
      this.toAutoFocus()
    },

    async toAutoFocus() {
      await valTool.waitMilli(defaultData.duration_ms_2)
      this.setData({ focus: true })
    },

  },


})