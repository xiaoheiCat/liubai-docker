// Function Name: liubai-mcp

import cloud from "@lafjs/cloud"
import {
  AiToolUtil,
  checker,
  getAESKey,
  getDocAddId,
  verifyToken,
} from "@/common-util"
import * as vbot from "valibot"
import {
  type LiubaiMcpAPI,
  type LiuRqReturn,
  type Partial_Id,
  type Table_AiChat,
  type Table_AiRoom,
  type Table_User,
} from "@/common-types"
import { getBasicStampWhileAdding } from "@/common-time"
import { AiShared, ToolShared } from "@/ai-shared"

const db = cloud.database()

export async function main(ctx: FunctionContext) {
  const body = ctx.request?.body ?? {}

  const backendAESKey = getAESKey()
  if (!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

  const res1 = vbot.safeParse(LiubaiMcpAPI.Sch_Param, body)
  if (!res1.success) {
    return {
      code: "E4000",
      errMsg: checker.getErrMsgFromIssues(res1.issues),
    }
  }

  const vRes = await verifyToken(ctx, body)
  if (!vRes.pass) return vRes.rqReturn
  const user = vRes.userData

  const oT = body.operateType as LiubaiMcpAPI.OperateType

  if (oT === "mcp-health") {
    return handle_health(user)
  }
  if (oT === "mcp-add-note") {
    return mcp_create_pending(user, "add_note", body)
  }
  if (oT === "mcp-add-todo") {
    return mcp_create_pending(user, "add_todo", body)
  }
  if (oT === "mcp-add-calendar") {
    return mcp_create_pending(user, "add_calendar", body)
  }
  if (oT === "mcp-get-pending") {
    return handle_get_pending(user, body)
  }
  if (oT === "mcp-get-schedule") {
    return handle_get_schedule(user, body)
  }
  if (oT === "mcp-get-cards") {
    return handle_get_cards(user, body)
  }

  return { code: "E4000" }
}

function handle_health(user: Table_User): LiuRqReturn<LiubaiMcpAPI.Res_Health> {
  return {
    code: "0000",
    data: {
      operateType: "mcp-health",
      ok: true,
      userId: user._id,
    },
  }
}

function funcNameToContentType(
  funcName: string,
): LiubaiMcpAPI.Res_PendingContent["contentType"] {
  if (funcName === "add_todo") return "todo"
  if (funcName === "add_calendar") return "calendar"
  return "note"
}

function funcNameToOperateType(
  funcName: string,
): LiubaiMcpAPI.Res_PendingContent["operateType"] {
  if (funcName === "add_todo") return "mcp-add-todo"
  if (funcName === "add_calendar") return "mcp-add-calendar"
  return "mcp-add-note"
}

async function mcp_create_pending(
  user: Table_User,
  funcName: "add_note" | "add_todo" | "add_calendar",
  body: Record<string, any>,
): Promise<LiuRqReturn<LiubaiMcpAPI.Res_PendingContent>> {
  const funcJson = extractToolParams(body, metaKeys)

  const res1 = AiToolUtil.turnJsonToWaitingData(funcName, funcJson, user)
  if (!res1.pass) return res1.err

  const room = await getOrCreateAiRoom(user._id)
  if (!room) {
    return { code: "E5001", errMsg: "fail to get ai room" }
  }

  const b1 = getBasicStampWhileAdding()
  const newChat: Partial_Id<Table_AiChat> = {
    ...b1,
    sortStamp: b1.insertedStamp,
    infoType: "tool_use",
    roomId: room._id,
    funcName,
    funcJson,
  }
  const chatId = await AiShared.addChat(newChat)
  if (!chatId) {
    return { code: "E5001", errMsg: "fail to add ai chat" }
  }

  const { agreeLink, editLink } = ToolShared.getAgreeAndEditLinks(chatId)

  return {
    code: "0000",
    data: {
      operateType: funcNameToOperateType(funcName),
      status: "pending",
      contentType: funcNameToContentType(funcName),
      chatId,
      agreeLink,
      editLink,
      funcJson,
    },
  }
}

async function handle_get_pending(
  user: Table_User,
  body: Record<string, any>,
): Promise<LiuRqReturn<LiubaiMcpAPI.Res_GetPending>> {
  const chatId = body.chatId
  if (typeof chatId !== "string" || !chatId) {
    return { code: "E4000", errMsg: "chatId is required" }
  }

  const shared = await getAiChatForUser(user, chatId)
  if (!shared.pass) return shared.err
  const { theChat, funcName, funcJson } = shared.data
  if (!funcName || !funcJson) {
    return { code: "E5001", errMsg: "funcName or funcJson is empty" }
  }

  const contentType = funcNameToContentType(funcName)
  const { agreeLink, editLink } = ToolShared.getAgreeAndEditLinks(chatId)

  if (theChat.contentId) {
    return {
      code: "0000",
      data: {
        operateType: "mcp-get-pending",
        status: "created",
        contentType,
        chatId,
        contentId: theChat.contentId,
        agreeLink,
        editLink,
      },
    }
  }

  const res3 = AiToolUtil.turnJsonToWaitingData(funcName, funcJson, user)
  if (!res3.pass) return res3.err

  return {
    code: "0000",
    data: {
      operateType: "mcp-get-pending",
      status: "pending",
      contentType,
      chatId,
      agreeLink,
      editLink,
      funcJson,
    },
  }
}

async function handle_get_schedule(
  user: Table_User,
  body: Record<string, any>,
): Promise<LiuRqReturn<LiubaiMcpAPI.Res_Read>> {
  const funcJson = extractToolParams(body, metaKeys)
  // ToolShared filters aiReadable: "Y" (Web privacy「AI 可读」)
  const toolShared = new ToolShared(user, { fromSystem2: true })
  const res1 = await toolShared.get_schedule(funcJson)
  if (!res1.pass) return res1.err
  const { textToBot, hasData } = res1.data
  return {
    code: "0000",
    data: {
      operateType: "mcp-get-schedule",
      text: textToBot,
      hasData,
    },
  }
}

async function handle_get_cards(
  user: Table_User,
  body: Record<string, any>,
): Promise<LiuRqReturn<LiubaiMcpAPI.Res_Read>> {
  const funcJson = extractToolParams(body, metaKeys)
  // ToolShared filters aiReadable: "Y" (Web privacy「AI 可读」)
  const toolShared = new ToolShared(user, { fromSystem2: true })
  const res1 = await toolShared.get_cards(funcJson)
  if (!res1.pass) return res1.err
  const { textToBot, hasData } = res1.data
  return {
    code: "0000",
    data: {
      operateType: "mcp-get-cards",
      text: textToBot,
      hasData,
    },
  }
}

async function getOrCreateAiRoom(userId: string): Promise<Table_AiRoom | undefined> {
  const rCol = db.collection("AiRoom")
  const res1 = await rCol.where({ owner: userId }).getOne<Table_AiRoom>()
  if (res1.data) return res1.data

  const b2 = getBasicStampWhileAdding()
  const characters = AiShared.fillCharacters()
  const room2: Partial_Id<Table_AiRoom> = {
    ...b2,
    owner: userId,
    characters,
  }
  const res2 = await rCol.add(room2)
  const roomId = getDocAddId(res2)
  if (!roomId) return
  return { _id: roomId, ...room2 }
}

async function getAiChatForUser(
  user: Table_User,
  chatId: string,
) {
  const aiChatCol = db.collection("AiChat")
  const res1 = await aiChatCol.doc(chatId).get<Table_AiChat>()
  const theChat = res1.data
  if (!theChat) {
    return {
      pass: false as const,
      err: { code: "E4004", errMsg: "ai chat not found" },
    }
  }

  const rCol = db.collection("AiRoom")
  const res2 = await rCol.doc(theChat.roomId).get<Table_AiRoom>()
  const theRoom = res2.data
  if (!theRoom) {
    return {
      pass: false as const,
      err: { code: "E4004", errMsg: "ai room not found" },
    }
  }

  if (theRoom.owner !== user._id) {
    return {
      pass: false as const,
      err: { code: "E4003", errMsg: "permission denied" },
    }
  }

  return {
    pass: true as const,
    data: {
      theChat,
      theRoom,
      funcName: theChat.funcName,
      funcJson: theChat.funcJson,
    },
  }
}

const metaKeys = [
  "operateType",
  "chatId",
  "x_liu_language",
  "x_liu_theme",
  "x_liu_version",
  "x_liu_stamp",
  "x_liu_timezone",
  "x_liu_client",
  "x_liu_device",
  "x_liu_token",
  "x_liu_serial",
  "x_liu_ide_type",
  "x_liu_machine_id",
  "x_liu_mini_env_type",
]

function extractToolParams(
  body: Record<string, any>,
  excludeKeys: string[],
): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(body)) {
    if (excludeKeys.includes(k)) continue
    if (v === undefined) continue
    out[k] = v
  }
  return out
}
