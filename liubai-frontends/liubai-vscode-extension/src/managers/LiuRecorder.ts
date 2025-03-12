import * as vscode from 'vscode';
import { AuthenticationManager } from './AuthenticationManager';
import liuInfo from '~/utils/liu-info';
import time from '~/utils/basic/time';
import { i18n } from '~/locales/i18n';
import { SimpleEventBus } from '~/utils/event-bus/simple-event-bus';

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
    const commandId = `${extId}.record`
    const disposable1 = vscode.commands.registerCommand(commandId, async () => {
      _this._prepareToRecord()
    })
    this._context.subscriptions.push(disposable1)

    // 2. listen to login
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

    // 2. package data

  }






}