// Function Name: happy-system

import cloud from "@lafjs/cloud"
import { getDocAddId, valTool, verifyToken } from "@/common-util"
import type { 
  HappySystemAPI,
  LiuRqReturn,
  Partial_Id,
  Table_AiRoom,
  Table_Credential,
  Table_Showcase,
  Table_User,
  VerifyTokenRes,
  VerifyTokenRes_B,
} from "@/common-types"
import { 
  getBasicStampWhileAdding, 
  getNowStamp, 
  isWithinMillis, 
  MINUTE, 
  SECOND,
} from "@/common-time"
import { createAdCredential } from "@/common-ids"
import { ai_cfg } from "@/common-config"
import { Img2Txt } from "@/ai-shared"

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {

  // 1. verify token
  const body = ctx.request?.body ?? {}
  const oT = body.operateType as HappySystemAPI.OperateType
  const isCoupon = oT.startsWith("coupon-")
  let vRes: VerifyTokenRes | undefined
  if(isCoupon) {
    vRes = await verifyToken(ctx, body)
    if(!vRes.pass) return vRes.rqReturn
  }

  // 2. decide which path to go
  let res: LiuRqReturn = { code: "E4000" }
  if(oT === "get-showcase") {
    res = await get_showcase(body)
  }
  else if(oT === "get-weixin-ad") {
    res = await get_weixin_ad(body)
  }
  else if(oT === "post-weixin-ad") {
    res = await post_weixin_ad(body)
  }
  else if(oT === "coupon-status" && vRes?.pass) {

  }
  else if(oT === "coupon-check") {

  }
  else if(oT === "coupon-post" && vRes?.pass) {
    coupon_post(body, vRes)
  }
  else if(oT === "coupon-get") {

  }
  else if(oT === "coupon-update") {

  }
  else if(oT === "coupon-delete") {

  }
  else if(oT === "coupon-search") {

  }
  
  return res
}

async function post_weixin_ad(
  body: Record<string, any>,
) {
  // 1. check out params
  const credential = body.credential
  if(!valTool.isStringWithVal(credential)) {
    return { code: "E4000", errMsg: "Invalid credential" }
  }

  // 2. get credential
  const cCol = db.collection("Credential")
  const w2: Partial<Table_Credential> = { credential }
  const res2 = await cCol.where(w2).getOne<Table_Credential>()
  const cred = res2.data
  if(!cred) {
    return { code: "E4004", errMsg: "no credential found" }
  }

  // 3. verify credential
  if(cred.infoType !== "weixin-ad") {
    return { code: "E4003", errMsg: "credential is not weixin-ad" }
  }
  const now3 = getNowStamp()
  if(now3 > cred.expireStamp) {
    return { code: "E4003", errMsg: "credential has expired" }
  }
  const oldVerifyNum = cred.verifyNum ?? 0
  if(oldVerifyNum >= 30) {
    return { code: "E4003", errMsg: "the credential has been used too many times" }
  }
  const updatedStamp = cred.updatedStamp
  const within15s = isWithinMillis(updatedStamp, SECOND * 15)
  if(within15s) {
    return { code: "E4003", errMsg: "too frequently" }
  }
  const userId = cred.userId
  if(!userId) {
    return { code: "E4004", errMsg: "no userId in credential" }
  }

  // 4. get user
  const uCol = db.collection("User")
  const res4 = await uCol.doc(userId).get<Table_User>()
  const user = res4.data
  if(!user) {
    return { code: "E4004", errMsg: "no user found" }
  }

  // 5. check out user
  const countFromAd = user.quota?.conversationCountFromAd ?? 0
  const videoWatchedTimes = user.quota?.videoWatchedTimes ?? 0
  if(countFromAd >= ai_cfg.max_conversation_count_from_ad) {
    return { code: "E4003", errMsg: "watches too many videos" }
  }

  // 6. update credential
  const u6: Partial<Table_Credential> = {
    verifyNum: oldVerifyNum + 1,
    updatedStamp: getNowStamp(),
  }
  const cred_id = cred._id
  const res6 = await cCol.doc(cred_id).update(u6)

  // 7. update user
  const newCountFromAd = countFromAd + ai_cfg.conversation_to_ad
  const newVideoWatchedTimes = videoWatchedTimes + 1
  const u7 = {
    "quota.conversationCountFromAd": newCountFromAd,
    "quota.videoWatchedTimes": newVideoWatchedTimes,
    updatedStamp: getNowStamp(),
  }
  const res7 = await uCol.doc(userId).update(u7)

  // 8. package result
  const res8: HappySystemAPI.Res_PostWeixinAd = {
    operateType: "post-weixin-ad",
    conversationCountFromAd: newCountFromAd,
  }

  return { code: "0000", data: res8 }
}

