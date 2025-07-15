import { LiuReq } from "~/packageB/requests/LiuReq";
import APIs from "../../../requests/APIs";
import { TaskManager } from "../../shared/TaskManager";

export async function fetchTaskDetail(
  id: string,
) {
  const chatInfo = TaskManager.getChatInfo()
  const w1 = {
    operateType: "get-wx-task",
    id,
    chatInfo,
  }
  const url1 = APIs.PPL_TASKS
  const res1 = await LiuReq.request(url1, w1)
  return res1
}