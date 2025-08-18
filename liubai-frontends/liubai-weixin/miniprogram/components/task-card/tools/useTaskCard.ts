import type { PeopleTasksAPI } from "~/requests/req-types";
import type { TaskCard } from "~/types/types-task";

export function turnTaskCardToResGetWxTask(
  obj: TaskCard,
) {
  const res: PeopleTasksAPI.Res_GetWxTask = {
    operateType: "get-wx-task",
    infoType: obj.infoType,
    id: obj.id,
    activity_id: obj.activity_id,
    desc: obj.desc,
    owner_openid: obj.owner_openid,
    opengid: obj.opengid,
    open_single_roomid: obj.open_single_roomid,
    chat_type: obj.chat_type,
    assigneeList: obj.assigneeList,
    participatorList: obj.participatorList,
    isMine: obj.isMine,
    insertedStamp: obj.insertedStamp,
    editedStamp: obj.editedStamp,
    endStamp: obj.endStamp,
    closedStamp: obj.closedStamp,

    calendarStamp: obj.calendarStamp,
    remindStamp: obj.remindStamp,
    whenStamp: obj.whenStamp,
    remindMe: obj.remindMe,
    aiWorker: obj.aiWorker,
    
    note: obj.note,
  }
  return res
}