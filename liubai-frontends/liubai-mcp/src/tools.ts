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
  "Return the tool result to the user verbatim (WeChat-style approval message with agree/edit links)."

export const tools: McpToolDef[] = [
  {
    name: "liubai_health",
    description: "Check connectivity to your Liubai account.",
    inputSchema: { type: "object", properties: {} },
    handler: async (client) => {
      const data = await client.call("mcp-health")
      return textResult(data)
    },
  },
  {
    name: "liubai_add_todo",
    description:
      `Submit a todo for user approval on the Web. ${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Todo title" },
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
      `Submit a calendar/reminder for user approval on the Web. ${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional title" },
        description: { type: "string", description: "Event content (required)" },
        date: { type: "string", description: "Date YYYY-MM-DD (mutually exclusive with specificDate)" },
        specificDate: {
          type: "string",
          enum: [...addCalendarSpecificDates],
          description: "Relative date such as today or tomorrow",
        },
        time: { type: "string", description: "Time hh:mm" },
        earlyMinute: {
          type: "string",
          enum: [...addCalendarEarlyMinutes],
          description: "Reminder offset in minutes before the event",
        },
        laterHour: {
          type: "string",
          enum: [...addCalendarLaterHours],
          description: "Hours from now (mutually exclusive with date/time/earlyMinute)",
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
      `Submit a note for user approval on the Web. ${PENDING_TOOL_HINT}`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Note title" },
        description: { type: "string", description: "Note body (required)" },
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
      "Check whether a previously submitted item (by chatId) has been approved and created in Liubai.",
    inputSchema: {
      type: "object",
      properties: {
        chatId: { type: "string", description: "chatId returned by add_* tools" },
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
      "Get upcoming or past calendar entries from Liubai. Omit both params to fetch the next 10 events.",
    inputSchema: {
      type: "object",
      properties: {
        hoursFromNow: {
          type: "string",
          enum: [...getScheduleHoursFromNow],
          description: "Window in hours; negative values look into the past",
        },
        specificDate: {
          type: "string",
          enum: [...getScheduleSpecificDates],
          description: "Filter by a specific day",
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
    description: "Get todos, finished items, recent cards, or recent timed events from Liubai.",
    inputSchema: {
      type: "object",
      properties: {
        cardType: {
          type: "string",
          enum: [...getCardTypes],
          description: "TODO | FINISHED | ADD_RECENTLY | EVENT",
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
