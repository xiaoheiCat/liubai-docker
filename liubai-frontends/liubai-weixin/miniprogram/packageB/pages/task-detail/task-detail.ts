import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { TaskManager } from "../shared/TaskManager";
import { fetchTaskDetail, showDetail } from "./tools/useTaskDetail";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import type { JustCreateTask } from "~/packageB/types/types-tunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { pageStates } from "~/packageB/utils/atom-util";
import type { WxMiniAPI } from "~/packageB/types/types-wx";
import type { TaskDetail } from "./tools/types";
import { LiuUtil } from "~/packageB/utils/liu-util/index";
import valTool from "~/utils/val-tool";
import { useI18n } from "~/packageB/locales/index";
import { DateUtil } from "~/packageB/utils/date-util";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-detail"),
    navibarBehavior(),
    themeBehavior(),
  ],

  data: {
    pageName: "task-detail",
    _id: "",
    _whenLoadStamp: 0,
    detail: null as TaskDetail | null,
    pState: pageStates.LOADING,
    errTip: "",
    chatInfo: null as WxMiniAPI.ChatInfo | null,
    alwaysGoHome: false,
  },

  methods: {

    onLoad(query?: Record<string, string>) {
      if(!query) return
      const id = query.id
      if(!id || typeof id !== "string") return
      const now = LiuTime.getTime()
      this.setData({ _whenLoadStamp: now, _id: id })

      this.getTaskDetail()
    },

    async onShow() {
      const stamp1 = this.data._whenLoadStamp
      const justOnLoad = LiuTime.isWithinMillis(stamp1, 1500)
      if(justOnLoad) return

      this.checkStateWhileShowing()
    },

    async checkStateWhileShowing() {
      const res1 = await LiuTunnel.takeStuff<JustCreateTask>("just-create-task")
      const newId = res1?.id
      if(newId && newId !== this.data._id) {
        await LiuTunnel.setStuff("just-create-task", res1)
        const url = `/packageB/pages/task-detail/task-detail?id=${newId}`
        LiuApi.navigateTo({ url })
        return
      }

      this.getTaskDetail()
    },

    async getTaskDetail() {
      // 1. get param
      const id = this.data._id
      if(!id) return

      // 2. wait for chatInfo
      const res2 = await TaskManager.init()
      const chatInfo = TaskManager.getChatInfo()
      if(!res2 || !chatInfo) {
        this.youAreNotInTheRoom()
        return
      }
      this.setData({ chatInfo })

      // 3. fetch task detail
      const res3 = await fetchTaskDetail(id, chatInfo)
      const code3 = res3.code
      const data3 = res3.data
      if(code3 === "E4004") {
        this.setData({ pState: pageStates.NO_DATA, alwaysGoHome: true })
        return
      }
      if(code3 === "PT001") {
        this.youAreNotInTheRoom()
        return
      }
      if(!data3) {
        this.setData({ pState: pageStates.NO_AUTH, alwaysGoHome: true })
        return
      }

      // 4. show
      const detail = showDetail(chatInfo, data3)
      this.setData({ detail, pState: pageStates.OK, alwaysGoHome: false })
      if(detail.isMyTask) {
        this.toUpdateShareMenu()
      }

      // 5. if just created
      const res5 = await LiuTunnel.takeStuff<JustCreateTask>("just-create-task")
      if(!res5 || res5.id !== id) return

      // 6. show modal
      const isGroup = Boolean(chatInfo.opengid)
      const res6 = await LiuUtil.showCustomModal({
        title_key: "task-detail.created_1",
        content_key: isGroup ? "task-detail.created_3" : "task-detail.created_2",
        confirm_key: "shared.ok",
      })
      if(!res6.confirm) return

      // 7. forward
      valTool.waitMilli(2000)
      this.toForward(true)
    },

    async toUpdateShareMenu() {
      console.log("go to update share menu......")
      const { detail } = this.data
      if(!detail) return
      const activityId = detail.activity_id
      if(!activityId) return

      let chooseType = 2
      let participant: string[] | undefined
      if(detail.hasAnyIncomplete) {
        chooseType = 1
        participant = detail.assignees
      }

      const res = await LiuApi.updateShareMenu({
        withShareTicket: true,
        isUpdatableMessage: true,
        activityId,
        useForChatTool: true,
        chooseType,
        participant,
        templateInfo: {
          parameterList: [],
          templateId: "4A68CBB88A92B0A9311848DBA1E94A199B166463",
        },
      })
      console.log("updateShareMenu res: ", res)
    },
    
    onTapCreator() {
      LiuApi.vibrateShort({ type: "light" })
      const { detail } = this.data
      if(!detail) return
      const timeStr = detail.postedTimeStr
      const { t } = useI18n()
      const content = t("task-detail.created_time", { timeStr })
      LiuUtil.showCustomModal({
        title_key: "task-detail.creator",
        content,
        showCancel: false,
      })
    },

    onTapOneAssignee(e: WechatMiniprogram.BaseEvent) {
      LiuApi.vibrateShort({ type: "light" })
      const idx = e.currentTarget.dataset.idx
      const { detail } = this.data
      if(typeof idx !== "number" || !detail) return
      console.log("onTapOneAssignee idx: ", idx)
      const doneStamp = detail.assigneeList[idx].doneStamp
      if(!doneStamp) {
        LiuUtil.showCustomToast({ 
          title_key: "task-detail.imcompleted",
          icon: "none",
        })
        return
      }

      const timeStr = DateUtil.showBasicTime(doneStamp)
      LiuUtil.showCustomModal({
        title_key: "task-detail.completed_1",
        content: timeStr,
        showCancel: false,
      })
    },

    async toForward(justCreated = false) {
      const { t } = useI18n()
      const key = justCreated ? "task-detail.forward_1" : "task-detail.forward_2"
      const title = t(key)
      await LiuApi.shareAppMessageToGroup({ title })
    },

    youAreNotInTheRoom() {
      console.log("youAreNotInTheRoom......")
      this.setData({ pState: pageStates.NOT_IN_ROOM, alwaysGoHome: true })
    },

    onTapCreateTask() {
      LiuApi.vibrateShort({ type: "medium" })
      LiuUtil.navigateWithPopup("/packageB/pages/task-create/task-create")
    },

  },


})