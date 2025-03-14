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
import { languageIdToSupported } from './tools/lowlight-related';

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
    // 0. check out logging data
    const authManager = this._authManager
    const authStatus = await authManager.getAuthStatus()
    if(!authStatus) {
      this._waitingForLoginStamp = 0
      await authManager.startToLogin()
      return
    }

    // 1. get editor
    const editor = vscode.window.activeTextEditor
    if(!editor || editor.selection.isEmpty) {
      Logger.warn("no selection")
      return
    }

    // 2. get selected text
    const selectedText = editor.document.getText(editor.selection)
    const tmpText = selectedText.trim()
    if(!tmpText) return

    // 3. get language
    const langId = editor.document.languageId
    Logger.info("langId: ", langId)
    const supportedLang = languageIdToSupported(langId)
    const codeBlock: LiuContent = {
      type: "codeBlock",
      content: [
        {
          type: "text",
          text: selectedText,
        }
      ]
    }
    if(supportedLang) {
      codeBlock.attrs = {
        language: supportedLang,
      }
    }

    this._startRecording(codeBlock)
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

  private async _startRecording(
    codeBlock?: LiuContent,
  ) {
    // 0. get some params
    const isCoding = Boolean(codeBlock)

    // 1.1 get title, placeholder, and prompt 
    let title = i18n.t("record.title")
		let placeholder = i18n.t("record.placeholder")
    let prompt: string | undefined
    if(isCoding) {
      title = i18n.t("record.title_2")
      placeholder = i18n.t("record.placeholder_2")
      prompt = i18n.t("record.save_code")
    }

    // 1.2 show input box
    const res1 = await vscode.window.showInputBox({
      title,
      placeHolder: placeholder,
      prompt,
    })
    if(typeof res1 !== "string") return
    const text = res1.trim()
    if(!isCoding && !text) return

    // 2. package thread
    const atom = await this._packeageAtomForThread(text, codeBlock)
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

    // 3.2 reset status bar
    statusBar.reset()

    // 4.1 show error message
    if(code !== "0000" || !data) {
      Logger.warn("fail to note: ", res3)
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


  private async _packeageAtomForThread(
    text: string,
    codeBlock?: LiuContent,
  ) {

    // 1. get auth data for spaceId
    const authManager = this._authManager
    const authStatus = await authManager.getAuthStatus()
    if(!authStatus) return

    // 2. generate id / stamp
    const task_id = ider.createUploadTaskId()
    const first_id = ider.createThreadId()
    const now = time.getTime()

    // 3.1 package codeBlock
    const liuDesc: LiuContent[] = []
    if(codeBlock) {
      liuDesc.push(codeBlock)
    }
 
    // 3.2 package desc
    text = text.replace(/\n/g, " ")
    if(text) {
      liuDesc.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text,
          }
        ]
      })
    }

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