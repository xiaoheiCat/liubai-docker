import type { LiuInfo } from "../types"
import type { LiuIDEType } from "../types/types-atom"
import * as vscode from 'vscode'
import { getDeviceStrForWeb, getDeviceStrForNode } from "./tools/characteristic"
import typeCheck from "./basic/type-check"
import liuEnv from "./liu-env"
import { Logger } from "./Logger"

let _info: LiuInfo

const getIdeType = (): LiuIDEType | undefined => {
  const _env = vscode.env
  const { appName, appHost, uriScheme, remoteName } = _env

  console.log("see appName: ", appName)
  console.log("see appHost: ", appHost)
  Logger.info("see appName: ", appName)
  Logger.info("see appHost: ", appHost)
  Logger.info("see uriScheme: ", uriScheme)
  Logger.info("see remoteName: ", remoteName)

  if(appHost === "vscode.dev") return "vscode.dev"
  if(appHost === "github.dev") return "github.dev"
  if(appName === "Visual Studio Code") return "vscode"
  if(appName === "Visual Studio Code - Insiders") return "vscode-insiders"
  if(appName === "Cursor") return "cursor"
  if(appName === "Windsurf") return "windsurf"
  if(appName === "VSCodium") return "vscodium"
  if(appName === "Gitpod Code" || appHost === "Gitpod") return "gitpod.io"
  if(appName === "StackBlitz") return "stackblitz.com"
  if(appName === "Project IDX") return "project-idx"

  // Products from Tencent Coding Group
  if(uriScheme === "cloud-studio") return "tencent-cloud-studio"
  if(remoteName?.endsWith(".cnb.cool")) return "cnb.cool"
  if(remoteName?.endsWith(".cnb.space")) return "cnb.cool"
  if(appName === "code-server" && uriScheme === "code-oss") return "cnb.cool"

  // Trae
  if(appName === "Trae" || uriScheme === "trae") return "trae"
  if(uriScheme === "trae-cn") return "trae"
}

const _getDeviceData = (isWeb: boolean) => {
  let deviceStr: string | undefined
  let deviceName: string | undefined

  try {

    // for node
    if(!isWeb && typeof process !== "undefined") {
      deviceStr = getDeviceStrForNode()
      const os = require("os")
      const hostname = os.hostname()
      if(hostname && typeCheck.isString(hostname)) {
        deviceName = hostname
      }
    }

    // for web
    //@ts-expect-error: navigator
    if(isWeb && typeof navigator !== "undefined") {
      deviceStr = getDeviceStrForWeb()
    }
  }
  catch(err) {
    console.warn("_getDeviceData err: ")
    console.log(err)
  }

  return { deviceStr, deviceName }
}

/** more info please see: 
 *  https://code.visualstudio.com/api/advanced-topics/remote-extensions#varying-behaviors-when-running-remotely-or-in-the-codespaces-browser-editor
*/
const init = (context: vscode.ExtensionContext) => {
  const extensionId = context.extension.id
  const _env = vscode.env
  
  let ideType = getIdeType()
  if(!ideType) ideType = "vscode"

  const isDesktop = _env.uiKind === vscode.UIKind.Desktop
  const isWeb = _env.uiKind === vscode.UIKind.Web
  const customEnv = liuEnv.getEnv()
  const extVersion = customEnv.extVersion
  const { deviceStr, deviceName } = _getDeviceData(isWeb)
  const extKind = context.extension.extensionKind
  const extensionKind = extKind === vscode.ExtensionKind.Workspace ? "workspace" : "ui"

  let machineId: string | undefined = _env.machineId
  let sessionId: string | undefined = _env.sessionId
  if(machineId === "someValue.machineId") machineId = undefined
  if(sessionId === "someValue.sessionId") sessionId = undefined
  
  _info = {
    ideType,
    isDesktop,
    isWeb,
    extensionId,
    ideVersion: vscode.version,
    extensionKind,
    extensionVersion: extVersion ?? "",
    machineId,
    sessionId,
    uriScheme: _env.uriScheme,
    remoteName: _env.remoteName,
    deviceName,
    deviceStr,
  }
}

const getInfo = () => {
  return _info
}

const getExtId = () => {
  return _info.extensionId
}

export default {
  getIdeType,
  init,
  getInfo,
  getExtId,
}