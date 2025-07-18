import { useI18n } from "../locales/index";
import valTool from "./val-tool";

export class DateUtil {


  static showBasicTime(stamp: number) {
    const d = new Date(stamp)
    const { t, locale } = useI18n()

    const yyyy = valTool.format0(d.getFullYear())
    let mm = String(d.getMonth() + 1)
    let dd = String(d.getDate())
    const hr = valTool.format0(d.getHours())
    const min = valTool.format0(d.getMinutes())

    if(locale === "en") {
      mm = valTool.format0(mm)
      dd = valTool.format0(dd)
    }

    const today = new Date()
    const currentYear = valTool.format0(today.getFullYear())

    if(yyyy !== currentYear) {
      return t("date.show_2", { yyyy, mm, dd, hr, min })
    }

    return t("date.show_1", { yyyy, mm, dd, hr, min })
  }

}