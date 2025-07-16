
// Function Name: people-tasks
import cloud from "@lafjs/cloud"
import { 
  checker, getDocAddId, valTool, verifyToken, WxMiniHandler,
} from "@/common-util"
import { 
  type LiuRqReturn, 
  type VerifyTokenRes_B,
  PeopleTasksAPI,
  WxMiniAPI,
  type Table_WxBond,
  type Partial_Id,
  type LiuErrReturn,
  type Table_WxTask, 
} from "@/common-types"
import * as vbot from "valibot"
import { getBasicStampWhileAdding, getNowStamp } from "@/common-time"

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {

  // 1. verify
  const body = ctx.request?.body ?? {}
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn

  // 2. decide which path to go
  let res: LiuRqReturn = { code: "E4000" }
  const oT = body["operateType"] as PeopleTasksAPI.OperateType
  if(oT === "enter-wx-chat-tool") {
    res = await enter_wx_chat_tool(body, vRes)
  }
  else if(oT === "create-wx-task") {
    res = await create_wx_task(body, vRes)
  }
  else if(oT === "get-wx-task") {
    res = await get_wx_task(body, vRes)
  }

  return res
}


async function get_wx_task(
  body: Record<string, any>,
  vRes: VerifyTokenRes_B,
) {
  // 1. check out params
  const res1 = vbot.safeParse(PeopleTasksAPI.Sch_Param_GetWxTask, body)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }
  const id = body.id as string
  const chatInfo = body.chatInfo as WxMiniAPI.ChatInfo

  // 2. get the task
  const wtCol = db.collection("WxTask")
  const res2 = await wtCol.doc(id).get<Table_WxTask>()
  const data2 = res2.data
  if(!data2 || data2.oState !== "OK") {
    return { code: "E4004", errMsg: "no such task" }
  }
  if(data2.open_single_roomid) {
    if(data2.open_single_roomid !== chatInfo.open_single_roomid) {
      return { code: "PT001", errMsg: "open_single_roomid is not matched" }
    }
  }
  if(data2.opengid) {
    if(data2.opengid !== chatInfo.opengid) {
      return { code: "PT001", errMsg: "opengid is not matched" }
    }
  }

  // 3. package data
  const data3: PeopleTasksAPI.Res_GetWxTask = {
    operateType: "get-wx-task",
    id: data2._id,
    activity_id: data2.activity_id,
    desc: data2.desc,
    owner_openid: data2.owner_openid,
    opengid: data2.opengid,
    open_single_roomid: data2.open_single_roomid,
    chat_type: data2.chat_type,
    assigneeList: data2.assigneeList,
    insertedStamp: data2.insertedStamp,
    endStamp: data2.endStamp,
    closedStamp: data2.closedStamp,
  }
  return { code: "0000", data: data3 }
}

async function create_wx_task(
  body: Record<string, any>,
  vRes: VerifyTokenRes_B,
) {
  // 1. check out params
  const res1 = vbot.safeParse(PeopleTasksAPI.Sch_Param_CreateWxTask, body)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }
  const userId = vRes.userData._id
  const desc = body.desc as string
  const assignees = body.assignees as string[]
  const chatInfo = body.chatInfo as WxMiniAPI.ChatInfo

  // 2. check chat info
  const res2 = await checkChatInfo(chatInfo, userId)
  if(res2) return res2

  // 3. call wx to create activity id 
  const res3 = await WxMiniHandler.createActivityId()
  if(!res3.pass) {
    console.warn("fail to create activity id", res3.err)
    return res3.err
  }
  const data3 = res3.data

  // 4. handle activity_id and expiration_time
  const activity_id = data3.activity_id as string
  const expiration_time = data3.expiration_time as number
  if(!activity_id) {
    return { code: "E5001", errMsg: "no activity_id" }
  }
  let endStamp = expiration_time
  if(endStamp < getNowStamp()) {
    endStamp = endStamp * 1000
  }

  // 5. calculate related_openids & assigneeList
  const owner_openid = chatInfo.group_openid as string
  let related_openids = [...assignees, owner_openid]
  related_openids = valTool.uniqueArray(related_openids)
  const assigneeList = assignees.map(v => {
    const obj5: PeopleTasksAPI.AssigneeItem = {
      group_openid: v,
    }
    return obj5
  })

  // 6. create the task
  const b6 = getBasicStampWhileAdding()
  const data6: Partial_Id<Table_WxTask> = {
    ...b6,
    oState: "OK",
    taskState: "DEFAULT",
    owner_userid: userId,
    owner_openid,
    opengid: chatInfo.opengid,
    open_single_roomid: chatInfo.open_single_roomid,
    chat_type: chatInfo.chat_type as WxMiniAPI.ChatType,
    desc,
    assigneeList,
    related_openids,
    activity_id,
    endStamp,
  }
  const wtCol = db.collection("WxTask")
  const res6 = await wtCol.add(data6)
  const docId = getDocAddId(res6)
  if(!docId) {
    return { code: "E5001", errMsg: "fail to create task, with operating db" }
  }
  return { code: "0000", data: { id: docId } }
}


