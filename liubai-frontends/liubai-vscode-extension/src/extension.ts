// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AuthenticationManager } from './managers/AuthenticationManager';
import liuInfo from './utils/liu-info';
import { i18n } from './locales/i18n';
import liuUtil from './utils/liu-util';
import APIs from './requests/APIs';
import liuReq from './requests/liu-req';
import { Res_HelloWorld } from './types/types-req';

function isSafeEnvironment() {
	const theCrypto = liuUtil.crypto.getCrypto()

	if(!theCrypto) {
		console.warn("the crypto object is undefined")
		return false
	}

	if(!theCrypto.subtle) {
		console.warn("the subtle object is undefined")
		return false
	}

	return true
}

async function testCrypto() {
	console.log("try to create key with AES")
	const key = await liuUtil.crypto.createKeyWithAES()
	console.log("key: ", key)
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	liuInfo.init(context)
	const info = liuInfo.getInfo()
	i18n.init()
	console.log("see custom info: ")
	console.log(info)

	if(!isSafeEnvironment()) {
		vscode.window.showWarningMessage(i18n.t("common.env_unsupported"))
		return
	}
	testCrypto()

	const authManager = AuthenticationManager.getInstance(context)

	const disposable1 = vscode.commands.registerCommand(`${info.extensionId}.helloWorld`, async () => {
		// const title = i18n.t("appPrefix") + i18n.t("login.h1")
		// const confirmTxt = i18n.t("login.sign_in")
		// const cancelTxt = i18n.t("common.cancel")
		// const res = await vscode.window.showInformationMessage(title, confirmTxt, cancelTxt)
		// console.log("result: ", res)

		console.log("start to request hello world")
		const url = APIs.TIME
		const res = await liuReq.request<Res_HelloWorld>(url)
		console.log(res)

	})

	context.subscriptions.push(disposable1);
}

// This method is called when your extension is deactivated
export function deactivate() {}
