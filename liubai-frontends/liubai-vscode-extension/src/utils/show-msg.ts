import { i18n } from "~/locales/i18n"
import type { LiuErrReturn } from "~/types"
import * as vscode from 'vscode';
import time from "./basic/time";
import valTool from "./basic/val-tool";
import type { ReturnPromise, SimpleFunc } from "./basic/type-tool";


function _getCustomerServiceLink() {
  const customerService = LIU_ENV.CUSTOMER_SERVICE
  const devEmail = LIU_ENV.DEVELOPER_EMAIL
  let link: string | undefined
  if(customerService) {
    link = customerService
  }
  else if(devEmail) {
    link = `mailto:${devEmail}`
  }
  return link
}

export interface LiuProgressOpt {
  location?: vscode.ProgressLocation
  titleKey?: string
  titleOpt?: Record<string, string | number>
  cancellable?: boolean
  minMillis?: number       // by default 1000
}

export async function showProgress<R>(
  opt: LiuProgressOpt,
  fn: ReturnPromise<R>,
) {
  const w = vscode.window
  let title: string | undefined
  if(opt.titleKey) {
    title = i18n.t(opt.titleKey, opt.titleOpt)
  }
  const minMillis = opt.minMillis ?? 600
  const notiLocation = opt.location ?? vscode.ProgressLocation.Notification

  const res2 = await w.withProgress({
    title,
    location: notiLocation,
    cancellable: opt.cancellable,
  }, async (progress, token) => {
    const t1 = time.getLocalTime()
    const res = await fn()
    const t2 = time.getLocalTime()
    if(token.isCancellationRequested) return

    const diff = t2 - t1
    if(diff < minMillis) {
      const ms = Math.max(minMillis - diff, 60)
      await valTool.waitMilli(ms)
    }
    
    return res
  })

  return res2
}


export type ProgressResolver = (res: boolean) => void

export interface LiuProgressWithStopOpt {
  location?: vscode.ProgressLocation
  titleKey?: string
  titleOpt?: Record<string, string | number>
  cancellable?: boolean
  onCancellationRequested?: SimpleFunc
}

export function showProgressWithStop(
  opt: LiuProgressWithStopOpt,
) {
  const w = vscode.window
  let title: string | undefined
  if(opt.titleKey) {
    title = i18n.t(opt.titleKey, opt.titleOpt)
  }
  let _resolve: ProgressResolver | undefined
  const notiLocation = opt.location ?? vscode.ProgressLocation.Notification

  w.withProgress({
    title,
    location: notiLocation,
    cancellable: opt.cancellable,
  }, (progress, token) => {
    token.onCancellationRequested(() => {
      opt.onCancellationRequested?.()
    })
    const _wait = (a: ProgressResolver) => {
      _resolve = a
    }
    return new Promise(_wait)
  })

  const stop = () => {
    _resolve?.(true)
  }

  return { stop }
}


export async function showWarning(
  msg: string,
) {
  const link = _getCustomerServiceLink()

  // 1. show without link
  const w = vscode.window
  if(!link) {
    w.showWarningMessage(msg)
    return true
  }

  // 2. show with link
  const contactUs = i18n.t("tip.contact_us")
  const cancelTxt = i18n.t("common.cancel")
  const res2 = await w.showWarningMessage(msg, contactUs, cancelTxt)
  if(res2 === contactUs) {
    const externalUri = vscode.Uri.parse(link)
    vscode.env.openExternal(externalUri)
  }
  
  return true
}

export async function showErrMsg(
  theType: "login" | "other",
  res: LiuErrReturn,
) {
  // 1. get params
  const { code, errMsg, showMsg } = res

  // 2. handle content
  let content_key = "tip.try_again_later"
  let content_opt: Record<string, string> | undefined
  if(showMsg) {
    content_key = "tip.err_2"
    content_opt = { errMsg: showMsg, code }
  }
  else if(errMsg) {
    content_key = "tip.err_2"
    content_opt = { errMsg, code }
  }

  // 3. handle title
  let title_key = "tip.unknown_err"
  if(theType === "login") {
    title_key = "login.err"
  }

  // 4. message
  let msg = i18n.t(title_key)
  msg += i18n.t(content_key, content_opt)

  // 5. handle customer service link
  const res5 = showWarning(msg)
  return res5
}