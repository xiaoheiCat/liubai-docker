import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { TaskManager } from "../shared/TaskManager";
import valTool from "../../utils/val-tool";
import { defaultData } from "~/packageB/config/default-data";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { ShowTip } from "~/packageB/utils/managers/ShowTip";
import { prePost } from "../shared/useTaskCreate";
import type { LiuLoginData } from "~/packageB/types";
import type { LiuTimeout } from "~/packageB/utils/basic/type-tool";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { Loginer } from "~/packageB/utils/login/Loginer";

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
    inputValue: "",
    _val: "",
    _loginData: null as LiuLoginData | null,
    _syncLoginDataInterval: undefined as LiuTimeout,
  },

  methods: {

    onShow() {
      this.syncLoginData()
    },

    async syncLoginData() {
      const _this = this
      const int1 = this.data._syncLoginDataInterval
      if(int1) {
        clearInterval(int1)
      }

      let runTimes = 0
      this.data._syncLoginDataInterval = setInterval(async () => {
        runTimes++
        const res2 = await Loginer.getLoginData()
        if(res2) {
          _this.setData({ _loginData: res2 })
        }
        if(runTimes > 5 || res2) {
          const int2 = _this.data._syncLoginDataInterval as number
          clearInterval(int2)
        }
      }, LiuTime.SECOND * 5)
    },

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

      LiuApi.selectGroupMembers({ 
        maxSelectCount: 20,
        success(res1) {
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
      
      // 1. check login
      const loginData = this.data._loginData
      if(!loginData?.nickname) {
        LiuApi.navigateTo({ 
          url: "/packageB/pages/article/article?key=wxmini-login",
        })
        return
      }

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