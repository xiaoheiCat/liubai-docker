import liuUtil from "~/utils/liu-util";
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type { Fetch_UserLoginNormal } from "./requests"
import { useLoginStore } from "../login-page/tools/useLoginStore"
import { showEmojiTip, showErrMsg } from "./show-msg"
import loginer from "./loginer";
import { redirectToLoginPage } from "./common-tools"

/** 拿到 RSA Public Key 之后，去生成的 AES key，并对其加密 */
export async function createClientKey(
  pem_public_key: string
) {
  const aesKey = await liuUtil.crypto.createKeyWithAES()
  if(!aesKey) {
    console.warn("fail to create aes key")
    return {}
  }

  const client_key = `client_key_${aesKey}`
  const pk = await liuUtil.crypto.importRsaPublicKey(pem_public_key)
  if(!pk) {
    console.warn("导入 rsa 密钥失败")
    return {}
  }
  const cipher = await liuUtil.crypto.encryptWithRSA(pk, client_key)
  return { aesKey, cipher }
}

export async function encryptTextWithRSA(pem: string, text: string) {
  const pk = await liuUtil.crypto.importRsaPublicKey(pem)
  if(!pk) return
  const cipherStr = await liuUtil.crypto.encryptWithRSA(pk, text)
  return cipherStr 
}

// 调用登录函数之后的，统一处理函数
export async function afterFetchingLogin(
  rr: RouteAndLiuRouter,
  res: Fetch_UserLoginNormal,
) {
  console.log("afterFetching.........")
  console.log(res)
  console.log(" ")

  const { code, data } = res
  const loginStore = useLoginStore()

  // 1. 如果需要验证 email，路由切换到输入验证码的页面
  if(code === "U0001" && data?.email) {
    loginStore.goToCodeView(data.email)
    redirectToLoginPage(rr)
    return false
  }

  // 2. email 不存在，无法使用 OAuth2.0 进行登录
  if(code === "U0002") {
    await showEmojiTip("login.err_8", "🫠")
    redirectToLoginPage(rr)
    return false
  }

  // 3. E4003
  if(code === "E4003") {
    await showEmojiTip("login.err_6", "🙅")
    redirectToLoginPage(rr)
    return false
  }

  // 4. 其他异常，弹提示；提示完回到 login 页
  if(code !== "0000" || !data) {
    await showErrMsg("login", res)
    redirectToLoginPage(rr)
    return false
  }

  // 5. 去走登录流程
  const res2 = await loginer.toLogin(rr, data)
  return res2
}

