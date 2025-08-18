import { sharedBehavior } from "~/behaviors/shared-behavior";
import { i18nBehavior } from "~/behaviors/i18n-behavior"
import { LiuApi } from "~/utils/LiuApi";
import type { TaskCard } from "~/types/types-task";
import { LiuTunnel } from "~/utils/LiuTunnel";
import type { WxMiniAPI } from "~/types/types-wx";
import { LiuUtil } from "~/utils/liu-util/index";
import { LiuReq } from "~/requests/LiuReq";
import APIs from "~/requests/APIs";
import type { DeletedTaskEventDetail } from "./tools/types";
import { turnTaskCardToResGetWxTask } from "./tools/useTaskCard";

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
    index: {
      type: Number,
      value: -1,
    }
  },

  methods: {
    onTapCard() {
      // 1. vibrate
      LiuApi.vibrateShort({ type: "light" })
      const obj = this.data.task as TaskCard
      if(!obj?.id) return
      
      // 2. set tunnel
      const obj2 = turnTaskCardToResGetWxTask(obj)
      LiuTunnel.setStuff("task-fr-list-to-detail", obj2)

      // 3. open chat tool
      const { id, chat_type, opengid, open_single_roomid } = obj
      let roomid = ""
      if(open_single_roomid) roomid = open_single_roomid
      else if(opengid) roomid = opengid
      
      const _this = this
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
          if(err?.errMsg?.includes("invalid roomid")) {
            _this.failToOpenChatTool()
          }
          LiuTunnel.clear()
        }
      })
    },

    async failToOpenChatTool() {
      const res1 = await LiuUtil.showCustomModal({
        title_key: "shared.tip",
        content_key: "err.open_chat_tool_1",
        confirm_key: "shared.yes",
      })
      if(!res1.confirm) return
      this.toDelete()
    },

    async toDelete() {
      const task = this.data.task as TaskCard
      if(!task) return

      const id = task.id
      const w1 = {
        operateType: "delete-wx-task",
        id,
      }
      const url1 = APIs.PPL_TASKS
      const res1 = await LiuReq.request(url1, w1)
      if(!res1 || res1.code !== "0000") return
      this.triggerEvent<DeletedTaskEventDetail>(
        "deleted", { id, index: this.data.index }
      )
    }

  },


})