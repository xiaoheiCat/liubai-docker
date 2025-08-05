import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { TaskManager } from "../shared/TaskManager";
import { 
  fetchTaskDetail, 
  showDetail, 
  toNotifyMembers,
  toForward,
  fetchCloseTask,
  fetchCompleteTask,
  afterCompleteTask,
  toCreateOtherTask,
  toUpdateTitle,
} from "./tools/useTaskDetail";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import type { JustCreateTask, PleaseCreateTask } from "~/packageB/types/types-tunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";
import { pageStates } from "~/packageB/utils/atom-util";
import type { WxMiniAPI } from "~/packageB/types/types-wx";
import type { TaskDetail } from "./tools/types";
import { LiuUtil } from "~/packageB/utils/liu-util/index";
import valTool from "~/packageB/utils/val-tool";
import { useI18n } from "~/packageB/locales/index";
import { DateUtil } from "~/packageB/utils/date-util";
import { waitForCreateTask } from "../shared/useTaskCreate";
import { envData } from "~/packageB/config/env-data";
import { pageBehavior } from "~/packageB/behaviors/page-behavior";
import { checkNameExisted } from "../shared/some-funcs";
import { defaultData } from "~/packageB/config/default-data";
import type { PeopleTasksAPI } from "~/packageB/requests/req-types";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-detail"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior()
  ],

  data: {
    pageName: "task-detail",
    _id: "",
    _whenLoadStamp: 0,
    _justCreated: false,
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
      const now = LiuTime.getLocalTime()
      const pages = LiuApi.getPages()
      const pLength = pages.length
      let bind: Record<string, any> = {
        _whenLoadStamp: now,
        _id: id
      }
      if(pLength === 1) bind.alwaysGoHome = true
      this.setData(bind)

      this.getTaskDetail(true)
    },

    async onShow() {
      const stamp1 = this.data._whenLoadStamp
      const justOnLoad = LiuTime.isWithinMillis(stamp1, 1500, true)
      if(justOnLoad) return

      this.checkStateWhileShowing()
    },

    async checkStateWhileShowing() {
      const res1 = await LiuTunnel.takeStuff<PleaseCreateTask>("please-create-task")
      if(res1) {
        const justPosting = LiuTime.isWithinMillis(res1.stamp, LiuTime.MINUTE)
        if(justPosting) {
          waitForCreateTask()
          return
        }
      }

      this.getTaskDetail(false)
    },

    async getTaskDetail(
      justOnLoad: boolean,
    ) {
      // 1. get param
      const id = this.data._id
      if(!id) return

      // 2. wait for chatInfo
      if(justOnLoad) {
        const res2 = await this.initTaskDetail()
        if(!res2) return
      }
      const chatInfo = TaskManager.getChatInfo()
      if(!chatInfo) {
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
        console.warn("PT001......", id, chatInfo)
        this.youAreNotInTheRoom()
        return
      }
      if(!data3) {
        this.setData({ pState: pageStates.NO_AUTH, alwaysGoHome: true })
        return
      }

      // 4. show
      const detail = showDetail(data3, chatInfo)
      this.setData({ detail, pState: pageStates.OK })
      this.toUpdateShareMenu()

      // 5. if just created
      const res5 = await LiuTunnel.takeStuff<JustCreateTask>("just-create-task")
      if(!res5 || res5.id !== id) return
      if(!LiuTime.isWithinMillis(res5.stamp, LiuTime.MINUTE)) {
        console.warn("over one minute!")
        return
      }

      // 6. show modal
      await valTool.waitMilli(1500)
      const isGroup = Boolean(chatInfo.opengid)
      const res6 = await LiuUtil.showCustomModal({
        title_key: "task-detail.created_1",
        content_key: isGroup ? "task-detail.created_3" : "task-detail.created_2",
        confirm_key: "shared.ok",
      })
      if(!res6.confirm) return
      this.data._justCreated = true

      // 7. forward
      toForward(id, detail.desc, true)
    },


    async initTaskDetail() {
      // 2.1 get detail from tunnel  
      const res2_1 = await LiuTunnel.takeStuff<PeopleTasksAPI.Res_GetWxTask>(
        "task-fr-list-to-detail"
      )
      if(res2_1) {
        let bind2_1: Record<string, any> = { pState: pageStates.OK }
        if(res2_1.isMine) {
          bind2_1.chatInfo = {
            group_openid: res2_1.owner_openid,
            open_single_roomid: res2_1.open_single_roomid,
            opengid: res2_1.opengid,
            chat_type: res2_1.chat_type,
          } as WxMiniAPI.ChatInfo
          TaskManager.setChatInfo(bind2_1.chatInfo)
          TaskManager.init()
          bind2_1.detail = showDetail(res2_1, bind2_1.chatInfo)
          this.setData(bind2_1)
          this.toUpdateShareMenu()
          return true
        }

        bind2_1.detail = showDetail(res2_1)
        this.setData(bind2_1)
      }

      // 2.2 init task manager
      const res2_2 = await TaskManager.init()
      if(!res2_2) {
        this.youAreNotInTheRoom()
        return false
      }

      // 2.3 calculate detail again
      if(res2_1) {
        const chatInfo = TaskManager.getChatInfo()
        if(!chatInfo) return false
        const tmpDetail2_2 = showDetail(res2_1, chatInfo)
        this.setData({ detail: tmpDetail2_2, chatInfo })
        this.toUpdateShareMenu()
      }

      return true
    },


    async toUpdateShareMenu() {
      const { detail } = this.data
      if(!detail) return
      const activityId = detail.activity_id
      if(!activityId) return
      const { endStamp } = detail
      const now1 = LiuTime.getTime()
      if(endStamp && now1 > endStamp) return

      let chooseType = 2  // 表示群内所有成员均为参与者（包括后加入群）
      let participant: string[] | undefined
      if(detail.assignees.length > 0) {
        chooseType = 1    // 表示按指定的 participant 当作参与者
        participant = detail.assignees
      }
      let templateId = defaultData.task_tmpl_id
      if(detail.isActivity) {
        templateId = defaultData.activity_tmpl_id
      }

      await LiuApi.updateShareMenu({
        withShareTicket: true,
        isUpdatableMessage: true,
        activityId,
        useForChatTool: true,
        chooseType,
        participant,
        templateInfo: {
          parameterList: [],
          templateId,
        },
      })
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

    youAreNotInTheRoom() {
      this.setData({ pState: pageStates.NOT_IN_ROOM, alwaysGoHome: true })
    },


    onTapReminder() {
      LiuApi.vibrateShort({ type: "medium" })
      const { detail, _id } = this.data
      if(!detail || !_id) return
      toNotifyMembers(_id, detail)
    },

    onTapShare() {
      LiuApi.vibrateShort({ type: "medium" })
      const { detail, _id, _justCreated } = this.data
      if(!detail || !_id) return

      toForward(_id, detail.desc, _justCreated)
    },

    onTapCreateTask() {
      LiuApi.vibrateShort({ type: "medium" })
      const c = this.data.chatInfo
      if(!c) return
      toCreateOtherTask(c)
    },

    async onTapCloseTask() {
      LiuApi.vibrateShort({ type: "medium" })
      const { detail, _id } = this.data
      if(!detail || !_id) return

      if(detail.hasAnyIncomplete) {
        const res1 = await LiuUtil.showCustomModal({
          title: "📥",
          content_key: "task-detail.close_1",
        })
        if(!res1.confirm) return
      }

      const bind: Record<string, any> = {}
      bind["detail.closedStamp"] = LiuTime.getTime()
      this.setData(bind)
      
      const res2 = await fetchCloseTask(_id)
      console.log("fetchCloseTask res2: ", res2)
    },

    async onTapCompleteTask() {
      // 1. vibrate & get param
      LiuApi.vibrateShort({ type: "medium" })
      const { detail, _id, chatInfo } = this.data
      if(!detail || !_id || !chatInfo) return
      const res1 = checkNameExisted()
      if(!res1) return

      // 2. find my idx
      const assigneeList = detail.assigneeList
      const idx = assigneeList.findIndex(v => {
        return v.group_openid === chatInfo.group_openid
      })
      if(idx < 0) return

      // 3. show modal
      const _this = this
      LiuUtil.showCustomModal({
        title_key: "task-detail.complete_1",
        content_key: "task-detail.complete_2",
        confirm_key: "task-detail.it_is_true",
        cancel_key: "task-detail.it_is_not_true",
        success(res) {
          if(!res.confirm) return
          _this.toCompleteTask(_id, idx)
        }
      })
    },

    async toCompleteTask(
      id: string,
      idx: number,
    ) {
      // 1. get param
      const detail = this.data.detail
      if(!detail) return
      const assigneeList = detail.assigneeList
      if(!assigneeList) return

      // 2. call wx.shareEmojiToGroup to say I've completed it
      const now2 = LiuTime.getTime()
      const closedStamp = detail.closedStamp
      const endStamp = detail.endStamp ?? now2
      let needShare = Boolean(closedStamp || now2 > endStamp)
      if(needShare) {
        // to call  wx.shareEmojiToGroup
        this.toShareIComplete(id)
      }

      // 3. set new state
      const bind: Record<string, any> = {}
      assigneeList[idx].doneStamp = now2
      bind["detail.hasAnyIncomplete"] = assigneeList.some(v => !v.doneStamp)
      bind["detail.canIComplete"] = false
      bind[`detail.assigneeList[${idx}].doneStamp`] = now2
      this.setData(bind)
      
      // 3. fetch
      const res5 = await fetchCompleteTask(id)
      console.log("fetchCompleteTask res5: ", res5)
      const code5 = res5.code
      if(code5 === "0000" || code5 === "0001") {
        if(!needShare) {
          afterCompleteTask()
        }
      }

    },

    toShareIComplete(id: string) {
      const entrancePath = `packageB/pages/task-detail/task-detail?id=${id}`
      const _share = (imagePath: string) => {
        LiuApi.shareEmojiToGroup({
          imagePath,
          needShowEntrance: true,
          entrancePath,
          success(res) {
            console.log("toShareIComplete success: ", res)
            afterCompleteTask()
          },
          fail(err) {
            console.warn("toShareIComplete fail: ", err)
          }
        })
      }

      const url = envData.LIU_I_COMPLETED
      if(!url) {
        console.warn("LIU_I_COMPLETED is not set")
        return
      }
      LiuApi.downloadFile({
        url,
        success(res) {
          _share(res.tempFilePath)
        },
        fail(err) {
          console.warn("downloadFile fail: ", err)
        }
      })
    },

    async onTapTitle() {
      const id = this.data._id
      const detail = this.data.detail
      if(!detail) return
      const newTitle = await toUpdateTitle(id, detail)
      if(!newTitle) return

      const bind: Record<string, any> = {}
      bind["detail.desc"] = newTitle
      this.setData(bind)
    },

  },


})