async function get_weixin_ad(
  body: Record<string, any>,
): Promise<LiuRqReturn<HappySystemAPI.Res_GetWeixinAd>> {
  // 1. check out params
  const roomId = body.room
  if(!valTool.isStringWithVal(roomId)) {
    return { code: "E4000", errMsg: "Invalid room" }
  }
  const _env = process.env
  const adUnitId = _env.LIU_WX_REWARDED_VIDEO_AD
  if(!adUnitId) {
    return { code: "E5001", errMsg: "adUnitId is not configured" }
  }

  // 2. get room
  const rCol = db.collection("AiRoom")
  const res2 = await rCol.doc(roomId).get<Table_AiRoom>()
  const room = res2.data
  if(!room) {
    return { code: "E4004", errMsg: "no ai room found" }
  }

  // 3. get user
  const userId = room.owner
  const uCol = db.collection("User")
  const res3 = await uCol.doc(userId).get<Table_User>()
  const user = res3.data
  if(!user) {
    return { code: "E4004", errMsg: "no user found" }
  }
  if(user.oState !== "NORMAL") {
    return { code: "E4003", errMsg: "user is not normal" }
  }
  const conversationCountFromAd = user.quota?.conversationCountFromAd ?? 0

  // 4. get credential
  const MIN_10_LATER = getNowStamp() + MINUTE * 10
  const w4 = {
    userId,
    infoType: "weixin-ad",
    expireStamp: _.gt(MIN_10_LATER),
  }
  const cCol = db.collection("Credential")
  const res4 = await cCol.where(w4).getOne<Table_Credential>()
  let cred = res4.data

  // 5. create credential
  if(!cred) {
    const MIN_25_LATER = getNowStamp() + MINUTE * 25
    const b5 = getBasicStampWhileAdding()
    const newCred: Partial_Id<Table_Credential> = {
      ...b5,
      userId,
      infoType: "weixin-ad",
      expireStamp: MIN_25_LATER,
      verifyNum: 0,
      credential: createAdCredential(),
    }
    const res5 = await cCol.add(newCred)
    const credId = getDocAddId(res5)
    if(!credId) {
      return { code: "E5001", errMsg: "fail to create credential" }
    }
    cred = {
      _id: credId,
      ...newCred,
    }
  }

  // 6. package result
  const res6: HappySystemAPI.Res_GetWeixinAd = {
    operateType: "get-weixin-ad",
    adUnitId,
    conversationCountFromAd,
    conversationToAd: ai_cfg.conversation_to_ad,
    credential: cred.credential,
  }
  return { code: "0000", data: res6 }
}


async function get_showcase(
  body: Record<string, any>,
): Promise<LiuRqReturn<HappySystemAPI.Res_GetShowcase>> {
  // 1. check out params
  const key = body.key
  if(!valTool.isStringWithVal(key)) {
    return { code: "E4000", errMsg: "Invalid key" }
  }

  // 2.1 get showcase
  const sCol = db.collection("Showcase")
  const w2: Partial<Table_Showcase> = {
    key,
  }
  const res2 = await sCol.where(w2).getOne<Table_Showcase>()
  const showcase = res2.data
  if(!showcase) {
    return { code: "E4004" }
  }

  // 2.2 check out isOn
  if(showcase.isOn !== "Y") {
    return { code: "E4014" }
  }

  // 3. package result
  const res3: HappySystemAPI.Res_GetShowcase = {
    operateType: "get-showcase",
    title: showcase.title,
    imageUrl: showcase.imageUrl,
    imageH2W: showcase.imageH2W,
    footer: showcase.footer,
  }
  return { code: "0000", data: res3 }
}


/***************************** Coupons *****************************/

