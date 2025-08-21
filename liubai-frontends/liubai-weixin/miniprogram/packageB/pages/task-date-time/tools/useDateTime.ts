import { LiuTime } from "~/packageB/utils/LiuTime";
import type { DateItem, RemindItem, SubmitData } from "./types";
import valTool from "~/packageB/utils/val-tool";
import { useI18n } from "~/packageB/locales/index";
import type { ConfirmTaskDateTime, OpenTaskDateTime } from "~/packageB/types/types-tunnel";
import type { LiuRemindMe } from "~/packageB/types/types-atom";
import { LiuTunnel } from "~/packageB/utils/LiuTunnel";
import { LiuApi } from "~/packageB/utils/LiuApi";
import APIs from "~/packageB/requests/APIs";
import { LiuReq } from "~/packageB/requests/LiuReq";
import { LiuUtil } from "~/packageB/utils/liu-util/index";

export function generateDateList() {

  const now = LiuTime.getTime()
  const dateList: DateItem[] = []
  let currentStamp = now
  const { t } = useI18n()

  for(let i=0; i<93; i++) {
    const currentDate = new Date(currentStamp)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const date = currentDate.getDate()
    const day = currentDate.getDay()

    const yyyy = valTool.format0(year)
    const mm = valTool.format0(month+1)
    const dd = valTool.format0(date)

    let text = `${yyyy}-${mm}-${dd} `
    if(i > 1) {
      text += `(${t(`date.day_${day}`)})`
    }
    else if(i === 1) {
      text += `(${t(`date.tomorrow`)})`
    }
    else if(i === 0) {
      text += `(${t(`date.today`)})`
    }
    
    dateList.push({ text, year, month, date })
    currentStamp += LiuTime.DAY
  }

  return { dateList }
}

export function generateHourMinute() {
  const hourList: string[] = []
  const minuteList: string[] = []

  for(let i=0; i<24; i++) {
    hourList.push(valTool.format0(i))
  }

  for(let i=0; i<12; i++) {
    const min = i * 5
    minuteList.push(valTool.format0(min))
  }

  return { hourList, minuteList }
}

export function generateTimeValue(
  stamp?: number,
) {
  if(!stamp) {
    stamp = LiuTime.getTime()
  }
  const currentDate = new Date(stamp)
  let hour = currentDate.getHours()
  let minute = currentDate.getMinutes()
  let minIndex = Math.ceil(minute / 5)

  if(minute >= 55) {
    hour += 1
    minIndex = 0
    if(hour >= 24) {
      hour = 1
    }
  }

  return { timeValue: [hour, minIndex] }
}

export function generateRemindList() {
  const { t } = useI18n()
  const mins = [0, 10, 30, 60, 120, 1440]
  const remindList: RemindItem[] = []
  for(let i=0; i<mins.length; i++) {
    const min = mins[i]
    const text = t(`remind-early.min_${min}`)
    remindList.push({ text, early_minute: min })
  }
  return { remindList }
}


export function initValues(
  dateList: DateItem[],
  remindList: RemindItem[],
  tunnelData?: OpenTaskDateTime,
) {
  // 1. calculate dateValue
  let dateValue = [1]
  let whenStamp: number | undefined
  if(tunnelData?.whenStamp) {
    if(tunnelData.whenStamp > LiuTime.getTime()) {
      whenStamp = tunnelData.whenStamp
    }
  }

  if(whenStamp) {
    const theDate = new Date(whenStamp)
    const year = theDate.getFullYear()
    const month = theDate.getMonth()
    const date = theDate.getDate()
    const idx = dateList.findIndex(v => {
      if(v.year === year && v.month === month && v.date === date) {
        return true
      }
      return false
    })
    if(idx > -1) {
      dateValue = [idx]
    }
  }

  // 2. calculate timeValue
  const { timeValue } = generateTimeValue(whenStamp)

  // 3. calculate remindValue
  let remindValue = [1]
  const remindMe = tunnelData?.remindMe
  if(remindMe && remindMe.type === "early") {
    const idx3 = remindList.findIndex(v => {
      if(v.early_minute === remindMe.early_minute) {
        return true
      }
      return false
    })
    if(idx3 > -1) {
      remindValue = [idx3]
    }
  }


  return {
    dateValue,
    timeValue,
    remindValue,
  }
}


export function getConfirmData(
  dateList: DateItem[],
  dateValue: number[],
  timeValue: number[],
  remindList: RemindItem[],
  remindValue: number[],
): SubmitData | undefined {
  const dateItem = dateList[dateValue[0]]
  const remindItem = remindList[remindValue[0]]
  if(!dateItem || !remindItem) return
  const hr = timeValue[0]
  const minIdx = timeValue[1]
  const min = minIdx * 5
  const theDate = new Date(
    dateItem.year, dateItem.month, dateItem.date, 
    hr, min, 0 , 0
  )
  const whenStamp = theDate.getTime()
  const earlyMinute = remindItem.early_minute
  const remindStamp = whenStamp - earlyMinute * LiuTime.MINUTE
  const remindMe: LiuRemindMe = {
    type: "early",
    early_minute: earlyMinute,
  }

  return {
    whenStamp,
    remindStamp,
    remindMe,
  }
}

export async function toConfirm(
  id: string,
  data: SubmitData,
) {
  // 1. tunnel and navigate back
  const tunnelData: ConfirmTaskDateTime = { id }
  LiuTunnel.setStuff("confirm-task-date-time", tunnelData)
  LiuApi.navigateBack()

  // 2. fetch
  const w2 = {
    operateType: "update-task-time",
    id,
    ...data,
  }
  const url2 = APIs.PPL_TASKS
  const res2 = await LiuReq.request(url2, w2)
  if(res2.code === "0000") {
    LiuUtil.showCustomToast({
      title_key: "task-detail.updated",
      icon: "success",
    })
  }
}