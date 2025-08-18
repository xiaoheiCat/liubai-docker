import type { PeopleTasksAPI } from "~/requests/req-types";
import type { TaskCard } from "~/types/types-task";

export function showTaskItems(
  tasks: PeopleTasksAPI.WxTaskItem[],
) {
  const list: TaskCard[] = []

  for(let i=0; i<tasks.length; i++) {
    const task = tasks[i]
    const obj: TaskCard = {
      ...task,
      allDone: undefined,
      doneCount: undefined,
      eachOtherDone: undefined,
    }

    // handle otherOpenidForMe
    const isSingleChat = Boolean(task.open_single_roomid)
    if(isSingleChat) {
      if(task.isMine) {
        obj.otherOpenidForMe = task.each_other_openid
      }
      else {
        obj.otherOpenidForMe = task.owner_openid
      }
    }

    if(task.infoType !== "TASK" || task.assigneeList.length < 1) {
      list.push(obj)
      continue
    }

    obj.allDone = true
    obj.doneCount = 0
    task.assigneeList.forEach(v => {
      if(v.doneStamp) {
        obj.doneCount = (obj.doneCount as number) + 1
      }
      else {
        obj.allDone = false
      }

      if(!isSingleChat) return
      if(!task.isMine) return
      if(!v.doneStamp) return
      if(v.group_openid !== task.owner_openid) {
        obj.eachOtherDone = true
      }
    })
    
    list.push(obj)
  }
  return list
}