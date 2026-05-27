export type MessageFormat = "markdown" | "plain"

export interface PendingMessageInput {
  status: string
  contentType?: string
  assistantName: string
  agreeLink: string
  editLink: string
  funcJson?: Record<string, unknown>
  contentId?: string
  format: MessageFormat
}

const specificDateLabels: Record<string, string> = {
  today: "今天",
  tomorrow: "明天",
  day_after_tomorrow: "后天",
  monday: "周一",
  tuesday: "周二",
  wednesday: "周三",
  thursday: "周四",
  friday: "周五",
  saturday: "周六",
  sunday: "周日",
}

function strField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key]
  return typeof v === "string" && v.length > 0 ? v : undefined
}

function formatDateLine(funcJson: Record<string, unknown>): string | undefined {
  const date = strField(funcJson, "date")
  if (date) return date

  const specificDate = strField(funcJson, "specificDate")
  if (specificDate) {
    return specificDateLabels[specificDate] ?? specificDate
  }

  const laterHour = strField(funcJson, "laterHour")
  if (laterHour === "0.5") return "30分钟后"
  if (laterHour) return `${laterHour}小时后`

  return undefined
}

function formatReminderLine(funcJson: Record<string, unknown>): string | undefined {
  const earlyMinute = strField(funcJson, "earlyMinute")
  if (!earlyMinute) return undefined
  const n = Number(earlyMinute)
  if (Number.isNaN(n)) return undefined
  if (n === 0) return "准时提醒"
  if (n < 60) return `提前 ${n} 分钟`
  if (n === 60) return "提前 1 小时"
  if (n === 120) return "提前 2 小时"
  if (n === 1440) return "提前 1 天"
  return `提前 ${n} 分钟`
}

function formatActionLinks(
  agreeLink: string,
  editLink: string,
  format: MessageFormat,
): string {
  if (format === "markdown") {
    return `[同意](${agreeLink})    [编辑](${editLink})`
  }
  return `【同意】${agreeLink}\n【编辑】${editLink}`
}

function formatCalendarBody(funcJson: Record<string, unknown>): string[] {
  const lines: string[] = []
  const title = strField(funcJson, "title")
  const description = strField(funcJson, "description")
  if (description) lines.push(`内容：${description}`)
  if (title) lines.push(`标题：${title}`)

  const dateLine = formatDateLine(funcJson)
  if (dateLine) lines.push(`日期：${dateLine}`)

  const time = strField(funcJson, "time")
  if (time) lines.push(`时间：${time}`)

  const reminder = formatReminderLine(funcJson)
  if (reminder) lines.push(`提醒：${reminder}`)

  return lines
}

function formatTodoBody(funcJson: Record<string, unknown>): string[] {
  const title = strField(funcJson, "title")
  if (!title) return []
  return [`内容：${title}`]
}

function formatNoteBody(funcJson: Record<string, unknown>): string[] {
  const lines: string[] = []
  const description = strField(funcJson, "description")
  const title = strField(funcJson, "title")
  if (description) lines.push(`内容：${description}`)
  if (title) lines.push(`标题：${title}`)
  return lines
}

function actionLabel(contentType?: string): string {
  if (contentType === "todo") return "待办"
  if (contentType === "note") return "笔记"
  return "日程"
}

export function formatPendingMessage(input: PendingMessageInput): string {
  if (input.status === "created" && input.contentId) {
    return [
      "该条目已在 Liubai 中创建。",
      `contentId: ${input.contentId}`,
      `contentType: ${input.contentType ?? "unknown"}`,
    ].join("\n")
  }

  const funcJson = input.funcJson ?? {}
  const label = actionLabel(input.contentType)
  const head = `${input.assistantName} 想要创建${label}`

  let bodyLines: string[] = []
  if (input.contentType === "todo") {
    bodyLines = formatTodoBody(funcJson)
  } else if (input.contentType === "note") {
    bodyLines = formatNoteBody(funcJson)
  } else {
    bodyLines = formatCalendarBody(funcJson)
  }

  const parts = [head, "", ...bodyLines, "", formatActionLinks(input.agreeLink, input.editLink, input.format)]
  return parts.join("\n")
}
