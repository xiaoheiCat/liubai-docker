
import type { BtnType, TaskDetail } from "./types";


export function handleBtnList(
  detail: TaskDetail,
) {
  if(detail.closedStamp) {
    return getFallbackBtns()
  }

  if(detail.isMine) {
    return whenTaskIsMine(detail)
  }
  else if(detail.hasAnyIncomplete) {
    return whenTaskHasAnyIncomplete(detail)
  }
  
  return getFallbackBtns()
}

function whenTaskHasAnyIncomplete(
  detail: TaskDetail,
) {
  const btnList: BtnType[] = []
  if(detail.canIComplete) {
    btnList.push("CompleteTask")
  }
  else {
    btnList.push("Urge")
  }

  btnList.push("Share")
  btnList.push("CreateTask")
  return btnList
}

function whenTaskIsMine(
  detail: TaskDetail,
) {
  const btnList: BtnType[] = []

  if(detail.hasAnyIncomplete) {
    btnList.push("Reminder")
  }
  else {
    btnList.push("Share")
  }

  if(detail.canIComplete) {
    btnList.push("CompleteTask")
  }

  btnList.push("CloseTask")
  btnList.push("CreateTask")

  return btnList
}


function getFallbackBtns() {
  const btnList: BtnType[] = [
    "CreateTask",
    "Share"
  ]
  return btnList
}