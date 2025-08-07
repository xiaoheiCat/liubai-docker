import { useI18n } from "../locales/index";
import { LiuRemindMe } from "../types/types-atom";
import valTool from "./val-tool";

export class DateUtil {

  static isThisYear(d: Date) {
    const today = new Date()
    return d.getFullYear() === today.getFullYear()
  }

  static showBasicTime(stamp: number) {
    const d = new Date(stamp)
    const { t, locale } = useI18n()

    const yyyy = valTool.format0(d.getFullYear())
    let mm = String(d.getMonth() + 1)
    let dd = String(d.getDate())
    const hr = valTool.format0(d.getHours())
    const min = valTool.format0(d.getMinutes())
    const day = t("date.day_" + d.getDay())

    if(locale === "en") {
      mm = valTool.format0(mm)
      dd = valTool.format0(dd)
    }

    if(DateUtil.isThisYear(d)) {
      return t("date.show_1", { mm, dd, hr, min, day })
    }

    return t("date.show_2", { yyyy, mm, dd, hr, min })
  }

  static getRemindMeStrAfterPost(
    remindStamp: number,
    remindMe: LiuRemindMe,
  ) {
    const { type, early_minute } = remindMe
    if(type === "later" || type === "specific_time") {
      return DateUtil.showBasicTime(remindStamp)
    }
    if(type !== "early") return ""

    const { t } = useI18n()
    if(!early_minute) {
      return t("date.on_time")
    }
    if(early_minute < 60) {
      return t("date.early_min", { min: early_minute })
    }
    if(early_minute < 1440) {
      const hr = Math.floor(early_minute / 60).toString()
      return t("date.early_hr", { hr })
    }
    const day = Math.floor(early_minute / 1440).toString()
    return t("date.early_day", { day })
  }

}