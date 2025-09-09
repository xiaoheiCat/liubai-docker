import { LiuApi } from "~/packageB/utils/LiuApi"
import { LiuTime } from "~/packageB/utils/LiuTime"
import type { TaskDetail } from "./types"
import { LiuUtil } from "~/packageB/utils/liu-util/index"
import type { LiuTimeout } from "~/packageB/utils/basic/type-tool"
import { Loginer } from "~/packageB/utils/login/Loginer"
import { defaultData } from "~/packageB/config/default-data"
import { ShowTip } from "~/packageB/utils/managers/ShowTip"

let lastShowHideToggleStamp = 0

export function invokeOnShow() {
  lastShowHideToggleStamp = LiuTime.getLocalTime()
}

export function invokeOnHide() {
  lastShowHideToggleStamp = LiuTime.getLocalTime()
}


export function toAddCalendarEvent(
  detail: TaskDetail,
) {
  // 1.1 get parameters
  const title = detail.desc
  const description = detail.note
  const whenStamp = detail.whenStamp
  if (!whenStamp) return
  const startTime = Math.floor(whenStamp / 1000)
  const earlyMinute = detail.remindMe?.early_minute
  const alarmOffset = earlyMinute ? earlyMinute * 60 : 0

  // 1.2 check out premium
  const isPremium = Loginer.amIPremium()
  if(!isPremium) {
    LiuApi.navigateTo({
      url: "/packageB/pages/landing-premium/landing-premium?key=add-calendar"
    })
    return
  }

  // 2. show loading & set timeout to prompt for system bug
  LiuUtil.showCustomLoading({ title_key: "shared.hold_on" })
  const delay2 = 2000
  let timeout2: LiuTimeout = setTimeout(() => {
    LiuApi.hideLoading()
    timeout2 = undefined
    const isJustHidden = LiuTime.isWithinMillis(
      lastShowHideToggleStamp, 
      delay2, 
      true,
    )
    if(isJustHidden) return

    LiuUtil.showCustomModal({
      title_key: "task-detail.bug_1",
      content_key: "task-detail.bug_2",
      confirm_key: "task-detail.to_open",
      success(res2) {
        if(!res2.confirm) return
        LiuApi.openAppAuthorizeSetting()
      }
    })
  }, delay2)
  const _removeTimeout = () => {
    if(timeout2) {
      LiuApi.hideLoading()
      clearTimeout(timeout2)
      timeout2 = undefined
    }
  }
  
  // 3. clear path & signature for dev
  let path = detail.calendar_path
  let signature = detail.calendar_signature
  try {
    const accountInfo = LiuApi.getAccountInfoSync()
    if(accountInfo?.miniProgram?.appId === defaultData.dev_appid) {
      path = undefined
      signature = undefined
    }
  }
  catch(err) {
    console.warn("get account info failed: ", err)
  }
  

  // 4. to call API
  LiuApi.addPhoneCalendar({
    title,
    startTime,
    description,
    alarmOffset,
    path,
    signature,
    success(res) {
      console.log("addPhoneCalendar success: ", res)
      _removeTimeout()
      LiuUtil.showCustomToast({ 
        title_key: "task-detail.added",
        icon: "success",
      })
    },
    fail(err) {
      console.warn("addPhoneCalendar fail: ", err)
      _removeTimeout()
      const errMsg = err?.errMsg
      if(typeof errMsg === "string" && errMsg.includes("auth deny")) {
        needAuthForCalendar()
      }
      else {
        ShowTip.showErrMsg("添加日历失败", err)
      }
    },
  })
}

function needAuthForCalendar() {
  const _toOpenSetting = async () => {
    LiuApi.vibrateShort({ type: "light" })
    try {
      const res = await LiuApi.openSetting(false)
      console.log("openSetting res: ", res)
    }
    catch(err) {
      console.warn("openSetting err: ", err)
    }
  }

  LiuUtil.showCustomModal({
    title_key: "task-detail.no_auth",
    content_key: "task-detail.no_calendar_auth",
    confirm_key: "task-detail.to_open",
    success(res) {
      if(res.confirm) {
        _toOpenSetting()
      }
    }
  })
}