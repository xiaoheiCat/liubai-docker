import * as vscode from 'vscode';
import { AuthenticationManager } from './AuthenticationManager';
import liuInfo from '~/utils/liu-info';
import time from '~/utils/basic/time';

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

  private _init() {
    
    // 1. register `record` command
    const _this = this
    const extId = liuInfo.getExtId()
    const commandId = `${extId}.record`
    const disposable1 = vscode.commands.registerCommand(commandId, async () => {
      _this._prepareToRecord()
    })
    this._context.subscriptions.push(disposable1)
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

  }






}