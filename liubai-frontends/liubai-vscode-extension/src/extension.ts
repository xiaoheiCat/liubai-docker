// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AuthenticationManager } from './managers/AuthenticationManager';
import liuInfo from './utils/liu-info';
import { i18n } from './locales/i18n';
import liuUtil from './utils/liu-util';
import { Logger } from './utils/Logger';
import { LiuRecorder } from './managers/LiuRecorder';

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

function init(context: vscode.ExtensionContext) {
	Logger.init(context)
	liuInfo.init(context)
	i18n.init()
	const res1 = isSafeEnvironment()
	if(!res1) {
		vscode.window.showWarningMessage(i18n.t("common.env_unsupported"))
		return false
	}

	const mode = LIU_ENV.MODE
	console.log("current mode: ", mode)
	if(mode === "development") {
		Logger.show()
		Logger.info("we're in development mode, so show the output panel")
	}

	return true
}

export function activate(context: vscode.ExtensionContext) {

	// 1. initialize
	const res1 = init(context)
	if(!res1) return

	// 2. get custom info
	const info = liuInfo.getInfo()
	console.log("see custom info: ")
	console.log(info)

	// 3. init auth manager
	const authManager = AuthenticationManager.getInstance(context)

	// 4. init recorder
	LiuRecorder.initialize(context, authManager)

	const disposable1 = vscode.commands.registerCommand(`${info.extensionId}.helloWorld`, async () => {
		const title = i18n.t("login.h1")
		const confirmTxt = i18n.t("login.sign_in")
		const cancelTxt = i18n.t("common.cancel")
		const res = await vscode.window.showInformationMessage(title, confirmTxt, cancelTxt)
		console.log("result: ", res)
	})
	context.subscriptions.push(disposable1)
}

export function deactivate() {
	Logger.dispose()
}
