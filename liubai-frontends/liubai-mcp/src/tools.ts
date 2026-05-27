import { z } from "zod"
import type { LiubaiClient } from "./client.js"
import { formatPendingToolResult } from "./pending-format.js"

const addCalendarSpecificDates = [
  "today",
  "tomorrow",
  "day_after_tomorrow",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const addCalendarEarlyMinutes = ["0", "10", "15", "30", "60", "120", "1440"] as const
const addCalendarLaterHours = ["0.5", "1", "2", "3", "12", "24"] as const

const getScheduleHoursFromNow = ["-24", "24", "48"] as const
const getScheduleSpecificDates = [
  "yesterday",
  "today",
  "tomorrow",
  "day_after_tomorrow",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const getCardTypes = ["TODO", "FINISHED", "ADD_RECENTLY", "EVENT"] as const

interface PendingResponse extends Record<string, unknown> {
  status: string
  chatId: string
  agreeLink: string
  editLink: string
  funcJson?: Record<string, unknown>
  contentId?: string
  contentType?: string
}

export interface McpToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (client: LiubaiClient, args: Record<string, unknown>) => Promise<string>
}

function textResult(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2)
}

const PENDING_TOOL_HINT =
  "将工具返回结果原文发给用户（含同意/编辑链接的微信式待确认话术）。"

export const tools: McpToolDef[] = [
  {
    name: "liubai_health",
    description: "检查 Liubai 账号连接是否正常。",
    inputSchema: { type: "object", properties: {} },
    handler: async (client) => {
      const data = await client.call("mcp-health")
      return textResult(data)
    },
  },
  {
    name: "liubai_add_todo",
    description:
      `提交待办，待用户在 Web 端确认后才会写入。${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "待办标题" },
      },
      required: ["title"],
    },
    handler: async (client, args) => {
      const parsed = z.object({ title: z.string().min(1) }).parse(args)
      const data = await client.call<PendingResponse>("mcp-add-todo", parsed)
      return formatPendingToolResult(data)
    },
  },
  {
    name: "liubai_add_calendar",
    description:
      `提交日程/提醒，待用户在 Web 端确认后才会写入。${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "标题（可选）" },
        description: { type: "string", description: "日程内容（必填）" },
        date: { type: "string", description: "日期 YYYY-MM-DD（与 specificDate 互斥）" },
        specificDate: {
          type: "string",
          enum: [...addCalendarSpecificDates],
          description: "相对日期，如 today、tomorrow",
        },
        time: { type: "string", description: "时间 hh:mm" },
        earlyMinute: {
          type: "string",
          enum: [...addCalendarEarlyMinutes],
          description: "提前提醒分钟数",
        },
        laterHour: {
          type: "string",
          enum: [...addCalendarLaterHours],
          description: "距今小时数（与 date/time/earlyMinute 互斥）",
        },
      },
      required: ["description"],
    },
    handler: async (client, args) => {
      const data = await client.call<PendingResponse>("mcp-add-calendar", args)
      return formatPendingToolResult(data)
    },
  },
  {
    name: "liubai_add_note",
    description:
      `提交笔记，待用户在 Web 端确认后才会写入。${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "笔记标题" },
        description: { type: "string", description: "笔记正文（必填）" },
      },
      required: ["description"],
    },
    handler: async (client, args) => {
      const data = await client.call<PendingResponse>("mcp-add-note", args)
      return formatPendingToolResult(data)
    },
  },
  {
    name: "liubai_get_pending",
    description:
      "根据 chatId 查询先前提交的条目是否已在 Liubai 中创建。",
    inputSchema: {
      type: "object",
      properties: {
        chatId: { type: "string", description: "add_* 工具返回的 chatId" },
      },
      required: ["chatId"],
    },
    handler: async (client, args) => {
      const parsed = z.object({ chatId: z.string().min(1) }).parse(args)
      const data = await client.call<PendingResponse>("mcp-get-pending", parsed)
      return formatPendingToolResult(data)
    },
  },
  {
    name: "liubai_get_schedule",
    description:
      "查询 Liubai 日程（仅返回隐私设置中已开启「AI 可读」的卡片）。不传参数时返回接下来 10 条日程。",
    inputSchema: {
      type: "object",
      properties: {
        hoursFromNow: {
          type: "string",
          enum: [...getScheduleHoursFromNow],
          description: "时间窗口（小时）；负值表示查询过去",
        },
        specificDate: {
          type: "string",
          enum: [...getScheduleSpecificDates],
          description: "按指定日期筛选",
        },
      },
    },
    handler: async (client, args) => {
      const data = await client.call<{ text: string; hasData: boolean }>("mcp-get-schedule", args)
      return data.text || JSON.stringify(data)
    },
  },
  {
    name: "liubai_get_cards",
    description:
      "查询待办、已完成、最近卡片或近期定时事件（仅返回隐私设置中已开启「AI 可读」的卡片）。",
    inputSchema: {
      type: "object",
      properties: {
        cardType: {
          type: "string",
          enum: [...getCardTypes],
          description: "TODO（待办）| FINISHED（已完成）| ADD_RECENTLY（最近）| EVENT（定时事件）",
        },
      },
      required: ["cardType"],
    },
    handler: async (client, args) => {
      const parsed = z.object({ cardType: z.enum(getCardTypes) }).parse(args)
      const data = await client.call<{ text: string; hasData: boolean }>("mcp-get-cards", parsed)
      return data.text || JSON.stringify(data)
    },
  },
]
