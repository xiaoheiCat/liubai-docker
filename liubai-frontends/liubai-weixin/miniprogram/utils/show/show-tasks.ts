import type { PeopleTasksAPI } from "~/requests/req-types";
import type { TaskItem } from "~/types/types-task";

export function showTaskItems(
  tasks: PeopleTasksAPI.WxTaskItem[],
) {
  const list: TaskItem[] = []

  for(let i=0; i<tasks.length; i++) {
    const task = tasks[i]
    const obj: TaskItem = {
      ...task,
      allDone: undefined,
      doneCount: undefined,
      eachOtherDone: undefined,
    }
    if(task.infoType !== "TASK" || task.assigneeList.length < 1) {
      list.push(obj)
      continue
    }

    const isSingleChat = Boolean(task.open_single_roomid)
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