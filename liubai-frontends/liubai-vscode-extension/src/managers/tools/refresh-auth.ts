import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";
import type { LiuAuthStatus } from "~/types";
import { UserSettingsAPI } from "~/types/types-req";
import time from "~/utils/basic/time";
import { getMyDataFromSpaceMemberList } from "./common-tools";
import valTool from "~/utils/basic/val-tool";
import * as vscode from 'vscode';
import { SimpleEventBus } from "~/utils/event-bus/simple-event-bus";


export class RefreshAuth {

  private _context: vscode.ExtensionContext;
  private _loginDataKey: string

  constructor(context: vscode.ExtensionContext, loginDataKey: string) {
    this._context = context
    this._loginDataKey = loginDataKey
  }

  public async refreshToken(
    authStatus: LiuAuthStatus,
  ) {
    // 1. check out if it is within a week
    const stamp1 = authStatus.updated_stamp
    const isWithinWeek = time.isWithinMillis(stamp1, time.WEEK)
    if (isWithinWeek) return true

    // 2. fetch enter
    const url2 = APIs.USER_ENTER
    const param2 = { operateType: "enter" }
    const res2 = await liuReq.request<UserSettingsAPI.Res_Enter>(url2, param2)

    // 3. handle data
    const { data: data3, code: code3 } = res2

    // 4. success
    if (code3 === "0000" && data3) {
      this._toSaveNewAuthStatus(data3, authStatus)
    }

    // 5. fail, so log out
    if (code3 === "E4003") {
      return false
    }


    return true
  }

  private async _toSaveNewAuthStatus(
    newData: UserSettingsAPI.Res_Enter,
    oldAuthStatus: LiuAuthStatus,
  ) {
    const { 
      new_serial, 
      new_token, 
      spaceMemberList,
    } = newData
  
    let updated = false
    const newPartialStatus: Partial<LiuAuthStatus> = {}
  
    // 1. check out new serial and token
    if(new_serial && new_token) {
      updated = true
      newPartialStatus.serial = new_serial
      newPartialStatus.token = new_token
    }
  
    // 2. nickname
    const myData = getMyDataFromSpaceMemberList(spaceMemberList)
    if(myData.nickname && oldAuthStatus.nickname !== myData.nickname) {
      updated = true
      newPartialStatus.nickname = myData.nickname
    }
  
    // 3. to update
    const newAuthStatus: LiuAuthStatus = {
      ...oldAuthStatus,
      ...newPartialStatus,
      updated_stamp: time.getTime(),
    }
    const val3 = valTool.objToStr(newAuthStatus)
    await this._context.secrets.store(this._loginDataKey, val3)

    // 4. notify other components
    if(updated) {
      liuReq.setAuthStatus(newAuthStatus)
      const eventBus = SimpleEventBus.getInstance()
      eventBus.getEmitter().fire("just-refreshed")
    }

  }


}