import { getWebPushSubscription } from "~/hooks/pwa/useWebPush";
import time from "../basic/time";
import localCache from "../system/local-cache";
import APIs from "~/requests/APIs";
import liuReq from "~/requests/liu-req";


export async function handleWebPushSubscription(
  checkFrequency = true,
) {

  // 1. 根据缓存判断是否需要存储 web push subscription
  if (checkFrequency) {
    const onceData = localCache.getOnceData()
    const lastSaveWebPushStamp = onceData.lastSaveWebPushStamp ?? 0
    const isWithin = time.isWithinMillis(lastSaveWebPushStamp, time.WEEK)
    if (isWithin) return true
  }

  // 2. 获取 web push subscription
  const sub = await getWebPushSubscription()
  if (!sub) return false

  // 3. 去存储到远端
  const res = await liuReq.request(APIs.WEB_PUSH_SUB, {
    operateType: "save_webpush_sub",
    subscription: sub.toJSON(),
    userAgent: navigator.userAgent,
  })

  // 如果存储失败了
  if (res.code !== "0000") {
    console.warn("save web push fail: ", res)
    return false
  }

  // 4. 保存成功后，设置 lastSaveWebPushStamp
  localCache.setOnceData("lastSaveWebPushStamp", time.getTime())

  return true

}