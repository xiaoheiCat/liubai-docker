import type { PageState } from "~/types/types-atom"

export interface CwData {
  pageState: PageState
  backup_toggle: boolean
  api_token?: string
  datasheet_id?: string
  canSave: boolean
  isSaving: boolean
  original_api_token: string
  original_datasheet_id: string
}