async function checkChatInfo(
  chatInfo: WxMiniAPI.ChatInfo,
  userId: string,
): Promise<LiuErrReturn | undefined> {
  const group_openid = chatInfo.group_openid
  if(!group_openid) {
    return { code: "E4000", errMsg: "no group_openid" }
  }

  const wbCol = db.collection("WxBond")
  const w1: Partial<Table_WxBond> = {
    userId,
    infoType: "chat-tool",
    group_openid,
  }
  const res1 = await wbCol.where(w1).getOne<Table_WxBond>()
  const data1 = res1.data
  if(!data1) {
    return { code: "E4003", errMsg: "you are not the member of this chat" }
  }
  
}


async function enter_wx_chat_tool(
  body: Record<string, any>,
  vRes: VerifyTokenRes_B,
) {
  // 1. check out wxData
  const wxData = body.wxData
  const res1 = vbot.safeParse(WxMiniAPI.Sch_EncryptedAtom, wxData)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }
  const encryptedData = wxData.encryptedData
  const iv = wxData.iv

  // 2. get required params
  const session_key = vRes.userData.thirdData?.wx_mini?.session_key
  const appid = process.env.LIU_WX_MINI_APPID
  if(!session_key || !appid) {
    return { code: "E5001", errMsg: "no session_key or appid" }
  }

  // 3. decrypt wxData
  const res3 = WxMiniHandler.decryptUserData<WxMiniAPI.ChatInfo>(
    appid, session_key, encryptedData, iv
  )
  if(!res3) {
    return { code: "E5001", errMsg: "fail to decrypt wxData" }
  }

  // 4. save chat info
  const userId = vRes.userData._id
  saveChatInfo(userId, res3)

  // 5. return data
  const result: PeopleTasksAPI.Res_EnterWxChatTool = {
    operateType: "enter-wx-chat-tool",
    chatInfo: res3,
  }

  return { code: "0000", data: result }
}

async function saveChatInfo(
  userId: string,
  chatInfo: WxMiniAPI.ChatInfo,
) {
  const group_openid = chatInfo.group_openid
  const chat_type = chatInfo.chat_type
  if(!group_openid || !chat_type) return false
  const wbCol = db.collection("WxBond")
  const w1: Partial<Table_WxBond> = {
    userId,
    infoType: "chat-tool",
    group_openid,
  }
  const res1 = await wbCol.where(w1).get<Table_WxBond>()
  const list1 = res1.data
  if(list1.length > 0) return true

  const b2 = getBasicStampWhileAdding()
  const newData: Partial_Id<Table_WxBond> = {
    ...b2,
    infoType: "chat-tool",
    userId,
    opengid: chatInfo.opengid,
    open_single_roomid: chatInfo.open_single_roomid,
    group_openid,
    chat_type,
  }
  await wbCol.add(newData)
  return true
}