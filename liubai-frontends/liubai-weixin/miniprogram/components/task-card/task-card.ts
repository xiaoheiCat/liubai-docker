import { sharedBehavior } from "~/behaviors/shared-behavior";
import { i18nBehavior } from "~/behaviors/i18n-behavior"
import { LiuApi } from "~/utils/LiuApi";
import type { TaskItem } from "~/types/types-task";
import type { PeopleTasksAPI } from "~/requests/req-types";
import { LiuTunnel } from "~/utils/LiuTunnel";
import type { WxMiniAPI } from "~/types/types-wx";

Component({

  behaviors: [
    sharedBehavior(),
    i18nBehavior("task-card"),
  ],

  properties: {
    task: {
      type: Object,
      value: {},
    },
  },

  methods: {
    onTapCard() {
      // 1. vibrate
      LiuApi.vibrateShort({ type: "light" })
      const obj = this.data.task as TaskItem
      if(!obj) return
      
      // 2. set tunnel
      const obj2: PeopleTasksAPI.Res_GetWxTask = {
        operateType: "get-wx-task",
        ...obj,
      }
      LiuTunnel.setStuff("task-fr-list-to-detail", obj2)

      // 3. open chat tool
      const { id, chat_type, opengid, open_single_roomid } = obj
      let roomid = ""
      if(open_single_roomid) roomid = open_single_roomid
      else if(opengid) roomid = opengid
      
      const url = "/packageB/pages/task-detail/task-detail?id=" + id
      LiuApi.openChatTool({
        url,
        chatType: chat_type as WxMiniAPI.ChatType,
        roomid,
        success(res) {
          console.log("openChatTool success", res)
        },
        fail(err) {
          console.warn("openChatTool fail", err)
        }
      })
    }
  },


})