async function coupon_post(
  body: Record<string, any>,
  vRes: VerifyTokenRes_B,
) {
  // 1.1 check out days
  const availableDays = body.availableDays ?? 7
  if(typeof availableDays !== "number") {
    return { code: "E4000", errMsg: "Invalid availableDays" }
  }
  // 1.2 copytext & image_url
  const copytext = body.copytext
  const image_url = body.image_url
  if(!copytext && !image_url) {
    return { code: "E4000", errMsg: "copytext or image_url is required" }
  }
  // 1.3 image_h2w
  const image_h2w = body.image_h2w
  if(image_h2w && !valTool.isStringAsNumber(image_h2w)) {
    return { code: "E4000", errMsg: "Invalid image_h2w" }
  }


  // 2. check out credential
  const credential = body.credential
  if(!valTool.isStringWithVal(credential)) {
    return { code: "E4000", errMsg: "Invalid credential" }
  }
  const cCol = db.collection("Credential")
  const res1 = await cCol.where({ credential }).getOne()
  const data1 = res1.data
  if(!data1 || data1.infoType !== "coupon-auth") {
    return { code: "E4003", errMsg: "no credential found" }
  }
  


  




}


export interface CouponAddManagerOpt {
  user: Table_User
  copytext?: string
  image_url?: string
  image_h2w?: string
  availableDays: number
}

class CouponAddManager {

  private _opt: CouponAddManagerOpt

  constructor(
    opt: CouponAddManagerOpt,
  ) {
    this._opt = opt
  }

  async run() {
    // 1. get required params
    const copytext = this._opt.copytext
    const image_url = this._opt.image_url

    // 2. try to add data into document db
    if(copytext) {

    }
    else if(image_url) {
      await this.addImageIntoDocDB()
    }
    
  }

  async addCopyTextIntoDocDB() {

  }

  async addImageIntoDocDB() {
    const image_url = this._opt.image_url as string
    const res1 = await CouponAddChecker.image(image_url)
    const img_to_txt = res1?.text?.trim?.()
    if(!img_to_txt || img_to_txt === "0") {
      console.warn("fail to parse image in CouponAddManager")
      console.log(img_to_txt)
      return
    }



  }


  addIntoVectorDB() {

  }


}


const coupon_add_checker_system1 = `
你是一个优惠券系统安全网关，严格判断用户消息的性质。

## 输出规则

请你按以下规则输出：

### <score>1</score> 
确认是正常营销信息（含优惠券/折扣/促销等商业推广）

### <score>0.5</score>
存在营销特征但信息模糊，或无法排除非营销可能性

### <score>0</score>
符合任一情况即触发：
- 非营销内容（日常对话/客服咨询等）
- 涉及黄赌毒、欺诈、非法内容
- 诱导用户点击高危链接或提交敏感信息

### 使用 <output> 标签包裹结果
务必记住：你的输出文字必须用 <output>......</output> 包裹，比如这样：

<output>
  <score>1</score>
</output>

否则会视为错误。

## 案例

<input>哈哈哈哈哈这什么鬼</input>
<output>
  <score>0</score>
</output>

<input>限时领50元外卖红包！戳链接：xxx.com</input>
<output>
  <score>1</score>
</output>

<input>帮我查快递订单</input>
<output>
  <score>0</score>
</output>

<input>【曼玲粥店全国品牌日】\nmp://mL40fkRVjs5iEqH</input>
<output>
  <score>1</score>
</output>

<input># https://www.wmslz.com/s/1i8QbRO78M7#💯付枝💯此消息，打开支付宝搜suǒ，体验霸王茶姬+小程序  T:/8 ZH7247 2024/02/20</input>
<output>
  <score>1</score>
</output>

<input>🌟MissWiss张柏芝同款女神防晒衣‼
💰74.18‼防晒衣
夏季防晒必备日常都要200➕
商品链接：#小程序://拼多多优惠商品推荐/QOyLq25ImNId3Vb</input>
<output>
  <score>1</score>
</output>

<input>煞笔、有内味了、辣鸡、undefined</input>
<output>
  <score>0</score>
</output>
`.trim()

const coupon_add_checker_user1 = `
## 当前环境

系统名称: 优惠券系统
当前日期: {current_date}
当前时间: {current_time}

## 用户输入

以下为当前用户的输入：

<input>{current_input}</input>

请你凭借上述描述的规则进行回复，再次提醒：你只能以 <output> 开始输出，以 </output> 结尾你的回复。
`.trim()

class CouponAddChecker {
  
  static async image(image_url: string) {
    const prompt1 = "请提取图中的优惠券、折扣、商品等信息。"
    const prompt2 = "若图片信息与营销或商品图无关，又或者涉及非法违规、欺诈、黄赌毒等内容，请直接回复 0，无需过多解释。"
    const prompt = `${prompt1}\n${prompt2}`
    const img2txt = new Img2Txt({ image_url, prompt })
    const res1 = await img2txt.run()
    return res1
  }

  static text(copytext: string) {



  }

}






