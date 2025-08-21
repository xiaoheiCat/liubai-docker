import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { pageBehavior } from "../../behaviors/page-behavior";
import { 
  generateDateList, 
  generateHourMinute, 
  generateRemindList,
  getConfirmData,
  initValues,
  toConfirm,
} from "./tools/useDateTime";
import type { DateItem, RemindItem } from "./tools/types";
import typeCheck from "~/packageB/utils/basic/type-check";
import valTool from "~/packageB/utils/val-tool";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import type { OpenTaskDateTime } from "~/packageB/types/types-tunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-date-time"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],

  data: {
    pageName: "task-date-time",
    dateList: [] as DateItem[],
    hourList: [] as string[],
    minuteList: [] as string[],
    remindList: [] as RemindItem[],

    dateValue: [0],  // set default value to tomorrow
    timeValue: [0, 0],
    remindValue: [0],  // set default value to "10 mins early"

    _id: "",
  },

  methods: {

    onLoad() {
      const { dateList } = generateDateList()
      const { hourList, minuteList } = generateHourMinute()
      const { remindList } = generateRemindList()
      this.setData({
        dateList,
        hourList,
        minuteList,
        remindList,
      })
      this.initValue()
    },


    async initValue() {
      await valTool.waitMilli(400)
      const res1 = await LiuTunnel.takeStuff<OpenTaskDateTime>("open-task-date-time")
      const { dateList, remindList } = this.data
      const bind1 = initValues(dateList, remindList, res1)
      const bind2 = { _id: res1?.id, ...bind1 }
      this.setData(bind2)
    },

    onDateChange(e: WechatMiniprogram.PickerViewChange) {
      const dateValue = e.detail.value
      if(typeCheck.isArray(dateValue)) {
        this.data.dateValue = dateValue
      }
    },

    onTimeChange(e: WechatMiniprogram.PickerViewChange) {
      const timeValue = e.detail.value
      if(typeCheck.isArray(timeValue)) {
        this.data.timeValue = timeValue
      }
    },

    onRemindChange(e: WechatMiniprogram.PickerViewChange) {
      const remindValue = e.detail.value
      if(typeCheck.isArray(remindValue)) {
        this.data.remindValue = remindValue
      }
    },

    onTapConfirm() {
      const id = this.data._id
      if(!id) return
      const {
        dateList,
        dateValue,
        timeValue,
        remindList,
        remindValue,
      } = this.data
      const data1 = getConfirmData(
        dateList, dateValue, timeValue, remindList, remindValue,
      )
      if(!data1) return
      LiuApi.vibrateShort({ type: "medium" })
      toConfirm(id, data1)
    }

  }


})