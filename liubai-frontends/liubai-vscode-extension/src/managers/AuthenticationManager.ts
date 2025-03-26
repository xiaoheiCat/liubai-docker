import * as vscode from 'vscode';
import valTool from '../utils/basic/val-tool';
import type { LiuAuthStatus } from '../types';
import liuInfo from '~/utils/liu-info';
import liuReq from '~/requests/liu-req';
import APIs from '~/requests/APIs';
import time from '~/utils/basic/time';
import { 
  type Res_HelloWorld,
  UserLoginAPI,
} from '~/types/types-req';
import { i18n } from '~/locales/i18n';
import { 
  showErrMsg, 
  showProgress, 
  showProgressWithStop, 
  showWarning,
} from '~/utils/show-msg';
import { 
  createClientKey, 
  getMyDataFromSpaceMemberList,
} from "./tools/common-tools"
import type { LiuTimeout, SimpleFunc } from '~/utils/basic/type-tool';
import { Logger } from '~/utils/Logger';
import { SimpleEventBus } from '~/utils/event-bus/simple-event-bus';
import liuEnv from '~/utils/liu-env';
import { RefreshAuth } from './tools/refresh-auth';
import type { RefreshDuration } from '~/types/types-atom';

const customEnv = liuEnv.getEnv()
const appPrefix = customEnv.appPrefix ?? ""
const LOGIN_DATA_KEY = `${appPrefix}login_data`
const AUTH_CALLBACK_PATH = "/auth-complete"
const SEC_15 = time.SECONED * 15

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

  // some data
  private _stopProgressForOpeningBrowser: SimpleFunc | undefined
  private _timeoutForOpeningBrowser: LiuTimeout

  // `private` is in order to avoid new AuthenticationManager() 
  // from being called by outside
  private constructor(context: vscode.ExtensionContext) {
    this._context = context

    // 1. to register uri handler for `code`
    this.initListenToCode()
    
    // 2. init async
    this.initAsync()
  }

  private async initAsync() {
    // 1. calibrate time
    await this.timeCalibrate()

    // 2. check out auth status
    const res2 = await this.getAuthStatus()
    if(res2) {
      this.tryToRefreshAuth(res2)
      return
    }

    // 3. request login first to user
    this.startToLogin()
  }

  public async tryToRefreshAuth(
    oldAuthStatus: LiuAuthStatus,
    duration: RefreshDuration = "WEEK",
  ) {
    // 0. check out api_domain
    const storagedDomain = oldAuthStatus.api_domain
    const currentDomain = customEnv.apiDomain
    if(storagedDomain !== currentDomain) {
      Logger.warn("the api domains do not match")
      Logger.info("see storagedDomain: ", storagedDomain)
      Logger.info("see currentDomain: ", currentDomain)
      this.logoutLocally()
      return
    }

    // 1. to refresh
    const refreshAuth = new RefreshAuth(this._context, LOGIN_DATA_KEY)
    const res1 = await refreshAuth.refreshToken(oldAuthStatus, duration)
    if(res1) return

    // 2. to logout
    this.logoutLocally()
  }



  public async startToLogin(
    skipPrompt: boolean = false,
  ) {
    const _this = this

    if(!skipPrompt) {
      // 1. show message and wait user confirm
      const res1 = await this.showLoginFirst()
      if(!res1) return

      // 2. check out auth status again
      const res2 = await this.getAuthStatus()
      if(res2) {
        this.showLoggedIn(res2)
        return true
      }
    }

    // 3. show progress and then fetch data for init
    const res3_2 = await showProgress({
      titleKey: "login.preparing",
      cancellable: true,
    }, async () => {
      const url3_1 = APIs.LOGIN
      const res3_1 = await liuReq.request<UserLoginAPI.Res_Init>(
        url3_1, 
        { operateType: "init" }
      )
      return res3_1
    })
    if(!res3_2) return
    // console.log("see res3_2: ")
    // console.log(res3_2)
    Logger.info("user-login init result: ", res3_2)
    
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
    _this._stopProgressForOpeningBrowser = stop

    // 7. get redirect_uri
    const info = liuInfo.getInfo()
    const extId = info.extensionId
    const uriScheme = info.uriScheme
    const callbackLink = `${uriScheme}://${extId}${AUTH_CALLBACK_PATH}`
    const callbackUri = vscode.Uri.parse(callbackLink)
    const outCallbackUri = await vscode.env.asExternalUri(callbackUri)
    const tmpLink = outCallbackUri.toString()
    const redirect_uri = decodeURIComponent(tmpLink)

    // 8. request credential
    const url8 = APIs.LOGIN
    const body8: UserLoginAPI.Param_AuthRequest = {
      operateType: "auth_request",
      redirect_uri,
      state,
    }
    const res8 = await liuReq.request<UserLoginAPI.Res_AuthRequest>(
      url8,
      body8,
    )
    if(isCancelled) {
      console.warn("cancelled 111")
      return
    }

    // 9. handle result from auth_request
    const { data: data9, code: code9 } = res8
    if(code9 !== "0000" || !data9) {
      showErrMsg("login", res8)
      return
    }
    const credential = data9.credential
    let baseUrl = data9.baseUrl
    // baseUrl = "http://localhost:5175"
    _this._credential = credential

    // 10. splice a string
    const authUrl = new URL(baseUrl)
    authUrl.pathname = "/authorize"
    const sp10 = authUrl.searchParams
    sp10.set("credential", credential)
    sp10.set("state", state)
    const authLink = authUrl.toString()
    const authUri = vscode.Uri.parse(authLink)
    // console.log("authUri: ", authUri)
    
    // 11. open in browser
    const res11 = await vscode.env.openExternal(authUri)
    if(res11) {
      this.whenOpeningBrowserForAuth()
    }
    else {
      this.cancelProgressForOpeningBrowser()
    }
  }
  
  private whenOpeningBrowserForAuth() {
    const t1 = this._timeoutForOpeningBrowser
    if(t1) clearTimeout(t1)

    const _this = this
    this._timeoutForOpeningBrowser = setTimeout(async () => {
      _this._timeoutForOpeningBrowser = undefined
      _this.cancelProgressForOpeningBrowser()
      await valTool.waitMilli(300)
      _this.startToInputAuthCode()
    }, SEC_15)
  }

  private async startToInputAuthCode() {
    // 1. show notification for inputting auth code
    const res1 = await this.showInputAuthCodeMsg()
    if(!res1) return

    // 2. check auth status again
    const res2 = await this.getAuthStatus()
    if(res2) {
      this.showLoggedIn(res2)
      return
    }

    // 3. show input box
    console.log("get to input")
    const res3 = await vscode.window.showInputBox({
      title: i18n.t("login.title"),
      placeHolder: i18n.t("login.placeHolder"),
      prompt: i18n.t("login.code_tip"),
      ignoreFocusOut: true,
    })
    if(!res3) return
    const code = res3.trim()
    if(code.length < 5) return
    this._code = code
    this.afterGettingCode()
  }


  private cancelProgressForOpeningBrowser() {
    const t1 = this._timeoutForOpeningBrowser
    if(t1) clearTimeout(t1)
    this._timeoutForOpeningBrowser = undefined
    this._stopProgressForOpeningBrowser?.()
    this._stopProgressForOpeningBrowser = undefined
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

  private async showInputAuthCodeMsg() {
    const title = i18n.t("login.cannot_open_ide")
		const confirmTxt = i18n.t("login.input_auth_code")
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

    Logger.info(`time calibrate: ${diff}`)

    this._calibrated = true
    return true
  }


  private initListenToCode() {
    const _this = this

    // 1. register uri handler
    const uriHandler = {
      "handleUri": async (uri: vscode.Uri) => {
        const uriPath = uri.path
        console.warn("see uriPath: ")
        console.log(uriPath)
        if(uriPath !== AUTH_CALLBACK_PATH) {
          console.warn(`the current path is not ${AUTH_CALLBACK_PATH}`)
          return
        }

        _this.cancelProgressForOpeningBrowser()
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
        _this._code = code
        _this.afterGettingCode()
      }
    }
    vscode.window.registerUriHandler(uriHandler)

    // 2. register `login or logout` command
    const extId = liuInfo.getExtId()
    const cmdId = `${extId}.loginOrLogout`
    const disposable2 = vscode.commands.registerCommand(cmdId, async () => {
      _this.handleLoginOrLogout()
    })
    this._context.subscriptions.push(disposable2)
  }


  private async handleLoginOrLogout() {
    const res = await this.getAuthStatus()
    if(res) {
      this.showLogout(res)
    }
    else {
      this.startToLogin(true)
    }
  }

  private async showLogout(authStatus: LiuAuthStatus) {
    const title = i18n.t("logout.title")
    let desc = i18n.t("logout.desc_2")
    const name = authStatus.nickname
    if(name) {
      desc = i18n.t("logout.desc_1", { name })
    }

    const confirmTxt = i18n.t("logout.confirm")
    const cancelTxt = i18n.t("common.cancel")
    const confirmItem = { title: confirmTxt }
    const cancelItem = { title: cancelTxt, isCloseAffordance: true }

    // 1. show logout tip
    const res1 = await vscode.window.showInformationMessage(title, {
      detail: desc,
      modal: true,
    }, confirmItem, cancelItem)
    if(!res1) return
    if(res1.title !== confirmTxt) return

    // 2. logout remotely
    const url2 = APIs.LOGOUT
    const res2 = await liuReq.request(url2, { operateType: "logout" })

    // 3. logout locally
    await this.logoutLocally()
  }

  private async logoutLocally() {
    try {
      await this._context.secrets.delete(LOGIN_DATA_KEY)
    }
    catch(err) {
      Logger.warn("loginAgain error", err)
      return false
    }
    return true
  }

  public async loginAgain() {
    const res = await this.logoutLocally()
    if(!res) return
    this.startToLogin()
  }

  private async afterGettingCode() {
    // 1. check out code and credential
    const code = this._code
    const cred = this._credential
    if(!code || !cred) {
      console.warn("code and credential are required")
      console.log(code)
      console.log(cred)
      return
    }

    // 2. check out key
    const client_key = this._client_key
    const enc_client_key = this._enc_client_key
    if(!client_key || !enc_client_key) {
      console.warn("client_key and enc_client_key are required")
      console.log(client_key)
      console.log(enc_client_key)
      return
    }

    // 3. try to login
    const url3 = APIs.LOGIN
    const body3: UserLoginAPI.Param_AuthSubmit = {
      operateType: "auth_submit",
      credential: cred,
      code,
      enc_client_key,
    }
    const res3_2 = await showProgress({
      titleKey: "login.logging",
    }, async () => {
      const res3_1 = await liuReq.request<UserLoginAPI.Res_Normal>(
        url3,
        body3,
      )
      return res3_1
    })
    if(!res3_2) return

    // 4. show basic error
    const code4 = res3_2.code
    const data4 = res3_2.data
    if(code4 !== "0000" || !data4) {
      showErrMsg("login", res3_2)
      return
    }

    // 5. get serial / token
    const {
       serial_id,
       token,
       spaceMemberList,
    } = data4
    if(!serial_id || !token || !spaceMemberList) {
      console.warn("there is no serial_id, token, or spaceMemberList")
      console.log(serial_id)
      console.log(token)
      console.log(spaceMemberList)
      return
    }

    // 6.1 storage login data into secrets
    const myData = getMyDataFromSpaceMemberList(spaceMemberList)
    const { personal_space_id, nickname } = myData
    if(!personal_space_id) {
      Logger.warn("there is no personal space id")
      return
    }
    const data6: LiuAuthStatus = {
      token,
      serial: serial_id,
      client_key,
      updated_stamp: time.getTime(),
      nickname,
      personal_space_id,
      api_domain: customEnv.apiDomain,
    }
    const val6 = valTool.objToStr(data6)
    await this._context.secrets.store(LOGIN_DATA_KEY, val6)

    // 6.2 emit event
    const eventBus = SimpleEventBus.getInstance()
    eventBus.getEmitter().fire("just-logged")

    // 7. show success
    let title7 = i18n.t("login.has_signed_in")
    if(nickname) {
      title7 = i18n.t("login.logged_in", { nickname })
    }
		const confirmTxt = i18n.t("common.record_1")
		const cancelTxt = i18n.t("common.cancel")
    const res7 = await vscode.window.showInformationMessage(title7, confirmTxt, cancelTxt)
    if(res7 === confirmTxt) {
      console.log("let's start to record!")
      const extId = liuInfo.getExtId()
      vscode.commands.executeCommand(`${extId}.record`)
    }

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

