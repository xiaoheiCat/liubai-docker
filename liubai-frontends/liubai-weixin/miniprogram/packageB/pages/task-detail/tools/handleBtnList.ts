
import type { BtnType, TaskDetail } from "./types";


export function handleBtnList(
  detail: TaskDetail,
  justCreated = false,
) {
  if(detail.closedStamp) {
    return getFallbackBtns()
  }

  if(detail.isMine) {
    return whenTaskIsMine(detail, justCreated)
  }
  else if(detail.hasAnyIncomplete) {
    return whenTaskHasAnyIncomplete(detail)
  }
  
  return getFallbackBtns()
}

interface GetMoreBtnList {
  moreBtnList: BtnType[]
  itemKeyList: string[]
}

export function getMoreBtnList(
  detail: TaskDetail,
  btnList: BtnType[],
  justCreated: boolean,
): GetMoreBtnList | void {
  const moreBtnList: BtnType[] = []
  const itemKeyList: string[] = []

  if(justCreated) {
    moreBtnList.push("CreateTask")
    itemKeyList.push("task-detail.create_other")

    moreBtnList.push("CloseTask")
    itemKeyList.push("task-detail.close_task")

    if(!btnList.includes("Share")) {
      moreBtnList.push("Share")
      itemKeyList.push("task-detail.share")
    }

    return { moreBtnList, itemKeyList }
  }


  if(detail.isMine) {
    if(!btnList.includes("AddNote")) {
      moreBtnList.push("AddNote")
      itemKeyList.push("task-detail.add_note")
    }
    if(!btnList.includes("Share")) {
      moreBtnList.push("Share")
      itemKeyList.push("task-detail.share")
    }
    if(!btnList.includes("CreateTask")) {
      moreBtnList.push("CreateTask")
      itemKeyList.push("task-detail.create_other")
    }

    return { moreBtnList, itemKeyList }
  }

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
  justCreated: boolean,
) {
  const btnList: BtnType[] = []
  let hasShare = false

  if(detail.hasAnyIncomplete) {
    btnList.push("Reminder")
  }
  else {
    hasShare = true
    btnList.push("Share")
  }

  if(detail.canIComplete) {
    btnList.push("CompleteTask")
  }

  if(justCreated) {
    btnList.push("AddNote")
    btnList.push("More")
    return btnList
  }

  btnList.push("CloseTask")
  if(hasShare) {
    btnList.push("CreateTask")
  }
  else {
    btnList.push("More")
  }

  return btnList
}


function getFallbackBtns() {
  const btnList: BtnType[] = [
    "CreateTask",
    "Share"
  ]
  return btnList
}