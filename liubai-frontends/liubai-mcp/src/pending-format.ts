import { getAssistantName, getMessageFormat } from "./config.js"
import { formatPendingMessage, type MessageFormat } from "./pending-message.js"

interface PendingPayload {
  status: string
  contentType?: string
  agreeLink: string
  editLink: string
  funcJson?: Record<string, unknown>
  contentId?: string
}

export function formatPendingToolResult(data: PendingPayload): string {
  const format: MessageFormat = getMessageFormat()
  return formatPendingMessage({
    status: data.status,
    contentType: data.contentType,
    assistantName: getAssistantName(),
    agreeLink: data.agreeLink,
    editLink: data.editLink,
    funcJson: data.funcJson,
    contentId: data.contentId,
    format,
  })
}
