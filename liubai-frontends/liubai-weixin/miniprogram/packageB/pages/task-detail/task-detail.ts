import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { LiuTime } from "~/packageB/utils/LiuTime";
import { TaskManager } from "../shared/TaskManager";
import { fetchTaskDetail } from "./tools/useTaskDetail";

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
    _id: "",
    _whenLoadStamp: 0,
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

    async getTaskDetail() {
      // 1. get param
      const id = this.data._id
      if(!id) return

      // 2. wait for chatInfo
      await TaskManager.init()

      // 3. fetch task detail
      const res3 = await fetchTaskDetail(id)


    },

  },


})