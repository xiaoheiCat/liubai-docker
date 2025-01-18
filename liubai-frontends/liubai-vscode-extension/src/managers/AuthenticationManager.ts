import * as vscode from 'vscode';
import cfg from "../config"; 
import valTool from '../utils/basic/val-tool';
import type { LiuAuthStatus } from '../types';
import liuInfo from '~/utils/liu-info';
import liuReq from '~/requests/liu-req';
import APIs from '~/requests/APIs';
import time from '~/utils/basic/time';
import type { Res_HelloWorld, Res_UserLoginInit } from '~/types/types-req';
import { i18n } from '~/locales/i18n';
import { showErrMsg, showProgress, showProgressWithStop, showWarning } from '~/utils/show-msg';
import { createClientKey } from "./tools/common-tools"
import type { SimpleFunc } from '~/utils/basic/type-tool';

const LOGIN_DATA_KEY = `${cfg.appPrefix}login_data`
const AUTH_CALLBACK_PATH = "/auth-complete"

export class AuthenticationManager {

  private static _instance: AuthenticationManager;
  private _context: vscode.ExtensionContext;
  private _calibrated: boolean = false;

  // data before logging in
  private _state: string | undefined;
  private _client_key: string | undefined;
  private _enc_client_key: string | undefined;
  private _credential: string | undefined;
  private _code: string | undefined;

  // stop loading
  private _stopProgressForLogging: SimpleFunc | undefined

  // `private` is in order to avoid new AuthenticationManager() 
  // from being called by outside
  private constructor(context: vscode.ExtensionContext) {
    this._context = context

    // 1. to register uri handler for `code`
    this.initListenToCode()
    

    // 2. to register `openBrowser` command
    const info = liuInfo.getInfo()
    const extId = info.extensionId
    const uriScheme = info.uriScheme

    const commandName = `${extId}.openBrowser`
    const disposable2 = vscode.commands.registerCommand(commandName, async () => {
      const callbackLink = `${uriScheme}://${extId}${AUTH_CALLBACK_PATH}`
      const callbackUri = vscode.Uri.parse(callbackLink)
      console.log(`callback uri: `, callbackUri)
      console.log(`callback uri toString(): `, callbackUri.toString())
  
      const externalUri = await vscode.env.asExternalUri(callbackUri)
      console.log(`external uri: `, externalUri)
      console.log(`external uri toString(): `, externalUri.toString())

      const appLink = LIU_ENV.LIU_DOMAIN ?? ""
      const appUri = vscode.Uri.parse(appLink, true)

    })
    context.subscriptions.push(disposable2)

    // 4. init async
    this.initAsync()
  }

  private async initAsync() {
    // 1. calibrate time
    await this.timeCalibrate()

    // 2. check out auth status
    const res2 = await this.getAuthStatus()
    if(res2) {
      console.log("it is already logged in")
      return
    }

    // 3. request login first to user
    this.startToLogin()
  }


  private async startToLogin() {
    const _this = this

    // 1. show message and wait user confirm
    const res1 = await this.showLoginFirst()
    if(!res1) return

    // 2. check out auth status again
    const res2 = await this.getAuthStatus()
    if(res2) {
      this.showLoggedIn(res2)
      return
    }

    // 3. show progress and then fetch data for init
    const res3_2 = await showProgress({
      titleKey: "login.preparing",
      cancellable: true,
    }, async () => {
      const url3_1 = APIs.LOGIN
      const res3_1 = await liuReq.request<Res_UserLoginInit>(url3_1, { 
        operateType: "init",
      })
      return res3_1
    })
    if(!res3_2) return
    
    // 4. get pk
    const { data: data4 } = res3_2
    const pk = data4?.publicKey
    const state = data4?.state
    if(!data4 || !pk || !state) {
      showErrMsg("login", res3_2)
      return
    }

    // 5. client_key, enc_client_key, and state
    _this._state = state
    const { aesKey, cipher } = await createClientKey(pk)
    // console.log("see aesKey: ")
    // console.log(aesKey)
    // console.log("see cipher: ")
    // console.log(cipher)
    if(!aesKey || !cipher) {
      showWarning("Fail to create client key")
      return
    }
    _this._client_key = aesKey
    _this._enc_client_key = cipher

    await valTool.waitMilli(300)

    // 6. show progress with "login.authorizing"
    let isCancelled = false
    const { stop } = showProgressWithStop({
      titleKey: "login.authorizing",
      cancellable: true,
      onCancellationRequested() {
        isCancelled = true
      }
    })
    _this._stopProgressForLogging = stop



  }

  private showLoggedIn(authStatus: LiuAuthStatus) {
    const title_1 = i18n.t("login.has_signed_in")
    vscode.window.showInformationMessage(title_1)
  }

  private async showLoginFirst() {
    const title = i18n.t("login.h1")
		const confirmTxt = i18n.t("login.sign_in")
		const cancelTxt = i18n.t("common.cancel")
    const res = await vscode.window.showInformationMessage(title, confirmTxt, cancelTxt)
		return Boolean(res === confirmTxt)
  }


  private async timeCalibrate() {
    const url = APIs.TIME
    const t1 = time.getLocalTime()
    const res = await liuReq.request<Res_HelloWorld>(url)
    const t2 = time.getLocalTime()
    const { code, data } = res
    if(code !== "0000") return
    if(!data) return

    const clientStamp = Math.round((t2 + t1) / 2)
    const theStamp = data.stamp
    const diff = theStamp - clientStamp
    time.setDiff(diff)

    this._calibrated = true
    return true
  }


  private initListenToCode() {
    const _this = this
    const handler = {
      "handleUri": async (uri: vscode.Uri) => {
        const uriPath = uri.path
        console.warn("see uriPath: ")
        console.log(uriPath)
        if(uriPath !== AUTH_CALLBACK_PATH) {
          console.warn(`the current path is not ${AUTH_CALLBACK_PATH}`)
          return
        }
        console.log("see uri.query:")
        console.log(uri.query)

        const q = new URLSearchParams(uri.query)
        const code = q.get("code")
        const state = q.get("state")
        console.log("see code: ", code)
        console.log("see state: ", state)
        if(!code || !state) {
          console.warn("code and state are required in query")
          return
        }
        if(state !== _this._state) {
          console.warn("state does not match")
          return
        }
        this._code = code
        _this.afterGettingCode()
      }
    }
    vscode.window.registerUriHandler(handler)
  }



  private afterGettingCode() {
    const code = this._code
    const cred = this._credential
    if(!code || !cred) return

  }


  public static getInstance(context: vscode.ExtensionContext) {
    if(!AuthenticationManager._instance) {
      AuthenticationManager._instance = new AuthenticationManager(context)
    }
    return AuthenticationManager._instance
  }

  public async getAuthStatus() {
    const res = await this._context.secrets.get(LOGIN_DATA_KEY)
    if(!res) return
    const data = valTool.strToObj<LiuAuthStatus>(res)
    if(!data || !data.serial || !data.token) return
    liuReq.setAuthStatus(data)
    return data
  }


}

