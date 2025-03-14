import * as vscode from 'vscode';
import { AuthenticationManager } from './AuthenticationManager';
import liuInfo from '~/utils/liu-info';
import time from '~/utils/basic/time';
import { i18n } from '~/locales/i18n';
import { SimpleEventBus } from '~/utils/event-bus/simple-event-bus';
import type { SyncSetAPI } from '~/types/types-req';
import type { LiuContent } from '~/types/types-atom';
import ider from '~/utils/ider';
import APIs from '~/requests/APIs';
import liuReq from '~/requests/liu-req';
import { Logger } from '~/utils/Logger';
import { LiuStatusBar } from './LiuStatusBar';
import { showErrMsg } from '~/utils/show-msg';
import liuEnv from '~/utils/liu-env';

const MIN_3 = time.MINUTE * 3

export class LiuRecorder {

  private static _instance: LiuRecorder
  private _context: vscode.ExtensionContext;
  private _authManager: AuthenticationManager;
  private _waitingForLoginStamp = 0;

  private constructor(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager,
  ) {
    this._context = context
    this._authManager = authManager
    this._init()
  }

  public static initialize(
    context: vscode.ExtensionContext,
    authManager: AuthenticationManager,
  ) {
    if(!LiuRecorder._instance) {
      LiuRecorder._instance = new LiuRecorder(context, authManager)
    }
  }

  private async _init() {
    
    // 1. register `record` command
    const _this = this
    const extId = liuInfo.getExtId()
    const cmdId_1 = `${extId}.record`
    const disposable1 = vscode.commands.registerCommand(cmdId_1, async () => {
      _this._prepareToRecord()
    })
    this._context.subscriptions.push(disposable1)

    // 2. register `recordWithCode`
    const cmdId_2 = `${extId}.recordWithCode`
    const disposable2 = vscode.commands.registerCommand(cmdId_2, async () => {
      _this._recordWithCode()
    })
    this._context.subscriptions.push(disposable2)

    // 3. listen to login
    const authStatus = await this._authManager.getAuthStatus()
    if(authStatus) return
    const eventBus = SimpleEventBus.getInstance()
    const eventEmitter = eventBus.getEmitter()
    const subscription2 = eventEmitter.event((evt) => {
      if(evt !== "just-logged") return
      console.log("listen to login event in LiuRecorder!")
      const stamp = _this._waitingForLoginStamp
      const isWaiting = time.isWithinMillis(stamp, MIN_3)
      if(isWaiting) {
        _this._waitingForLoginStamp = 0
        _this._startRecording()
      }
      subscription2.dispose()
    })
  }

  private async _recordWithCode() {
    const editor = vscode.window.activeTextEditor
    if(!editor || editor.selection.isEmpty) {
      Logger.warn("no selection")
      return
    }

    const selectedText = editor.document.getText(editor.selection)
    const tmpText = selectedText.trim()
    if(!tmpText) return
    Logger.info("selectedText: ", selectedText)

  }

  private async _prepareToRecord() {
    const authManager = this._authManager
    const authStatus = await authManager.getAuthStatus()
    if(!authStatus) {
      this._waitingForLoginStamp = time.getTime()
      const res = await authManager.startToLogin()
      if(!res) return
    }
    
    this._startRecording()
  }

  private async _startRecording() {

    // 1. show input box
    const title = i18n.t("record.title")
		const placeholder = i18n.t("record.placeholder")
    const res1 = await vscode.window.showInputBox({
      title,
      placeHolder: placeholder,
    })
    if(!res1) return
    const text = res1.trim()
    if(!text) return

    // 2. package thread
    const atom = await this._packeageAtomForThread(text)
    if(!atom) {
      this._authManager.loginAgain()
      return
    }

    // 2.1 show loading
    const statusBar = LiuStatusBar.getInstance()
    statusBar.setLoading()

    // 3. fetch
    const url3 = APIs.SYNC_SET
    const body3 = {
      operateType: "single_sync",
      plz_enc_atoms: [atom],
    }
    const res3 = await liuReq.request<SyncSetAPI.Res_Client>(url3, body3)
    const { code, data } = res3
    console.log("see res3: ")
    console.log(code)
    console.log(data)
    Logger.info("see res3: ", code, data)

    // 3.2 reset status bar
    statusBar.reset()

    // 4.1 show error message
    if(code !== "0000" || !data) {
      showErrMsg("other", res3)
      return
    }

    // 4.2 get new_id
    const results = data.results
    const theRes = results?.[0]
    const new_id = theRes?.new_id
    if(!new_id) {
      Logger.warn("we cannot get new_id: ", data)
      return
    }

    // 5. get success message
    const customEnv = liuEnv.getEnv()
    const liuDomain = customEnv.liuDomain ?? ""
    const link5 = `${liuDomain}/${new_id}`
    const title5 = i18n.t("record.recorded")
    const confirmTxt5 = i18n.t("common.get_it")
    const cancelTxt5 = i18n.t("common.view")
    const w = vscode.window
    const res5 = await w.showInformationMessage(title5, confirmTxt5, cancelTxt5)

    // 6. open link if needed
    if(res5 !== cancelTxt5) return
    const uri6 = vscode.Uri.parse(link5)
    await vscode.env.openExternal(uri6)
  }


  private async _packeageAtomForThread(text: string) {

    // 1. get auth data for spaceId
    const authManager = this._authManager
    const authStatus = await authManager.getAuthStatus()
    if(!authStatus) return

    // 2. generate id / stamp
    const task_id = ider.createUploadTaskId()
    const first_id = ider.createThreadId()
    const now = time.getTime()

    // 3. package desc
    text = text.replace(/\n/g, " ")
    const liuDesc: LiuContent[] = [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          }
        ]
      }
    ]

    // 4. package thread
    const thread: SyncSetAPI.LiuUploadThread = {
      first_id,
      spaceId: authStatus.personal_space_id,
      liuDesc,
      editedStamp: now,
      oState: "OK",
      createdStamp: now,
      emojiData: {
        total: 0,
        system: [],
      },
      aiReadable: "Y",
    }

    // 5. package atom
    const atom: SyncSetAPI.Atom = {
      taskType: "thread-post",
      taskId: task_id,
      thread,
      operateStamp: now,
    }
    return atom
  }



}