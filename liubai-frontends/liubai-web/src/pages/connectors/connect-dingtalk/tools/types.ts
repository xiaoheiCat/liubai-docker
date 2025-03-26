import type { PageState } from "~/types/types-atom"

export interface CwData {
  pageState: PageState
  webhook_toggle: boolean
  webhook_url?: string
  canSave: boolean
  isSaving: boolean
  original_webhook_url: string
}