import { LiuTime } from "~/packageB/utils/LiuTime";
import type { DateItem, RemindItem } from "./types";
import valTool from "~/packageB/utils/val-tool";
import { useI18n } from "~/packageB/locales/index";

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

export function generateTimeValue() {
  const now = LiuTime.getTime()
  const currentDate = new Date(now)
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