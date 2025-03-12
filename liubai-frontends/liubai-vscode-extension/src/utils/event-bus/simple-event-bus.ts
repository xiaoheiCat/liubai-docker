

import * as vscode from 'vscode';

export type SimpleEventType = "just-logged" | "just-refreshed"

export class SimpleEventBus {

  private static _instance: SimpleEventBus;
  private _emitter: vscode.EventEmitter<SimpleEventType>;

  private constructor() {
    this._emitter = new vscode.EventEmitter<SimpleEventType>()
  }

  public static getInstance() {
    if(!SimpleEventBus._instance) {
      SimpleEventBus._instance = new SimpleEventBus()
    }
    return SimpleEventBus._instance
  }

  public getEmitter() {
    return this._emitter
  }
  
}