// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AuthenticationManager } from './managers/AuthenticationManager';
import liuInfo from './utils/liu-info';
import { i18n } from './locales/i18n';
import liuUtil from './utils/liu-util';
import { Logger } from './utils/Logger';
import { LiuRecorder } from './managers/LiuRecorder';
import { LiuStatusBar } from './managers/LiuStatusBar';
import liuEnv from './utils/liu-env';

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

	const customEnv = liuEnv.getEnv()
	const mode = customEnv.mode
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
	Logger.info("custom info: ", info)

	// 3. init auth manager
	const authManager = AuthenticationManager.getInstance(context)

	// 4. init recorder
	LiuRecorder.initialize(context, authManager)

	// 5. add Liubai in Status Bar
	LiuStatusBar.initialize()
}

export function deactivate() {
	Logger.dispose()
}
