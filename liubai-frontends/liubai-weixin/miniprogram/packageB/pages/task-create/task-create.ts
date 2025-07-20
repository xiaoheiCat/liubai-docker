import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { TaskManager } from "../shared/TaskManager";
import valTool from "../../utils/val-tool";
import { defaultData } from "~/packageB/config/default-data";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { ShowTip } from "~/packageB/utils/managers/ShowTip";
import { prePost } from "../shared/useTaskCreate";
import { pageBehavior } from "../../behaviors/page-behavior";
import { checkNameExisted } from "../shared/some-funcs";
import { LiuUtil } from "~/packageB/utils/liu-util/index";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-create"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],

  data: {
    pageName: "task-create",
    focus: false,
    canSubmit: false,
    assignees: [] as string[],
    inputValue: "",
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


    async onTapAssignees() {
      const _this = this
      LiuApi.vibrateShort({ type: "medium" })

      const assignees = this.data.assignees
      if(assignees.length > 0) {
        this.setData({ assignees: [] })
        return
      }

      const _setClipboard = async () => {
        const link = defaultData.issue_1
        const res = await LiuApi.setClipboardData({ data: link })
        const errMsg = res?.errMsg ?? ""
        if(!errMsg.endsWith("ok")) return
        LiuUtil.showCustomModal({
          title_key: "shared.copied_link",
          content_key: "shared.open_it_with_browser",
          showCancel: false,
        })
      }

      const _showErr = () => {
        LiuUtil.showCustomModal({
          title: "selectGroupMembers:fail",
          content_key: "err.select_group_members_fail",
          confirm_key: "shared.ok",
          success(res) {
            if(!res.confirm) return
            _setClipboard()
          }
        })
      }

      LiuApi.selectGroupMembers({ 
        maxSelectCount: 20,
        success(res1) {
          _this.setData({ assignees: res1.members })
        },
        fail(err) {
          console.warn("selectGroupMembers fail: ", err)
          const errMsg = err.errMsg
          if(errMsg === "selectGroupMembers:fail ") {
            _showErr()
          }
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
      
      // 1. check nickname
      const res1 = checkNameExisted()
      if(!res1) return

      // 2. ready to post
      const res2 = prePost(this.data._val, this.data.assignees)
      if(res2 === "navigateTo") {
        this.reset()
      }
    },

    async reset() {
      await valTool.waitMilli(300)
      this.setData({
        _val: "",
        inputValue: "",
        assignees: [],
        canSubmit: false,
      })
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