// Function Name: ai-entrance

import { 
  type AiBot,
  type AiCharacter,
  type AiUsage,
  type AiEntry,
  type AiCommandByHuman,
  type OaiPrompt,
  type OaiTool,
  type OaiToolPrompt,
  type OaiToolCall,
  type OaiChoice,
  type OaiMessage,
  type OaiCreateParam,
  type OaiChatCompletion,
  type Partial_Id, 
  type Table_AiChat, 
  type Table_AiRoom, 
  type Table_User, 
  type Wx_Gzh_Send_Msg,
  type Wx_Gzh_Send_Msgmenu_Item,
  type Wx_Gzh_Send_Msgmenu,
  type Table_Order,
  type Table_Subscription,
  type AiFinishReason,
  type AiToolAddCalendarParam,
  type AiAbility,
  type T_I18N,
  type AiImageSizeType,
  type AiToolGetCardType,
  LiuAi,
  Sch_AiToolGetScheduleParam,
  Sch_AiToolGetCardsParam,
  type AiApiEndpoint,
  type AiToolGetScheduleHoursFromNow,
  type AiToolGetScheduleSpecificDate,
  type AiToolGetScheduleParam,
  type Table_Content,
  type SortWay,
  type Table_LogAi,
  type AiBotMetaData,
  Ns_Zhipu,
  Ns_SiliconFlow,
  Ns_Stepfun,
  type DsReasonerMessage,
} from "@/common-types"
import OpenAI from "openai"
import { 
  checkAndGetWxGzhAccessToken, 
  checkIfUserSubscribed, 
  getDocAddId,
  valTool,
  createAvailableOrderId,
  LiuDateUtil,
  getLiuDoman,
  MarkdownParser,
  AiToolUtil,
  liuReq,
  decryptEncData,
  getSummary,
} from "@/common-util"
import { WxGzhSender } from "@/service-send"
import { 
  getBasicStampWhileAdding, 
  getNowStamp, 
  HOUR, 
  isWithinMillis, 
  localizeStamp, 
  DAY,
  MINUTE,
  SECONED,
} from "@/common-time"
import { 
  aiBots, 
  aiI18nChannel, 
  aiI18nShared,
  aiTools,
} from "@/ai-prompt"
import cloud from "@lafjs/cloud"
import { useI18n, aiLang, getCurrentLocale } from "@/common-i18n"
import * as vbot from "valibot"
import { downloadFile, responseToFormData, WxGzhUploader } from "@/file-utils"
import { createRandom } from "@/common-ids"
import { addDays, set as date_fn_set } from "date-fns"
import axios from "axios"

const db = cloud.database()
const _ = db.command

/********************* constants ***********************/
const MAX_CHARACTERS = 3
const MIN_RESERVED_TOKENS = 1600
const TOKEN_NEED_COMPRESS = 6000
const MAX_WX_TOKEN = 360  // wx gzh will send 45002 error if we send too many words once
const MIN_REST_TOKEN = 100
const MAX_WORDS = 3000

// see https://platform.openai.com/docs/guides/reasoning#allocating-space-for-reasoning
const MIN_REASONING_TOKENS = 1024

const MAX_TIMES_FREE = 10
const MAX_TIMES_MEMBERSHIP = 200

const SEC_15 = SECONED * 15
const MIN_3 = MINUTE * 3
const HOUR_12 = HOUR * 12
const INDEX_TO_PRESERVE_IMAGES = 12     // the images which appears in the first INDEX_TO_PRESERVE_IMAGES will be preserved rather than compressed to text like [image]

// characters which take a rest will not be filled whle users launch a new chat
const charactersTakingARest: AiCharacter[] = [
  "ds-reasoner",
  "deepseek",
  "kimi",
]

/************************** types ************************/

interface AiCard {
  title: string
  summary: string
  contentId: string
  hasImage: boolean
  hasFile: boolean
  calendarStamp?: number
  createdStamp: number
}

interface AiDirectiveCheckRes {
  theCommand: AiCommandByHuman
  theBot?: AiBot
}

// pass it to aiController.run() and bot.run()
interface AiRunParam {
  entry: AiEntry
  room: Table_AiRoom
  chatId?: string
  chats: Table_AiChat[]
  isContinueCommand?: boolean
}

interface AiRunLog_A {
  toolName: "get_schedule"
  hoursFromNow?: AiToolGetScheduleHoursFromNow
  specificDate?: AiToolGetScheduleSpecificDate
}

interface AiRunLog_B {
  toolName: "get_cards"
  cardType: AiToolGetCardType
}

interface AiRunLog_C {
  toolName: "draw_picture"
  drawResult: LiuAi.PaletteResult
}

export type AiRunLog = (AiRunLog_A | AiRunLog_B | AiRunLog_C) & {
  character: AiCharacter
  textToUser: string
  logStamp: number
}

interface AiRunSuccess {
  character: AiCharacter
  replyStatus: "yes" | "has_new_msg"
  assistantChatId?: string
  chatCompletion?: OaiChatCompletion
  toolName?: string
  logs?: AiRunLog[]
}

type AiRunResults = Array<AiRunSuccess | undefined>

interface AiHelperAssistantMsgParam {
  roomId: string
  text?: string
  reasoning_content?: string
  model: string
  character: AiCharacter
  usage?: AiUsage
  requestId?: string
  baseUrl?: string
  funcName?: string
  funcJson?: Record<string, any>
  tool_calls?: OaiToolCall[]
  finish_reason?: AiFinishReason
  webSearchProvider?: LiuAi.SearchProvider
  webSearchData?: Record<string, any>
  drawPictureUrl?: string
  drawPictureModel?: string
  drawPictureData?: Record<string, any>
}

interface AiMenuItem {
  operation: AiCommandByHuman
  character?: AiCharacter
}

interface PreRunResult {
  prompts: OaiPrompt[]
  totalToken: number
  bot: AiBot
  chats: Table_AiChat[]
  tools?: OaiTool[]
}

interface PostRunParam {
  aiParam: AiRunParam
  chatParam: OaiCreateParam
  chatCompletion?: OaiChatCompletion
  bot: AiBot
}

interface TurnChatsIntoPromptOpt {
  abilities?: AiAbility[]
  metaData?: AiBotMetaData
  character?: AiCharacter
  isContinueCommand?: boolean
}

interface BaseLLMChatOpt {
  maxTryTimes?: number
  user?: Table_User
  timeoutSec?: number
}

interface ReplyToUserParam {
  chatCompletion: OaiChatCompletion
  entry: AiEntry
  bot: AiBot
  textToUser: string
  assistantChatId?: string
  showCoT: boolean
}


/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with ai-entrance")
  return true
}


export async function get_into_ai(
  entry: AiEntry,
) {
  // 0. pre check
  const res0 = preCheck()
  if(!res0) return

  // 1. check out text or image_url
  const { msg_type, image_url, text, audio_url } = entry
  if(msg_type === "text" && !text) return
  if(msg_type === "image" && !image_url) return
  if(msg_type === "voice" && !audio_url) return

  // 1.1 check out text
  if(msg_type === "text" && text) {
    const res1_1 = preCheckText(text, entry)
    if(!res1_1) return
  }

  // 2. check out directive
  const theDirective = AiDirective.check(entry)
  if(theDirective && theDirective.theCommand !== "continue") {
    return
  }

  // 3. check out quota
  const isQuotaEnough = await UserHelper.checkQuota(entry)
  if(!isQuotaEnough) return

  // 4. get my ai room
  const room = await AiHelper.getMyAiRoom(entry)
  if(!room) return
  const roomId = room._id

  // 4.1 check out if no assistants
  const res4_1 = await AiHelper.checkIfNobodyHere(entry, room)
  if(res4_1) return

  // 4.2 check out if it's "continue" command
  if(theDirective?.theCommand === "continue") {
    const controller4_2 = new ContinueController(
      entry, 
      room, 
      theDirective?.theBot?.character
    )
    controller4_2.run()
    return
  }

  // 4.3 transcibe voice msg
  if(msg_type === "voice" && !text) {
    const transcriber = new Transcriber(audio_url ?? "")
    const res4_3 = await transcriber.run()
    const text4_3 = res4_3?.text
    if(!text4_3) {
      console.warn("fail to transcribe voice msg, so return")
      return
    }
    entry.text = text4_3
    entry.audio_base64 = res4_3?.audioBase64
  }

  // 5. add the current message into db
  const chatId = await AiHelper.addUserMsg(entry, roomId)
  if(!chatId) return

  // 6. get latest chat records
  const res6 = await AiHelper.getLatestChat(roomId)

  // 7. run AI!
  const controller = new AiController()
  controller.run({ entry, room, chatId, chats: res6 })

}


function preCheck() {
  const _env = process.env
  const summaryBaseUrl = _env.LIU_SUMMARY_BASE_URL
  const summaryApiKey = _env.LIU_SUMMARY_API_KEY
  const summaryModel = _env.LIU_SUMMARY_MODEL
  if(!summaryBaseUrl || !summaryApiKey || !summaryModel) {
    console.warn("summary is not available")
    return false
  }

  const domain = _env.LIU_DOMAIN
  if(!domain) {
    console.warn("domain is not set")
    return false
  }

  return true
}

function preCheckText(text: string, entry: AiEntry) {
  if(text.length > MAX_WORDS) {
    const { t } = useI18n(aiLang, { user: entry.user })
    const msg = t("too_many_words")
    TellUser.text(entry, msg)
    return false
  }

  return true
}


function mapBots(
  c: AiCharacter,
  aiParam: AiRunParam,
  promises: Promise<AiRunSuccess | undefined>[],
) {

  const user = aiParam.entry.user

  if(c === "baixiaoying") {
    const botBaichuan = new BotBaichuan(user)
    const proBaichuan = botBaichuan.run(aiParam)
    promises.push(proBaichuan)
  }
  if(c === "deepseek") {
    const bot1 = new BotDeepSeek(user)
    const pro1 = bot1.run(aiParam)
    promises.push(pro1)
  }
  else if(c === "ds-reasoner") {
    const botDsR = new BotDsReasoner(user)
    const proDsR = botDsR.run(aiParam)
    promises.push(proDsR)
  }
  else if(c === "hailuo") {
    const botMinimax = new BotMiniMax(user)
    const proMinimax = botMinimax.run(aiParam)
    promises.push(proMinimax)
  }
  else if(c === "kimi") {
    const bot2 = new BotMoonshot(user)
    const pro2 = bot2.run(aiParam)
    promises.push(pro2)
  }
  else if(c === "wanzhi") {
    const bot3 = new BotYi(user)
    const pro3 = bot3.run(aiParam)
    promises.push(pro3)
  }
  else if(c === "yuewen") {
    const bot4 = new BotStepfun(user)
    const pro4 = bot4.run(aiParam)
    promises.push(pro4)
  }
  else if(c === "zhipu") {
    const bot5 = new BotZhipu(user)
    const pro5 = bot5.run(aiParam)
    promises.push(pro5)
  }
}


/** check out if it's a directive, like "召唤..." */
class AiDirective {

  private static _bots: AiBot[] = []

  static check(
    entry: AiEntry
  ): AiDirectiveCheckRes | undefined {
    this._bots = AiHelper.getAvailableBots()

    // 1. get text
    const text = entry.text
    if(!text) return

    // 2. is it a kick directive?
    const text2 = text.trim().replace("+", " ")
    const botKicked = this.isKickBot(text2)
    if(botKicked) {
      this.toKickBot(entry, botKicked)
      return { theCommand: "kick", theBot: botKicked }
    }

    // 3. is it an adding directive?
    const botAdded = this.isAddBot(text2)
    if(botAdded) {
      this.toAddBot(entry, botAdded)
      return { theCommand: "add", theBot: botAdded }
    }

    // 4. is it clear directive?
    const res4 = this.isClear(text2)
    if(res4) {
      this.toClear(entry)
      return { theCommand: "clear_history" }
    }

    // 5. is it continue directive?
    const res5 = this.isContinue(text2)
    if(res5) return res5

    // 6. is it viewing status directive?
    const res6 = this.isViewingStatus(text2)
    if(res6) {
      this.toViewStatus(entry)
      return { theCommand: "group_status" }
    }

  }

  private static _getCommandedBot(
    prefix: string[],
    text: string,
  ) {
    const prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const txt1 = text.substring(prefixMatched.length).trim()
    const txt2 = txt1.toLowerCase()
    const botMatched = this._bots.find(v => {
      const name = v.name.toLowerCase()
      const alias = v.alias.map(v => v.toLowerCase())
      if(name === txt2) return true
      if(alias.includes(txt2)) return true
      return false
    })

    return botMatched
  }

  private static _areTheyMatched(
    prefix: string[],
    text: string,
    fuzzy = false,
  ) {
    const str = text.toLowerCase()
    const list = prefix.map(v => v.toLowerCase())

    // 1. direct match
    const res1 = list.includes(str)
    if(res1) return true
    if(!fuzzy) return false

    // 2. fuzzy match
    let res2 = false
    list.forEach(v => {
      const res2_1 = str.startsWith(v)
      if(!res2_1) return
      const diff = Math.abs(v.length - str.length)
      if(diff > 2) return
      res2 = true
    })

    return res2
  }

  private static isContinue(text: string): AiDirectiveCheckRes | undefined {
    const prefix = ["继续", "繼續", "Continue"]
    const res1 = this._areTheyMatched(prefix, text)
    if(res1) return { theCommand: "continue" }
    const botMatched = this._getCommandedBot(prefix, text)
    if(botMatched) {
      return { theCommand: "continue", theBot: botMatched }
    }
  }

  private static async toViewStatus(entry: AiEntry) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return
    const user = entry.user
    const { t } = useI18n(aiLang, { user })
    let msg = t("status_1") + "\n"

    // 2. get assistants
    const { characters } = room
    if(characters.length < 1) {
      msg += (t("no_member") + "\n")
    }
    else {
      characters.forEach(v => {
        const name = AiHelper.getCharacterName(v)
        if(name) msg += (name + "\n")
      })
    }
    msg += "\n"

    // 3. get quota
    msg += (t("status_2") + "\n")
    const quota = user.quota
    const usedTimes = quota?.aiConversationCount ?? 0
    const isSubscribed = checkIfUserSubscribed(user)
    const maxTimes = isSubscribed ? MAX_TIMES_MEMBERSHIP : MAX_TIMES_FREE
    msg += (t("status_3", { usedTimes }) + "\n")
    if(isSubscribed) {
      msg += t("status_5", { maxTimes })
    }
    else {
      msg += t("status_4", { maxTimes })
    }

    // 4. text user
    TellUser.text(entry, msg)
  }

  private static isViewingStatus(text: string) {
    const prefix = [
      "群聊状态", "查看群聊状态", "群聊有谁", "群聊还有谁", "群里还有谁",
      "群聊狀態", "檢視群聊狀態", "群組裡有誰", "群組還有誰", "群組中還有誰",
      "Status", "Group Status",
    ]
    const res1 = this._areTheyMatched(prefix, text, true)
    return res1
  }

  private static async toKickBot(entry: AiEntry, bot: AiBot) {
    const user = entry.user
    const { t } = useI18n(aiLang, { user })

    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return
    const roomId = room._id

    // 2. find the bot in the room
    const characterKicked = bot.character
    const theBot = room.characters.find(v => v === characterKicked)
    if(!theBot) {
      const msg2 = t("already_left", { botName: bot.name })
      TellUser.text(entry, msg2)
      return
    }

    // 3. remove the bot from the room
    const oldCharacters = room.characters
    const newCharacters = oldCharacters.filter(v => v !== characterKicked)
    const u3: Partial<Table_AiRoom> = {
      characters: newCharacters,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res3 = await rCol.doc(roomId).update(u3)

    // 4. get non-used characters
    let addedList = await AiHelper.getNonUsedCharacters(roomId)
    addedList = addedList.filter(v => !Boolean(oldCharacters.includes(v)))
    addedList = addedList.filter(v => !Boolean(charactersTakingARest.includes(v)))
    const reservedNum = newCharacters.length < 1 ? 4 : 3
    if(addedList.length > reservedNum) {
      addedList.splice(reservedNum, addedList.length - reservedNum)
    }

    // 5. send a message to user
    const msg5 = t("bot_left", { botName: bot.name })
    const gzhType = AiHelper.getGzhType()
    if(gzhType === "service_account" && addedList.length > 0) {
      // 5.1 send menu
      const menuList: AiMenuItem[] = []
      const prefixMsg = msg5  + "\n\n" + t("operation_title")
      addedList.forEach(v => menuList.push({ operation: "add", character: v }))
      TellUser.menu(entry, prefixMsg, menuList, "")
    }
    else {
      // 5.2 send text
      TellUser.text(entry, msg5)
    }

    // 6. log
    LogHelper.kick([characterKicked], user)

    return res3
  }

  private static async _showThereAre3(
    entry: AiEntry,
    characters: AiCharacter[],
  ) {
    const { t } = useI18n(aiLang, { user: entry.user })
    let prefixMessage = t("there_are_3") + `\n\n` + t("operation_title")
    const menuList: AiMenuItem[] = []
    characters.forEach(v => menuList.push({ operation: "kick", character: v }))
    TellUser.menu(entry, prefixMessage, menuList, "")
  }

  private static async toAddBot(entry: AiEntry, bot: AiBot) {
    const user = entry.user

    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry, bot)
    if(!room) return
    const { characters } = room

    // 2. find the bot in the room
    const theBot = characters.find(v => v === bot.character)
    if(theBot) {
      const roomCreatedStamp = room.insertedStamp
      const diff2 = getNowStamp() - roomCreatedStamp
      if(diff2 < 2000) {
        // this room just added
        this._sayHello(entry, bot)
      }
      else {
        const { t } = useI18n(aiLang, { user })
        const msg2_2 = t("already_exist", { botName: bot.name })
        TellUser.text(entry, msg2_2)
      }
      return
    }

    // 3. check out if the room has reached the max bots
    if(characters.length >= MAX_CHARACTERS) {
      this._showThereAre3(entry, characters)
      return
    }

    // 4. add the bot to the room
    const newCharacters = [...characters, bot.character]
    const u4: Partial<Table_AiRoom> = {
      characters: newCharacters,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res4 = await rCol.doc(room._id).update(u4)

    // 5. send a message to user
    this._sayHello(entry, bot)
    LogHelper.add([bot.character], user)
    return true
  }

  private static _sayHello(
    entry: AiEntry,
    bot: AiBot,
  ) {
    const msgList = ["called_1", "called_2", "called_3", "called_4"]
    const r = Math.floor(Math.random() * msgList.length)
    const msgKey = msgList[r]

    const user = entry.user
    const { t } = useI18n(aiLang, { user })
    const msg = t(msgKey, { botName: bot.name })
    TellUser.text(entry, msg, bot)
  }

  private static isKickBot(text: string) {
    const prefix = ["踢掉", "踢掉", "Kick", "Remove"]
    const botMatched = this._getCommandedBot(prefix, text)
    return botMatched 
  }

  private static isAddBot(text: string) {
    // 1. use prefix
    const prefix = [
      "召唤", "召喚", "Summon", "summon",
      "我要", "我要", "I want", "i want",
      "添加", "新增", "Add", "add",
      "呼叫", "Call", "call",
      "@",
    ]
    const botMatched = this._getCommandedBot(prefix, text)
    if(botMatched) return botMatched
    
    // 2. text match completed
    const lowerText = text.toLowerCase()
    const botMatched2 = this._bots.find(v => {
      const name = v.name.toLowerCase()
      if(name === lowerText) return true
      const alias = v.alias.map(v => v.toLowerCase())
      if(alias.includes(lowerText)) return true
      return false
    })

    return botMatched2
  }

  private static isClear(text: string) {
    const strs = [
      // 清空
      "清空",
      "清空上文", 
      "清空上下文",
      "清空历史", 
      "清空歷史",
      "清空历史纪录",
      "清空歷史紀錄",

      // 清除
      "清除上文", 
      "清除上下文",
      "清除历史", 
      "清除歷史",
      "清除历史纪录",
      "清除歷史紀錄",

      // 消除
      "消除上文", 
      "消除上下文",
      "消除历史", 
      "消除歷史",
      "消除历史纪录",
      "消除歷史紀錄",

      // Eng
      "Clear chat",
      "Clear history",
      "Clear context",
    ]
    const res = this._areTheyMatched(strs, text)
    return res
  }

  private static async toClear(entry: AiEntry) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return false

    // 2. add a clear record into db
    const b2 = getBasicStampWhileAdding()
    const data2: Partial_Id<Table_AiChat> = {
      ...b2,
      sortStamp: b2.insertedStamp,
      infoType: "clear",
      roomId: room._id,
    }
    const col = db.collection("AiChat")
    const res2 = await col.add(data2)

    // 3. send a cleared message to user
    const { t } = useI18n(aiLang, { user: entry.user })
    TellUser.text(entry, t("history_cleared"))

    return true
  }

}



/**************************** Bots ***************************/

type BaseChatResolver = (res: OaiChatCompletion | undefined) => void

class BaseLLM {
  protected _client: OpenAI | undefined
  protected _baseUrl: string | undefined
  constructor(
    apiKey?: string, 
    baseURL?: string,
    defaultHeaders?: Record<string, string>,
  ) {
    this._baseUrl = baseURL
    try {
      this._client = new OpenAI({ apiKey, baseURL, defaultHeaders })
    }
    catch(err) {
      console.warn("BaseLLM constructor gets client error: ")
      console.log(err)
    }
  }

  private _tryTimes = 0

  public chat(
    params: OaiCreateParam,
    opt?: BaseLLMChatOpt,
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const timeoutSec = opt?.timeoutSec ?? 59
    let hasReturn = false

    const _wait = async (a: BaseChatResolver) => {
      // 1. set timeout
      let timeout = setTimeout(() => {
        if(hasReturn) return
        console.log("custom timeout occurs!")
        hasReturn = true
        a(undefined)
      }, timeoutSec * 1000)

      // 2. to chat
      const res = await _this._chat(params, opt)

      // 3. decide to continue
      if(hasReturn) return
      hasReturn = true
      clearTimeout(timeout)

      a(res)
    }

    return new Promise(_wait)
  }

  private async _chat(
    params: OaiCreateParam,
    opt?: BaseLLMChatOpt,
  ): Promise<OaiChatCompletion | undefined> {
    const _this = this
    const client = _this._client
    if(!client) return

    _this._tryTimes++
    const copiedParams = valTool.copyObject(params)

    try {
      const chatCompletion = await client.chat.completions.create(copiedParams)
      _this._tryTimes = 0
      _this._log(chatCompletion as any, opt)
      return chatCompletion as OaiChatCompletion
    }
    catch(err) {
      console.warn("BaseLLM chat error: ")
      console.log(err)

      let isRateLimit = false
      const errType = typeof err
      const errMsg = errType === "string" ? err : err?.toString?.()

      if(typeof errMsg === "string") {
        // for baichuan
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("Rate limit reached for requests")
        }

        // for zhipu
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("当前API请求过多，请稍后重试")
        }
        
        // for moonshot
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("please try again after 1 seconds")
        }

        // fallback
        if(!isRateLimit) {
          isRateLimit = errMsg.includes("RateLimitError: 429")
        }

        if(errMsg.includes("undefined message role")) {
          LogHelper.printLastItems(params.messages)
        }
        
      }

      const maxTryTimes = opt?.maxTryTimes ?? 2
      if(_this._tryTimes < maxTryTimes && isRateLimit) {
        console.log("getting to try again!")
        await valTool.waitMilli(1000)
        const triedRes = await _this.chat(copiedParams, opt)
        return triedRes
      }
    }
  }

  private _log(
    chatCompletion: Partial<OaiChatCompletion>,
    opt?: BaseLLMChatOpt,
  ) {
    const usage = chatCompletion?.usage
    if(!usage) return

    const logCol = db.collection("LogAi")
    const b1 = getBasicStampWhileAdding()
    const aLog: Partial_Id<Table_LogAi> = {
      ...b1,
      infoType: "cost",
      costUsage: usage,
      costBaseUrl: this._baseUrl,
      userId: opt?.user?._id,
      choices: chatCompletion.choices,
      model: chatCompletion.model,
    }
    logCol.add(aLog)
  }


}

class BaseBot {
  protected _character: AiCharacter
  protected _bots: AiBot[]
  private _fromUser: Table_User | undefined

  constructor(
    c: AiCharacter, 
    user?: Table_User,
  ) {
    this._character = c
    const bots = aiBots.filter(v => v.character === c)
    this._bots = bots.sort((a, b) => b.priority - a.priority)
    this._fromUser = user
  }

  protected async chat(
    params: OaiCreateParam,
    bot: AiBot,
    opt?: BaseLLMChatOpt,
  ) {
    const character = this._character
    const apiData = AiHelper.getApiEndpointFromBot(bot)
    if(!apiData) {
      console.warn(`no api data for ${character}`)
      console.log(bot)
      return
    }
    PromptsChecker.run(params.messages, bot)
    const theService = `${params.model} on ${apiData.baseURL}`

    // print last 5 prompts
    // LogHelper.printLastItems(params.messages)
    // console.log(`Let's ask ${theService}`)

    const llm = new BaseLLM(
      apiData.apiKey, 
      apiData.baseURL,
      apiData.defaultHeaders,
    )
    const t1 = getNowStamp()
    const res = await llm.chat(params, { user: this._fromUser, ...opt })
    const t2 = getNowStamp()
    const cost = t2 - t1
    
    console.log(`${theService} cost: ${cost}ms`)
    if(!res) {
      console.warn(`${theService} got an error`)
    }

    const firstChoice = res?.choices?.[0]
    if(!firstChoice) {
      console.warn(`${theService} no choice! see chatCompletion: `)
      console.log(res)
      return
    }

    return res
  }

  private _getBotAndChats(param: AiRunParam) {
    // 1. get params
    let { chats } = param
    const _this = this
    let bots = [..._this._bots]

    // 2. filter bots for image_to_text
    const needImageToText = AiHelper.needImageToTextAbility(chats)
    if(needImageToText) {
      bots = bots.filter(v => v.abilities.includes("image_to_text"))
      if(bots.length < 1) {

        // 3. try to compress chats for images
        const newChats = AiHelper.compressChatsForImages(chats)
        if(!newChats) {
          const { t } = useI18n(aiLang, { user: param.entry.user })
          const msg3 = t("cannot_read_images")
          TellUser.text(param.entry, msg3, undefined, _this._character)
          return
        }

        bots = [..._this._bots]
        chats = newChats
      }
    }
    
    return { bot: bots[0], chats }
  }

  private _clipChats(
    bot: AiBot,
    chats: Table_AiChat[],
    user: Table_User,
  ) {
    const cLength = chats.length
    if(cLength < 2) return chats

    // 1. get windowTokens
    const isSubscribed = checkIfUserSubscribed(user)
    const _MAX_TOKEN = isSubscribed ? 32000 : 16000
    const { maxWindowTokenK } = bot
    let windowTokens = 1000 * maxWindowTokenK
    if(windowTokens > _MAX_TOKEN) {
      windowTokens = _MAX_TOKEN
    }

    // 2. calculate reachedTokens
    let reservedToken = Math.floor(windowTokens * 0.1)
    if(reservedToken < MIN_RESERVED_TOKENS) {
      reservedToken = MIN_RESERVED_TOKENS
    }
    const reachedTokens = windowTokens - reservedToken

    // 3. to clip
    let token = 0
    for(let i=0; i<cLength; i++) {
      const v = chats[i]
      token += AiHelper.calculateChatToken(v)
      if(token > reachedTokens) {
        chats = chats.slice(0, i)
        break
      }
    }

    return chats
  }

  protected preRun(param: AiRunParam): PreRunResult | undefined {
    // 1. get bot
    const botAndChats = this._getBotAndChats(param)
    if(!botAndChats) return
    let { bot, chats } = botAndChats

    // 2. clip chats
    const { entry } = param
    const { user } = entry
    chats = this._clipChats(bot, chats, user)

    // 3. get prompts and add system prompt
    const chatIntoPrompter = new ChatIntoPrompter(user, { 
      abilities: bot.abilities, 
      metaData: bot.metaData,
      character: bot.character,
      isContinueCommand: param.isContinueCommand,
    })
    const prompts = chatIntoPrompter.run(chats)

    // 4. get system prompt
    const system_1 = this.getFirstSystemPrompt(entry, bot)

    // console.warn("see system_1: ")
    // console.log(system_1)

    const system_1_token = AiHelper.calculateTextToken(system_1)
    if(system_1) {
      prompts.push({ role: "system", content: system_1 })
    }

    // 5. reverse prompts
    prompts.reverse()

    // 6. calculate total token
    let totalToken = 0
    chats.forEach(v => {
      totalToken += AiHelper.calculateChatToken(v)
    })
    totalToken += system_1_token

    // 7. construct result of preRun
    const res7: PreRunResult = { prompts, totalToken, bot, chats }

    // 8. tools
    if(bot.abilities.includes("tool_use")) {
      const tools = valTool.copyObject(aiTools)
      res7.tools = tools
    }


    // console.warn(`see ${bot.character} prompts: `)
    // console.log(prompts)

    return res7
  }

  private async _handleToolUse(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
  ) {
    // 1. check out params
    const { aiParam, bot, chatCompletion } = postParam

    // 2. define some constants
    const character = this._character
    const botName = AiHelper.getCharacterName(character)
    const { t } = useI18n(aiLang, { user: aiParam.entry.user })
    const aiLogs: AiRunLog[] = []
    const toolHandler = new ToolHandler(
      aiParam, 
      bot,
      tool_calls,
      chatCompletion,
    )

    for(let i=0; i<tool_calls.length; i++) {
      const v = tool_calls[i]
      const funcData = v["function"]

      if(v.type !== "function" || !funcData) continue
      const tool_call_id = v.id

      const funcName = funcData.name
      const funcArgs = funcData.arguments
      const funcJson = valTool.strToObj(funcArgs)
      console.log("funcName: ", funcName)
      console.log(funcJson)

      if(funcName === "add_note") {
        await toolHandler.add_note(funcJson)
      }
      else if(funcName === "add_todo") {
        await toolHandler.add_todo(funcJson)
      }
      else if(funcName === "add_calendar") {
        await toolHandler.add_calendar(funcJson)
      }
      else if(funcName === "web_search") {
        const searchRes = await toolHandler.web_search(funcJson)
        if(searchRes) {
          await this._continueAfterWebSearch(
            postParam, 
            tool_calls, 
            searchRes, 
            tool_call_id,
          )
          break
        }
      }
      else if(funcName === "draw_picture") {
        const drawRes = await toolHandler.draw_picture(funcJson)
        if(!drawRes) continue
        const drawTextToUser = t("bot_draw", { 
          botName: botName ?? "", 
          model: drawRes.model,
        })
        const drawLog: AiRunLog = {
          toolName: "draw_picture",
          drawResult: drawRes,
          character,
          textToUser: drawTextToUser,
          logStamp: getNowStamp(),
        }
        aiLogs.push(drawLog)
      }
      else if(funcName === "get_schedule") {
        const scheduleRes = await toolHandler.get_schedule(funcJson)
        if(!scheduleRes) continue

        await this._continueAfterReadingCards(
          postParam,
          tool_calls,
          scheduleRes,
          tool_call_id,
        )

        if(scheduleRes.textToUser) {
          const scheduleLog: AiRunLog = {
            toolName: "get_schedule",
            hoursFromNow: funcJson.hoursFromNow,
            specificDate: funcJson.specificDate,
            character,
            textToUser: scheduleRes.textToUser,
            logStamp: getNowStamp(),
          }
          aiLogs.push(scheduleLog)
        }
        
      }
      else if(funcName === "get_cards") {
        const cardsRes = await toolHandler.get_cards(funcJson)
        if(!cardsRes) continue

        await this._continueAfterReadingCards(
          postParam,
          tool_calls,
          cardsRes,
          tool_call_id,
        )

        if(cardsRes.textToUser) {
          const cardLog: AiRunLog = {
            toolName: "get_cards",
            cardType: funcJson.cardType,
            character: this._character,
            textToUser: cardsRes.textToUser,
            logStamp: getNowStamp(),
          }
          aiLogs.push(cardLog)
        }
      }
    }

    return aiLogs
  }

  private _getRestTokensAndPrompts(
    postParam: PostRunParam,
  ) {
    // 1. pre handle prompt and restTokens
    const { chatParam, chatCompletion } = postParam
    const usage = chatCompletion?.usage
    if(!usage) return
    const usedTokens = usage.total_tokens
    const { messages } = chatParam
    let prompts = [...messages]
    const maxWindowTokens = postParam.bot.maxWindowTokenK * 1000
    let restTokens = maxWindowTokens - usedTokens
    if(restTokens < 1) return
    const mLength = messages.length
    if(mLength < 2) return
    if(mLength > 5) {
      const systemPrompt = messages[0]
      const tempPrompts = messages.slice(mLength - 3)
      prompts = [systemPrompt, ...tempPrompts]
    }
    return { restTokens, prompts }
  }

  private async _continueAfterReadingCards(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
    readRes: LiuAi.ReadCardsResult,
    tool_call_id: string,
  ) {
    // 1. handle max tokens
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    let textToBot = readRes.textToBot
    const token1 = AiHelper.calculateTextToken(textToBot)
    restTokens -= token1
    if(restTokens > MAX_WX_TOKEN) {
      restTokens = MAX_WX_TOKEN
    }
    if(restTokens < MIN_REST_TOKEN) {
      if(prompts.length > 3) {
        restTokens = MAX_WX_TOKEN
        prompts.splice(0, prompts.length - 3)
      }
      else {
        console.warn("not enough rest tokens!")
        return
      }
    }

    // 2. get some params
    const c = this._character
    const assistantName = AiHelper.getCharacterName(c)
    const { chatParam, bot, aiParam } = postParam
    const user = aiParam.entry.user
    const canUseTool = bot.abilities.includes("tool_use")
    const { t } = useI18n(aiLang, { user })

    // 3. add new prompts with tool_calls and its result
    if(canUseTool) {
      prompts.push({ role: "assistant", tool_calls, name: assistantName })
      textToBot += (`\n\n` + t("do_not_use_tool_2"))
      prompts.push({
        role: "tool",
        content: textToBot,
        tool_call_id,
      })
    }
    else {
      const newPrompts = AiHelper.turnToolCallsIntoNormalPrompts(
        tool_calls,
        tool_call_id,
        textToBot,
        t,
        assistantName,
      )
      console.warn("see newPrompts in _continueAfterReadingCards: ")
      console.log(newPrompts)
      if(newPrompts.length < 1) return
      prompts.push(...newPrompts)
    }


    // 4. new chat create param
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res4 = await this.chat(newChatParam, bot)
    if(!res4) return

    console.warn(`${c}'s chat _continueAfterReadingCards: `)
    console.log(res4.choices?.[0]?.message)
    console.log(res4.choices?.[0].finish_reason)

    // 5. handle text from response
    const assistantChatId = await this._handleAssistantText(res4, aiParam, bot)
    if(!assistantChatId) {
      console.warn("no assistantChatId in _continueAfterReadingCards")
      console.log(res4)
      return
    }
  }

  private async _continueAfterWebSearch(
    postParam: PostRunParam,
    tool_calls: OaiToolCall[],
    searchRes: LiuAi.SearchResult,
    tool_call_id: string,
  ) {
    // 1. handle max tokens
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    let searchMarkdown = searchRes.markdown
    const token1 = AiHelper.calculateTextToken(searchMarkdown)
    restTokens -= token1
    if(restTokens > MAX_WX_TOKEN) {
      restTokens = MAX_WX_TOKEN
    }
    if(restTokens < MIN_REST_TOKEN) {
      if(prompts.length > 3) {
        restTokens = MAX_WX_TOKEN
        prompts.splice(0, prompts.length - 3)
      }
      else {
        console.warn("not enough rest tokens!")
        return
      }
    }

    // 2. get some params
    const c = this._character
    const assistantName = AiHelper.getCharacterName(c)
    const { chatParam, aiParam, bot } = postParam
    const user = aiParam.entry.user
    const canUseTool = bot.abilities.includes("tool_use")
    const { t } = useI18n(aiLang, { user })

    // 3. add prompts with tool_calls and its result
    if(canUseTool) {
      prompts.push({ role: "assistant", tool_calls, name: assistantName })
      searchMarkdown += (`\n\n` + t("do_not_use_tool"))
      prompts.push({
        role: "tool",
        content: searchMarkdown,
        tool_call_id,
      })
    }
    else {
      const newPrompts = AiHelper.turnToolCallsIntoNormalPrompts(
        tool_calls,
        tool_call_id,
        searchMarkdown,
        t,
        assistantName,
      )
      if(newPrompts.length < 1) return
      prompts.push(...newPrompts)
    }

    // print last 3 prompts
    // const msgLength = prompts.length
    // console.log(`last 3 prompts in _continueAfterWebSearch: `)
    // if(msgLength > 3) {
    //   const messages2 = prompts.slice(msgLength - 3)
    //   const printMsg = valTool.objToStr({ messages: messages2 })
    //   console.log(printMsg)
    // }
    // else {
    //   const printMsg = valTool.objToStr({ messages: prompts })
    //   console.log(printMsg)
    // }

    // 4. new chat create param
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res4 = await this.chat(newChatParam, bot)
    if(!res4) {
      console.warn("no result of chat in _continueAfterWebSearch......")
      return
    }

    // 5. see result
    console.warn(`${c}'s chat continues after web search: `)
    console.log(res4.usage)
    const choice5 = res4.choices?.[0]
    const msg5 = choice5?.message
    console.log(msg5)
    if(msg5?.tool_calls) {
      console.log(msg5.tool_calls[0])
    }

    // 6. can i reply
    const res6 = await AiHelper.canReply(aiParam, bot)
    if(!res6) return

    // 7. handle text from response
    const assistantChatId = await this._handleAssistantText(res4, aiParam, bot)
    if(!assistantChatId) return
  }

  private async _autoContinue(
    postParam: PostRunParam,
    msgFromAssistant: OaiMessage,
  ) {
    // 1. handle max tokens
    const data1 = this._getRestTokensAndPrompts(postParam)
    if(!data1) return
    let { restTokens, prompts } = data1
    const { chatParam, chatCompletion, bot, aiParam } = postParam
    if(restTokens > MAX_WX_TOKEN) {
      restTokens = MAX_WX_TOKEN
    }

    // 2. add "latest message from assistant"
    // and "Continue" if needed
    const c = bot.character
    prompts.push(msgFromAssistant)
    if(c === "wanzhi") {
      prompts.push({ role: "user", content: "继续 / Continue" })
    }
    console.log("restTokens in continue: ", restTokens)

    // 3. new chat create param
    const newChatParam: OaiCreateParam = { 
      ...chatParam,
      messages: prompts,
      max_tokens: restTokens,
    }
    const res3 = await this.chat(newChatParam, bot)
    if(!res3) return

    console.log("see usage in continue......")
    console.log(res3.usage)

    // 4. can i reply
    const res4 = await AiHelper.canReply(aiParam)
    if(!res4) return
    
    // 5. handle text from response
    const assistantChatId = await this._handleAssistantText(res3, aiParam, bot)
    if(!assistantChatId) return

    return { 
      character: c,
      replyStatus: "yes",
      chatCompletion, 
      assistantChatId,
    }
  }

  private async _handleAssistantText(
    chatCompletion: OaiChatCompletion,
    aiParam: AiRunParam,
    bot: AiBot,
  ) {
    const roomId = aiParam.room._id
    const c = bot.character
    const entry = aiParam.entry
    const user = entry.user

    // 1. get content & reasoning_content
    let {
      content: txt_a,
      reasoning_content: txt_b,
    } = AiHelper.getContentFromLLM(chatCompletion, bot)

    if(!txt_a && !txt_b) return
    let textToUser = txt_a
    let showCoT = Boolean(txt_a && txt_b)
    if(!textToUser) {
      const { t } = useI18n(aiLang, { user })
      textToUser = t("thinking", { text: txt_b ?? "" })
    }
    textToUser = this._clipContent(textToUser, chatCompletion)

    // 2. reply to user without CoT
    if(!showCoT) {
      this._replyToUser({
        chatCompletion,
        entry,
        bot,
        textToUser,
        showCoT,
      })
    }
    
    // 3. add assistant chat
    const apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
    const param3: AiHelperAssistantMsgParam = {
      roomId,
      text: txt_a,
      reasoning_content: txt_b,
      model: bot.model,
      character: c,
      usage: chatCompletion.usage,
      requestId: chatCompletion.id,
      baseUrl: apiEndpoint?.baseURL,
      finish_reason: AiHelper.getFinishReason(chatCompletion),
    }
    const assistantChatId = await AiHelper.addAssistantMsg(param3)

    // 4. reply to user with CoT
    if(showCoT) {
      this._replyToUser({
        chatCompletion,
        entry,
        bot,
        textToUser,
        assistantChatId,
        showCoT,
      })
    }

    return assistantChatId
  }

  private _clipContent(
    text: string,
    chatCompletion: OaiChatCompletion,
  ) {
    const MAX_REPLIED_WORDS = 600
    const MAX_CHARS = MAX_REPLIED_WORDS * 2
    if(text.length < MAX_REPLIED_WORDS) return text
    const list = text.split("\n")
    let newText = ""
    let charNum = 0

    for(let i=0; i<list.length; i++) {
      const row = list[i]
      newText += `${row}\n`
      const theNum = valTool.getTextCharNum(row)
      charNum += theNum
      if(charNum > MAX_CHARS) {
        console.warn("clip the content because it exceeds the limit")
        console.log(list[i + 1])
        AiHelper.setFinishReasonToLength(chatCompletion)
        break
      }
    }

    newText = newText.trim()
    return newText
  }

  private _replyToUser(param: ReplyToUserParam) {
    const {
      chatCompletion,
      entry,
      bot,
      textToUser,
      assistantChatId,
      showCoT,
    } = param

    const character = bot.character
    const finishReason = AiHelper.getFinishReason(chatCompletion)
    const gzhType = AiHelper.getGzhType()

    let text = textToUser
    if(assistantChatId && showCoT) {
      const user = entry.user
      const { t } = useI18n(aiLang, { user })
      const domain = getLiuDoman()
      const link = `${domain}/CoT?chatId=${assistantChatId}`
      const view_thinking = `<a href='${link}'>${t("view_thinking")}</a>`
      text += `\n\n` + view_thinking
    }

    if(finishReason === "length" && gzhType === "service_account") {
      TellUser.menu(
        entry, 
        text, 
        [{ operation: "continue", character }],
        "",
        character,
      )
    }
    else {
      TellUser.text(entry, text, bot)
    }
  }

  /** remove the last line if we receive `finish_reason` with value `length` */
  private _handleLength(message: OaiMessage) {
    let content = message.content
    if(!content) return
    content = content.trimEnd()
    const tmpList = content.split("\n")
    if(tmpList.length < 5) return
    tmpList.pop()
    message.content = tmpList.join("\n")
  }

  protected async postRun(postParam: PostRunParam): Promise<AiRunSuccess | undefined> {
    // 1. get params
    const { bot, chatCompletion, aiParam } = postParam
    if(!chatCompletion) return
    const c = bot.character

    let firstChoice = chatCompletion?.choices?.[0]
    if(!firstChoice) {
      return
    }
    let { finish_reason, message } = firstChoice
    if(!message) {
      console.warn(`${c} no message! see firstChoice: `)
      console.log(firstChoice)
    }
    let { tool_calls } = message

    // 1.1 try to transform text into tool
    //   and remove <assistant></assistant> tag
    const res1 = TransformText.handleFromAssistantChoice(firstChoice)
    if(res1) {
      finish_reason = firstChoice.finish_reason
      message = firstChoice.message
      tool_calls = message.tool_calls
    }

    // console.log(`${c} finish reason: ${finish_reason}`)
    // console.log(`usage: `)
    // console.log(chatCompletion.usage)
    
    // 2. can i reply
    const res2 = await AiHelper.canReply(aiParam, bot)
    if(!res2) {
      return {
        character: c,
        replyStatus: "has_new_msg",
        chatCompletion,
      }
    }

    // console.log(`${c} can reply! see message: `)
    // console.log(chatCompletion.choices[0].message)

    // 3. tool calls
    let aiLogs: AiRunLog[] | undefined
    if(finish_reason === "tool_calls" && tool_calls) {
      aiLogs = await this._handleToolUse(postParam, tool_calls)
    }
    
    // 4. finish reason is "length"
    if(finish_reason === "length") {
      this._handleLength(message)
    }

    // 5. finish reason is "content_filter"
    if(finish_reason === "content_filter") {
      console.warn(`${c} content filter!`)
    }

    // 6. otherwise, handle text
    let assistantChatId: string | undefined
    if(finish_reason !== "tool_calls") {
      assistantChatId = await this._handleAssistantText(chatCompletion, aiParam, bot)
    }
    
    return { 
      character: c,
      replyStatus: "yes",
      chatCompletion, 
      assistantChatId,
      logs: aiLogs,
    }
  }

  protected getFirstSystemPrompt(
    entry: AiEntry,
    bot: AiBot,
  ) {
    const user = entry.user
    const { 
      date: current_date, 
      time: current_time,
    } = LiuDateUtil.getDateAndTime(getNowStamp(), user.timezone)
    const current_provider = AiHelper.getProviderName(bot) ?? "Unknown"
    const { p } = aiI18nChannel({ entry, bot })
    const system_1 = p("system_1", { 
      current_date, 
      current_time, 
      current_provider,
    })
    return system_1
  }

  protected async tryAgain(
    param: AiRunParam,
    chatParam: OaiCreateParam,
  ) {
    // 0. get params
    const entry = param.entry

    // 1. switch model
    const secondBot = this._bots[1]
    if(!secondBot) {
      return
    }
    chatParam.model = secondBot.model
    const p = secondBot.secondaryProvider ?? secondBot.provider
    console.warn(`try again using ${secondBot.model} on ${p}`)

    // 2. change system prompt
    const firstMsg = chatParam.messages?.[0]
    if(firstMsg.role === "system") {
      const newSystemContent = this.getFirstSystemPrompt(entry, secondBot)
      firstMsg.content = newSystemContent
    }

    const chatCompletion = await this.chat(chatParam, secondBot)
    return { newChatCompletion: chatCompletion, newBot: secondBot }
  }

}

class BotBaichuan extends BaseBot {
  constructor(user?: Table_User) {
    super("baixiaoying", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }
}

class BotDeepSeek extends BaseBot {

  constructor(user?: Table_User) {
    super("deepseek", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, chats, tools } = res1

    // 2. get other params
    let bot = res1.bot
    let model = bot.model

    // 3. handle other things
    if(aiParam.isContinueCommand) {
      prompts.push({ role: "user", content: "Continue / 继续" })
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    let chatCompletion = await this.chat(chatParam, bot, { timeoutSec: 50 })

    // 5.2 try again if needed
    if(!chatCompletion) {
      const res5_2 = await this.tryAgain(aiParam, chatParam)
      if(res5_2) {
        chatCompletion = res5_2.newChatCompletion
        bot = res5_2.newBot
      }
    }
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotDsReasoner extends BaseBot {

  constructor(user?: Table_User) {
    super("ds-reasoner", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, chats, tools } = res1

    // 2. get other params
    let bot = res1.bot
    let model = bot.model

    // 3. handle other things
    if(aiParam.isContinueCommand) {
      prompts.push({ role: "user", content: "Continue / 继续" })
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
      temperature: 0.6,  // reference: https://github.com/deepseek-ai/DeepSeek-R1/pull/399/files
    }
    let chatCompletion = await this.chat(chatParam, bot)

    // 5.2 try again if needed
    if(!chatCompletion) {
      const res5_2 = await this.tryAgain(aiParam, chatParam)
      if(res5_2) {
        chatCompletion = res5_2.newChatCompletion
        bot = res5_2.newBot
      }
    }
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotMiniMax extends BaseBot {
  constructor(user?: Table_User) {
    super("hailuo", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    // turn parameters into `string` in tools
    if(tools) {
      tools.forEach(v => {
        v.function.parameters = valTool.objToStr(v.function.parameters) as any
      })
    }
    if(aiParam.isContinueCommand) {
      prompts.push({ role: "user", content: "Continue / 继续" })
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)

    // 6. handle audio result
    this.handleAudio(chatParam, chatCompletion)
    
    // 7. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

  /** remove audio prompt from user 
   * and replace it with choice[0].messages[0]
  */
  private handleAudio(
    chatParam: OaiCreateParam,
    chatCompletion?: OaiChatCompletion,
  ) {
    // 1. check out if there is message
    const choice = chatCompletion?.choices[0]
    if(!choice || choice.message) {
      return
    }
    const choice2 = choice as any
    const messages = choice2?.messages as OaiPrompt[] | undefined
    if(!messages) return

    // 2. get assistant message
    const assistantMsg = messages.find(v => v.role === "assistant")
    if(assistantMsg) {
      console.warn("update assistant message: ")
      console.log(assistantMsg)
      delete assistantMsg.name
      choice.message = assistantMsg as OaiMessage
    }

    // 3. get last user message whose type if input_audio
    const prompts = chatParam.messages
    const pLength = prompts.length
    if(pLength < 1) return
    const lastPrompt = prompts[pLength - 1]
    if(!lastPrompt) return
    if(lastPrompt.role !== "user") return
    const lastContent = lastPrompt.content
    if(!Array.isArray(lastContent)) return

    const lastPart = lastContent[0]
    if(lastPart.type !== "input_audio") return

    const userMsg = messages.find(v => v.role === "user")
    if(userMsg) {
      console.warn("update last prompt: ")
      console.log(userMsg)
      delete userMsg.name
      prompts[pLength - 1] = userMsg
    }
  }



}

class BotMoonshot extends BaseBot {

  constructor(user?: Table_User) {
    super("kimi", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    await ImageHelper.checkPromptsForBase64(prompts)

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotStepfun extends BaseBot {

  constructor(user?: Table_User) {
    super("yuewen", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotYi extends BaseBot {

  constructor(user?: Table_User) {
    super("wanzhi", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    if(aiParam.isContinueCommand) {
      prompts.push({ role: "user", content: "Continue / 继续" })
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}

class BotZhipu extends BaseBot {

  constructor(user?: Table_User) {
    super("zhipu", user)
  }

  async run(aiParam: AiRunParam): Promise<AiRunSuccess | undefined> {
    // 1. pre run
    const res1 = this.preRun(aiParam)
    if(!res1) return
    const { prompts, totalToken, bot, chats, tools } = res1

    // 2. get other params
    const model = bot.model

    // 3. handle other things
    // 3.1 remove web_search and parse_link, and add its own web_search
    if(tools && bot.metaData?.zhipuWebSearch) {
      AiHelper.removeOneTool("web_search", tools)
      AiHelper.removeOneTool("parse_link", tools)
      
      // see https://bigmodel.cn/dev/howuse/websearch
      const webSearchTool = {
        type: "web_search",
        web_search: {
          enable: true,
          search_result: true,
        }
      }
      tools.splice(0, 0, webSearchTool as any)
    }

    // 4. calculate maxTokens
    const maxToken = AiHelper.getMaxToken(totalToken, chats[0], bot)

    // 5. to chat
    const chatParam: OaiCreateParam = {
      messages: prompts,
      max_tokens: maxToken,
      model,
      tools,
    }
    const chatCompletion = await this.chat(chatParam, bot)
    
    // 6. post run
    const postParam: PostRunParam = {
      aiParam,
      chatParam,
      chatCompletion,
      bot,
    }
    const res6 = await this.postRun(postParam)
    return res6
  }

}


/*********************** AI Controller ************************/
class AiController {

  // decide whether to send "typing"
  private _handleSendTyping(aiParam: AiRunParam) {
    const { chats, entry } = aiParam
    if(chats.length < 3) {
      TellUser.typing(entry)
      return
    }
    const secondChat = chats[1]
    if(secondChat.infoType === "user") {
      const hasTyping = isWithinMillis(secondChat.insertedStamp, SEC_15)
      if(hasTyping) return
    }
    TellUser.typing(entry)
  }


  private _hasReasoningBot(
    newCharacters: AiCharacter[],
  ) {
    for(let i=0; i<newCharacters.length; i++) {
      const v1 = newCharacters[i]
      const bots = AiHelper.getBotsForCharacter(v1)
      const reasoningBot = bots.find(v2 => AiHelper.isReasoningBot(v2))
      if(reasoningBot) return true
    }
    return false
  }

  private _waitForSeconds(
    aiParam: AiRunParam,
    newCharacters: AiCharacter[],
  ) {
    const { entry } = aiParam
    const { msg_type } = entry
    if(aiParam.isContinueCommand || msg_type === "voice") return 0

    // 1. check out reasoning models exist
    const hasReasoningModel = this._hasReasoningBot(newCharacters)
    if(hasReasoningModel) return 0

    // 2. andaomly wait for a while
    const r = Math.floor((Math.random() * 3)) + 3
    return r
  }

  async run(aiParam: AiRunParam) {
    const { room, entry } = aiParam

    // 1. check bots in the room
    let characters = room.characters
    const newCharacters = characters.filter(c => AiHelper.isCharacterAvailable(c))
    if(newCharacters.length < 1) {
      console.warn("no available characters in the room")
      return false
    }

    // 1.2 decide how long to wait
    const seconds = this._waitForSeconds(aiParam, newCharacters)
    if(seconds > 0) {
      // console.log(`start to wait ${seconds} seconds`)
      await valTool.waitMilli(seconds * SECONED)
      const res1_2 = await AiHelper.canReply(aiParam)
      if(!res1_2) {
        console.warn("don't reply!")
        return
      }
    }

    // 2. compress chats
    const needCompress = AiCompressor.doINeedCompress(aiParam.chats)
    if(needCompress) {
      console.log("get to compress..............")
      const newChats = await AiCompressor.run(aiParam)
      if(newChats) {
        aiParam.chats = newChats
      }
      const res2 = await AiHelper.canReply(aiParam)
      if(!res2) {
        console.warn("we don't need to reply because ")
        console.log("there is a new message after compressing")
        return
      }
    }

    // 3. get promises
    const promises: Promise<AiRunSuccess | undefined>[] = []
    for(let i=0; i<newCharacters.length; i++) {
      const c = newCharacters[i]
      const _chats = valTool.copyObject(aiParam.chats)
      const newParam: AiRunParam = { 
        ...aiParam,
        chats: _chats,
      }
      mapBots(c, newParam, promises)
    }
    if(promises.length < 1) return

    // 3.1 send "typing" state
    this._handleSendTyping(aiParam)

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    let hasEverUsedTool = false
    const aiLogs: AiRunLog[] = []
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v && v.replyStatus === "yes") {
        hasEverSucceeded = true
        if(v.toolName) hasEverUsedTool = true
        if(v.logs) aiLogs.push(...v.logs)
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    const num5 = AiHelper.addQuotaForUser(entry)
    if(aiLogs.length > 0) {
      this.sendFallbackMenu(aiParam, res4, aiLogs) 
    }
    else if((num5 % 3) === 2 && !hasEverUsedTool) {
      this.sendFallbackMenu(aiParam, res4, aiLogs)
    }

  }

  private async sendFallbackMenu(
    aiParam: AiRunParam,
    results: AiRunResults,
    all_logs: AiRunLog[],
  ) {
    const { entry, room } = aiParam
    const user = entry.user
    const { t } = useI18n(aiLang, { user })
    const characters = room.characters
    let prefixMessage = ""
    let suffixMessage = ""

    // 1. get kickList & addedList
    const kickList = AiHelper.getKickCharacters(characters, results)
    const addedList = AiHelper.getAddedCharacters(characters, results)

    // 2.1 extract all logs
    const privacyLogs = all_logs.filter(v => {
      const bool = Boolean(v.toolName === "get_cards" || v.toolName === "get_schedule")
      return bool
    })
    const workingLogs = all_logs.filter(v => v.toolName === "draw_picture")

    // 2.2 privacy tips
    if(privacyLogs.length > 0) {
      privacyLogs.sort((a, b) => a.logStamp - b.logStamp)
      prefixMessage += (t("privacy_title") + "\n")
      privacyLogs.forEach(v => {
        prefixMessage += (v.textToUser + "\n")
      })
      prefixMessage += "\n"
    }

    // 2.3 working logs
    if(workingLogs.length > 0) {
      workingLogs.sort((a, b) => a.logStamp - b.logStamp)
      prefixMessage += (t("working_log_title") + "\n")
      workingLogs.forEach(v => {
        prefixMessage += (v.textToUser + "\n")
      })
      prefixMessage += "\n"
    }

    // 3. menu
    const menuList: AiMenuItem[] = []
    kickList.forEach(v => menuList.push({ operation: "kick", character: v }))
    addedList.forEach(v => menuList.push({ operation: "add", character: v }))
    menuList.push({ operation: "clear_history" })
    if(menuList.length > 0) {
      prefixMessage += t("operation_title")
      suffixMessage = "\n"
    }

    // 4. add warning into suffixMessage
    suffixMessage += t("generative_ai_warning")

    // console.warn("ready to send menu........")
    // console.log(prefixMessage)
    // console.log(menuList)
    // console.log(suffixMessage)

    // 5. send
    await valTool.waitMilli(500)
    TellUser.menu(entry, prefixMessage, menuList, suffixMessage)
  }

}

/*********************** Contine by Human ************************/

interface ContinueTmpItem {
  character: AiCharacter
  chats: Table_AiChat[]
}

class ContinueController {

  private _entry: AiEntry
  private _room: Table_AiRoom
  private _characterSelected?: AiCharacter

  constructor(
    entry: AiEntry, 
    room: Table_AiRoom,
    characterSelected?: AiCharacter
  ) {
    this._entry = entry
    this._room = room
    this._characterSelected = characterSelected
  }

  async run() {
    const room = this._room
    const roomId = room._id
    const entry = this._entry
    const characterSelected = this._characterSelected

    // 1. get latest 16 chats
    const chats = await AiHelper.getLatestChat(roomId, 16)
    if(chats.length < 2) return

    // 1.1 generate a chat list where the first one is the user message, and the rest is messages before that
    let chatsBeforeUser: Table_AiChat[] = []
    let userAndTheRest: Table_AiChat[] = []
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      if(v.infoType === "user") {
        chatsBeforeUser = chats.slice(0, i)
        userAndTheRest = chats.slice(i)
        break
      }
    }
    if(chatsBeforeUser.length < 1) return
    if(userAndTheRest.length < 1) return

    // 2. find characters and their chats to continue
    const stoppedCharacters: AiCharacter[] = []
    const list: ContinueTmpItem[] = []

    const _addChat = (item: Table_AiChat) => {
      const { character } = item
      if(!character) return
      const v2 = list.find(v3 => v3.character === character)
      if(v2) {
        v2.chats.push(item)
      }
      else {
        list.push({ character, chats: [item] })
      }
    }

    for(let i=0; i<chatsBeforeUser.length; i++) {
      const v = chatsBeforeUser[i]
      const { infoType, character, finish_reason } = v

      // 2.1 next if infoType is not assistant or character is undefined
      if(infoType !== "assistant" || !character) continue

      // 2.2 check out if it's the selected character
      if(characterSelected) {
        if(character !== characterSelected) continue
      }

      // 2.2.1 ds-reasoner
      if(character === "ds-reasoner") {
        _addChat(v)
        continue
      }

      // 2.3 next if character is stopped
      const isStopped = stoppedCharacters.includes(character)
      if(isStopped) continue

      // 2.4 add character into stoppedCharacters if finish_reason is stop
      if(finish_reason === "stop") {
        stoppedCharacters.push(character)
        continue
      }

      // 2.5 next if finish_reason is not "length"
      if(finish_reason !== "length") continue
      
      // 2.6 add the chat
      _addChat(v)
    }

    // 3. return if list is empty
    if(list.length < 1) {
      const { t } = useI18n(aiLang, { user: entry.user })
      const msg3 = t("no_more_to_continue")
      TellUser.text(entry, msg3)
      return
    }
    list.forEach(v => {
      const copyOfUserAndTheRest = valTool.copyObject(userAndTheRest)
      v.chats.push(...copyOfUserAndTheRest)
    })

    // 4. get promises
    const promises: Promise<AiRunSuccess | undefined>[] = []
    for(let i=0; i<list.length; i++) {
      const v = list[i]
      const c = v.character
      const newParam: AiRunParam = {
        entry,
        room,
        chats: v.chats,
        isContinueCommand: true,
      }
      mapBots(c, newParam, promises)
    }
    if(promises.length < 1) return

    // 3.1 send "typing" state
    TellUser.typing(entry)

    // 4. wait for all promises
    const res4 = await Promise.all(promises)
    let hasEverSucceeded = false
    for(let i=0; i<res4.length; i++) {
      const v = res4[i]
      if(v && v.replyStatus === "yes") {
        hasEverSucceeded = true
      }
    }
    if(!hasEverSucceeded) return

    // 5. add quota for user
    AiHelper.addQuotaForUser(entry)
  }

}



/*********************** AI Compressor ************************/
class AiCompressor {

  static doINeedCompress(chats: Table_AiChat[]) {
    const len = chats.length
    if(len < 3) return false
    
    let token = 0
    for(let i=0; i<len; i++) {
      const v = chats[i]
      token += AiHelper.calculateChatToken(v)
      if(v.infoType === "summary") break
    }

    if(token > TOKEN_NEED_COMPRESS) return true
    return false
  }


  static async run(
    aiParam: AiRunParam,
  ): Promise<Table_AiChat[] | undefined> {
    const _env = process.env
    const { chats, entry, room } = aiParam
    const { user } = entry

    // 1. get the two system prompts
    const { p } = aiI18nShared({ type: "compress", user })
    const system1 = p("system_1")
    const system2 = p("system_2")

    // 2. add two system prompts to the prompts
    const chatIntoPrompter = new ChatIntoPrompter(user)
    const prompts = chatIntoPrompter.run(chats)
    prompts.reverse()
    prompts.unshift({ role: "system", content: system1 })
    prompts.push({ role: "user", content: system2 })

    // 3. add prefix msg
    const prefix_msg = p("prefix_msg")
    if(_env.LIU_SUMMARY_PREFIX === "01") {
      const msg3_1 = { 
        role: "assistant", 
        content: prefix_msg, 
        prefix: true,
      } as OaiPrompt
      prompts.push(msg3_1)
    }
    else if(_env.LIU_SUMMARY_PARTIAL === "01") {
      const msg3_2 = { 
        role: "assistant", 
        content: prefix_msg, 
        partial: true,
      } as OaiPrompt
      prompts.push(msg3_2)
    }
    PromptsChecker.run(prompts)

    // 4. construct the arg to send to LLM
    const llm = new BaseLLM(_env.LIU_SUMMARY_API_KEY, _env.LIU_SUMMARY_BASE_URL)
    const arg4: OaiCreateParam = {
      messages: prompts,
      model: _env.LIU_SUMMARY_MODEL ?? "",
    }
    const t1 = getNowStamp()
    const res4 = await llm.chat(arg4, { user })
    const t2 = getNowStamp()
    const cost = t2 - t1
    console.log("summary cost: ", cost)
    if(!res4) {
      console.warn("summary llm got an error")
      return
    }

    console.log("see summary response......")
    console.log(res4.choices[0])
    // 5. get data from the response
    const usage = res4.usage
    const text = res4.choices[0].message.content
    if(!text) {
      console.warn("no text in the summary response")
      return
    }

    // 6. calculate the new total token and get the sortStamp
    let totalToken = 0
    let idx6 = 0
    const newChats: Table_AiChat[] = []
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const token = AiHelper.calculateChatToken(v)
      totalToken += token
      newChats.push(v)
      idx6 = i
      if(totalToken > 900) {
        break
      }
    }
    if(usage?.completion_tokens) {
      totalToken += usage.completion_tokens
    }
    const clipChat = chats[idx6]
    const sortStamp = clipChat?.sortStamp ?? getNowStamp()
    const newSortStamp = sortStamp + 10

    // 7. storage the summary
    const b7 = getBasicStampWhileAdding()
    const data7: Partial_Id<Table_AiChat> = {
      ...b7,
      sortStamp: newSortStamp,
      roomId: room._id,
      infoType: "summary",
      text,
      model: _env.LIU_SUMMARY_MODEL,
      usage,
      requestId: res4.id,
      baseUrl: _env.LIU_SUMMARY_BASE_URL,
    }
    const chatId7 = await AiHelper.addChat(data7)
    if(!chatId7) return
    newChats.push({ _id: chatId7, ...data7 })

    // 8. return the new chats
    return newChats
  }
}


/*********************** helper functions ************************/


class ToolHandler {

  private _aiParam: AiRunParam
  private _bot: AiBot
  private _tool_calls: OaiToolCall[]
  private _chatCompletion?: OaiChatCompletion

  constructor(
    aiParam: AiRunParam, 
    bot: AiBot,
    tool_calls: OaiToolCall[],
    chatCompletion?: OaiChatCompletion,
  ) {
    this._aiParam = aiParam
    this._bot = bot
    this._tool_calls = tool_calls
    this._chatCompletion = chatCompletion
  }

  private async _addMsgToChat(
    param: Partial<AiHelperAssistantMsgParam>
  ) {
    const { room } = this._aiParam
    const bot = this._bot
    const chatCompletion = this._chatCompletion
    const apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
    const arg: AiHelperAssistantMsgParam = {
      roomId: room._id,
      model: bot.model,
      character: bot.character,
      usage: chatCompletion?.usage,
      requestId: chatCompletion?.id,
      baseUrl: apiEndpoint?.baseURL,
      tool_calls: this._tool_calls,
      ...param,
    }
    const assistantChatId = await AiHelper.addAssistantMsg(arg)
    return assistantChatId
  }

  private _getAgreeAndEditLinks(assistantChatId: string) {
    const domain = getLiuDoman()

    const agreeLink = `${domain}/agree?chatId=${assistantChatId}`
    const editLink = `${domain}/compose?chatId=${assistantChatId}`

    return { agreeLink, editLink }
  }

  private _getEssentialReplyData(assistantChatId: string) {
    const entry = this._aiParam.entry
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    const { agreeLink, editLink } = this._getAgreeAndEditLinks(assistantChatId)
    const botName = this._bot.name
    return { t, agreeLink, editLink, botName }
  }
  
  async add_note(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_note", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_note: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_note",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    let msg = ""
    const { title, description } = funcJson
    if(title) {
      msg = t("add_note_with_title", { botName, title, desc: description, agreeLink, editLink })
    }
    else {
      msg = t("add_note_only_desc", { botName, desc: description, agreeLink, editLink })
    }
    TellUser.text(this._aiParam.entry, msg)
  }

  async add_todo(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_todo", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_todo: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_todo",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    const { title } = funcJson
    let msg = t("add_todo", { botName, title, agreeLink, editLink })
    TellUser.text(this._aiParam.entry, msg)
  }

  async add_calendar(funcJson: Record<string, any>) {
    // 1. check out param
    const waitingData = AiToolUtil.turnJsonToWaitingData("add_calendar", funcJson)
    if(!waitingData) {
      console.warn("cannot parse funcJson in add_calendar: ")
      console.log(funcJson)
      return
    }

    // 2. add msg
    const assistantChatId = await this._addMsgToChat({
      funcName: "add_calendar",
      funcJson,
    })
    if(!assistantChatId) return

    // 3. reply
    const { t, agreeLink, editLink, botName } = this._getEssentialReplyData(assistantChatId)
    const {
      title,
      description,
      date,
      specificDate,
      time,
      earlyMinute,
      laterHour,
    } = funcJson as AiToolAddCalendarParam
    let msg = t("add_calendar_1", { botName })
    if(title) {
      msg += t("add_calendar_2", { title })
    }
    msg += t("add_calendar_3", { desc: description })

    /** Priority:
     *   date > specificDate > laterHour
     */
    // 3.1 handle date
    let hasAddedDate = false
    if(date) {
      const dateObj = LiuDateUtil.distractFromYYYY_MM_DD(date)
      if(dateObj) {
        hasAddedDate = true
        msg += t("add_calendar_4", { date })
      }
    }
    if(specificDate && !hasAddedDate) {
      const strDate = t(specificDate)
      if(strDate) {
        hasAddedDate = true
        msg += t("add_calendar_4", { date: strDate })
      }
    }

    // 3.2 handle time
    let hasAddedTime = false
    if(time) {
      const timeObj = LiuDateUtil.distractFromhh_mm(time)
      if(timeObj) {
        hasAddedTime = true
        msg += t("add_calendar_5", { time })
      }
    }
    if(earlyMinute && hasAddedTime) {
      let strReminder = ""
      if(earlyMinute < 60) {
        strReminder = t("early_min", { min: earlyMinute })
      }
      else if(earlyMinute === 60 || earlyMinute === 120) {
        const tmpHrs = Math.round(earlyMinute / 60)
        strReminder = t("early_hr", { hr: tmpHrs })
      }
      else if(earlyMinute === 1440) {
        strReminder = t("early_day", { day: 1 })
      }
      if(strReminder) {
        msg += t("add_calendar_6", { str: strReminder })
      }
    }

    // 3.3 handle later
    if(laterHour && !hasAddedTime && !hasAddedDate) {
      let strLater = ""
      if(laterHour === 0.5) {
        strLater = t("later_min", { min: 30 })
      }
      else if(laterHour < 24) {
        strLater = t("later_hr", { hr: laterHour })
      }
      else if(laterHour === 24) {
        strLater = t("later_day", { day: 1 })
      }
      if(strLater) {
        msg += t("add_calendar_6", { str: strLater })
      }
    }

    // 3.3 add footer
    msg += t("add_calendar_7", { agreeLink, editLink })

    console.warn("see msg for calendar: ")
    console.log(msg)

    TellUser.text(this._aiParam.entry, msg)
  }

  async web_search(funcJson: Record<string, any>) {
    // console.warn("web_search by ourselves!")
    // console.log(funcJson)

    // 1. get q
    const q = funcJson.q
    if(typeof q !== "string") {
      console.warn("web_search q is not string")
      return
    }

    // 2. call WebSearch.run
    const searchRes = await WebSearch.run(q)
    if(!searchRes) {
      console.warn("fail to search on web")
      return
    }

    // 3. add msg
    const data3: Partial<AiHelperAssistantMsgParam> = {
      funcName: "web_search",
      funcJson,
      webSearchProvider: searchRes.provider,
      webSearchData: searchRes.originalResult,
      text: searchRes.markdown,
    }
    const assistantChatId = await this._addMsgToChat(data3)
    return searchRes
  }

  private async _getDrawResult(
    prompt: string, 
    sizeType: AiImageSizeType,
  ) {
    // 1. get param
    let res: LiuAi.PaletteResult | undefined
    const bot = this._bot
    const c = bot.character
    
    // 2. translate if needed
    let imagePrompt = prompt
    const num2 = valTool.getChineseCharNum(prompt)
    console.warn("chinese char num: ", num2)
    if(num2 > 3) {
      const user = this._aiParam.entry.user
      const translator = new Translator(bot, user)
      const res2 = await translator.run(prompt)
      if(!res2) {
        console.warn("fail to translate")
      }
      else {
        imagePrompt = res2.translatedText
      }
    }

    // 3. run by zhipu if character is zhipu
    if(c === "zhipu") {
      res = await Palette.runByZhipu(imagePrompt, sizeType)
      if(res) return res
    }

    // 4. run by stepfun if character is stepfun
    if(c === "yuewen") {
      res = await Palette.runByStepfun(imagePrompt, sizeType)
      if(res) return res
    }

    // n. run 
    res = await Palette.run(imagePrompt, sizeType)
    return res
  }

  async draw_picture(
    funcJson: Record<string, any>
  ): Promise<LiuAi.PaletteResult | undefined> {
    // 1. check out param
    const prompt = funcJson.prompt
    if(!prompt || typeof prompt !== "string") {
      console.warn("draw_picture prompt is not string")
      console.log(funcJson)
      return
    }
    let sizeType = funcJson.sizeType as AiImageSizeType
    if(sizeType !== "portrait" && sizeType !== "square") {
      sizeType = "square"
    }

    // 2. add message first because text_to_image may take a long time
    const data2: Partial<AiHelperAssistantMsgParam> = {
      funcName: "draw_picture",
      funcJson,
      text: prompt,
    }
    const assistantChatId = await this._addMsgToChat(data2)
    if(!assistantChatId) return

    // 3. draw
    let res3 = await this._getDrawResult(prompt, sizeType)
    if(!res3) return

    // 4. update assistant msg
    const data4: Partial<Table_AiChat> = {
      drawPictureUrl: res3.url,
      drawPictureData: res3.originalResult,
      drawPictureModel: res3.model,
    }
    if(prompt !== res3.prompt) {
      data4.text = res3.prompt
    }

    AiHelper.updateAiChat(assistantChatId, data4)

    // 5. reply image
    const { entry } = this._aiParam
    await TellUser.image(entry, res3.url, this._bot)

    return res3
  }

  async get_schedule(
    funcJson: Record<string, any>,
  ): Promise<LiuAi.ReadCardsResult | undefined> {
    // 0. normalize for bots which are not so smart
    if(funcJson.specificDate === "dayAfterTomorrow") {
      funcJson.specificDate = "day_after_tomorrow"
    }
    if(typeof funcJson.hoursFromNow === "string") {
      const res0_1 = valTool.isStringAsNumber(funcJson.hoursFromNow)
      funcJson.hoursFromNow = res0_1 ? Number(funcJson.hoursFromNow) : 24
    }

    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetScheduleParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_schedule param, so we make it default")
      console.log(res1.issues)
      funcJson = {}
    }
    const { hoursFromNow, specificDate } = funcJson as AiToolGetScheduleParam

    // 2. construct basic query
    const now = getNowStamp()
    const entry = this._aiParam.entry
    const bot = this._bot
    const { user } = entry
    const q2: Record<string, any> = {
      user: user._id,
      spaceType: "ME",
      infoType: "THREAD",
      oState: "OK",
      storageState: "CLOUD",
      aiReadable: "Y",
      calendarStamp: _.gte(now),
    }
    let sortWay: SortWay = "asc"

    // 2.1 define replied text
    const { t } = useI18n(aiLang, { user })
    let textToBot = t("schedule_future")
    let textToUser = t("bot_read_future", { bot: bot.name })

    // 3. handle hoursFromNow
    if(hoursFromNow) {
      if(hoursFromNow < 0) {
        sortWay = "desc"
        const command3_1 = _.lt(now)
        const command3_2 = _.gte(now + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_1, command3_2)
        textToBot = t("schedule_last", { hour: hoursFromNow })
        textToUser = t("bot_read_last", { bot: bot.name, hour: hoursFromNow })
      }
      else {
        const command3_3 = _.gt(now)
        const command3_4 = _.lte(now + hoursFromNow * HOUR)
        q2.calendarStamp = _.and(command3_3, command3_4)
        textToBot = t("schedule_next", { hour: hoursFromNow })
        textToUser = t("bot_read_next", { bot: bot.name, hour: hoursFromNow })
      }
    }

    // 4. handle specificDate
    if(specificDate) {
      const res4 = this._handleGetScheduleForSpecificDate(specificDate)
      if(res4) {
        const command4_1 = _.gte(res4.fromStamp)
        const command4_2 = _.lt(res4.toStamp)
        q2.calendarStamp = _.and(command4_1, command4_2)
        textToBot = res4.textToBot
        textToUser = res4.textToUser
      }
    }

    // 5. to query
    const col5 = db.collection("Content")
    const q5 = col5.where(q2).orderBy("calendarStamp", sortWay)
    const res5 = await q5.limit(10).get<Table_Content>()
    const list5 = res5.data
    
    // 6. package
    let msg6 = ""
    for(let i=0; i<list5.length; i++) {
      const v = list5[i]
      const card = TransformContent.getCardData(v)
      if(!card) continue
      const msg6_1 = TransformContent.toPlainText(card, user)
      if(!msg6_1) continue
      msg6 += msg6_1
    }

    // 7. has data
    const hasData = Boolean(msg6)
    if(hasData) {
      textToBot += msg6
    }
    else {
      textToBot += t("no_data")
    }

    console.warn("see textToUser: ")
    console.log(textToUser)
    console.warn("see textToBot: ")
    console.log(textToBot)

    // 8. add msg
    const data8: Partial<AiHelperAssistantMsgParam> = {
      funcName: "get_schedule",
      funcJson,
      text: hasData ? textToUser : textToBot,
    }
    const assistantChatId = await this._addMsgToChat(data8)
    if(!assistantChatId) return

    return {
      textToUser,
      textToBot,
      assistantChatId,
    }
  }

  private _handleGetScheduleForSpecificDate(
    specificDate: AiToolGetScheduleSpecificDate,
  ) {
    // 1. inject required data
    const entry = this._aiParam.entry
    const { user } = entry
    const bot = this._bot
    const botName = bot.name
    const { t } = useI18n(aiLang, { user })

    // 2. get today
    const now = getNowStamp()
    const userStamp = localizeStamp(now, user.timezone)
    const diffStampBetweenUserAndServer = userStamp - now
    const currentDate = new Date(userStamp)
    const todayDate = date_fn_set(currentDate, {
      hours: 0, minutes: 0, seconds: 0, milliseconds: 0,
    })
    const todayStamp = todayDate.getTime() - diffStampBetweenUserAndServer

    // 3. define return data
    let textToBot = ""
    let textToUser = ""
    let fromStamp: number | undefined
    let toStamp: number | undefined
    
    // 4. if yesterday
    if(specificDate === "yesterday") {
      const yesterdayDate = addDays(todayDate, -1)
      fromStamp = yesterdayDate.getTime() - diffStampBetweenUserAndServer
      toStamp = todayStamp
      textToBot = t("yesterday_schedule")
      textToUser = t("bot_read_yesterday", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const tomorrowDate = addDays(todayDate, 1)
    const tomorrowStamp = tomorrowDate.getTime() - diffStampBetweenUserAndServer
    
    // 5. if today
    if(specificDate === "today") {
      fromStamp = todayStamp
      toStamp = tomorrowStamp
      textToBot = t("today_schedule")
      textToUser = t("bot_read_today", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const dayAfterTomorrow = addDays(todayDate, 2)
    const dayAfterTomorrowStamp = dayAfterTomorrow.getTime() - diffStampBetweenUserAndServer

    // 6. if tomorrow
    if(specificDate === "tomorrow") {
      fromStamp = tomorrowStamp
      toStamp = dayAfterTomorrowStamp
      textToBot = t("tomorrow_schedule")
      textToUser = t("bot_read_tomorrow", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    const day3 = addDays(todayDate, 3)
    const day3Stamp = day3.getTime() - diffStampBetweenUserAndServer

    // 7. if day_after_tomorrow
    if(specificDate === "day_after_tomorrow") {
      fromStamp = dayAfterTomorrowStamp
      toStamp = day3Stamp
      textToBot = t("day2_schedule")
      textToUser = t("bot_read_day2", { bot: botName })
      return { fromStamp, toStamp, textToBot, textToUser }
    }

    // 8. calculate this or next week
    const DAY_LIST = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const idx8 = DAY_LIST.indexOf(specificDate)
    if(idx8 < 0) return
    const dayStr = t(specificDate)

    const currentDay = currentDate.getDay()
    let diffDays = idx8 - currentDay
    if(diffDays <= 0) {
      // next week
      diffDays += 7
      textToBot = t("schedule_next_week", { day: dayStr })
      textToUser = t("bot_read_next_week", { bot: botName, day: dayStr })
    }
    else {
      // this week
      textToBot = t("schedule_this_week", { day: dayStr })
      textToUser = t("bot_read_this_week", { bot: botName, day: dayStr })
    }

    fromStamp = addDays(todayDate, diffDays).getTime() - diffStampBetweenUserAndServer
    toStamp = fromStamp + DAY

    return { textToBot, textToUser, fromStamp, toStamp }
  }

  async get_cards(
    funcJson: Record<string, any>
  ): Promise<LiuAi.ReadCardsResult | undefined> {
    // 1. checking out param
    const res1 = vbot.safeParse(Sch_AiToolGetCardsParam, funcJson)
    if(!res1.success) {
      console.warn("cannot parse get_cards param: ")
      console.log(funcJson)
      console.log(res1.issues)
      return
    }
    const cardType = funcJson.cardType as AiToolGetCardType

    // 2. construct basic query
    const entry = this._aiParam.entry
    const bot = this._bot
    const { user } = entry
    const userId = user._id
    const q2: Record<string, any> = {
      user: userId,
      spaceType: "ME",
      infoType: "THREAD",
      oState: "OK",
      storageState: "CLOUD",
      aiReadable: "Y",
    }

    // 2.1 define replied text
    let textToBot = ""
    let textToUser = ""
    const { t } = useI18n(aiLang, { user })
    let contents: Table_Content[] | undefined

    // 3. get contents
    const cCol = db.collection("Content")
    if(cardType === "TODO" || cardType === "FINISHED") {
      q2.stateId = cardType
      const q3_0 = cCol.where(q2).orderBy("stateStamp", "desc").limit(10)
      const res3_0 = await q3_0.get<Table_Content>()
      contents = res3_0.data
      if(cardType === "TODO") {
        textToBot = t("todo_cards")
        textToUser = t("bot_read_todo", { bot: bot.name })
      }
      else if(cardType === "FINISHED") {
        textToBot = t("finished_cards")
        textToUser = t("bot_read_finished", { bot: bot.name })
      }
    }
    else if(cardType === "EVENT") {
      q2.calendarStamp = _.gt(getNowStamp() - DAY)
      const q3_1 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_1 = await q3_1.get<Table_Content>()
      contents = res3_1.data
      textToBot = t("event_cards")
      textToUser = t("bot_read_event", { bot: bot.name })
    }
    else {
      const q3_2 = cCol.where(q2).orderBy("createdStamp", "desc").limit(10)
      const res3_2 = await q3_2.get<Table_Content>()
      contents = res3_2.data
      textToBot = t("note_cards")
      textToUser = t("bot_read_note", { bot: bot.name })
    }

    // 6. package
    let msg6 = ""
    for(let i=0; i<contents.length; i++) {
      const v = contents[i]
      const card = TransformContent.getCardData(v)
      if(!card) continue
      const msg6_1 = TransformContent.toPlainText(card, user)
      if(!msg6_1) continue
      msg6 += msg6_1
    }

    // 7. has data
    const hasData = Boolean(msg6)
    if(hasData) {
      textToBot += msg6
    }
    else {
      textToBot += t("no_data")
    }

    console.warn("see textToUser: ")
    console.log(textToUser)
    console.warn("see textToBot: ")
    console.log(textToBot)

    // 8. add msg
    const data8: Partial<AiHelperAssistantMsgParam> = {
      funcName: "get_cards",
      funcJson,
      text: hasData ? textToUser : textToBot,
    }
    const assistantChatId = await this._addMsgToChat(data8)
    if(!assistantChatId) return

    return {
      textToUser,
      textToBot,
      assistantChatId,
    }
  }

}


class TransformContent {

  static getCardData(v: Table_Content) {
    const data = decryptEncData(v)
    if(!data.pass) return
    const summary = getSummary(data.liuDesc)
    const obj: AiCard = {
      title: data.title ?? "",
      summary,
      contentId: v._id,
      hasImage: Boolean(data.images?.length),
      hasFile: Boolean(data.files?.length),
      calendarStamp: v.calendarStamp,
      createdStamp: v.createdStamp,
    }
    return obj
  }

  static toPlainText(v: AiCard, user?: Table_User) {
    let msg = ""

    // title
    if(v.title) {
      msg += `  <title>${v.title}</title>\n`
    }

    // summary
    if(v.summary) {
      msg += `  <summary>${v.summary}</summary>\n`
    }
    else if(v.hasImage) {
      msg += `  <summary>[Image]</summary>\n`
    }
    else if(v.hasFile) {
      msg += `  <summary>[File]</summary>\n`
    }

    // calendarStamp
    const locale = getCurrentLocale({ user })
    if(v.calendarStamp) {
      const dateStr = LiuDateUtil.displayTime(v.calendarStamp, locale, user?.timezone)
      msg += `  <date>${dateStr}</date>\n`
    }
    if(!msg) return

    // created
    const createdStr = LiuDateUtil.displayTime(v.createdStamp, locale, user?.timezone)
    msg += `  <created>${createdStr}</created>\n`
    msg = `<${v.contentId}>\n${msg}</${v.contentId}>`
    return msg
  }

}


/******************** tool for web search ************************/
export class WebSearch {

  static async run(q: string) {
    const _env = process.env
    const zhipuUrl = _env.LIU_ZHIPU_BASE_URL
    const zhipuApiKey = _env.LIU_ZHIPU_API_KEY

    let searchRes: LiuAi.SearchResult | undefined
    if(zhipuUrl && zhipuApiKey) {
      searchRes = await this.runByZhipu(q, zhipuUrl, zhipuApiKey)
    }

    return searchRes
  }

  // reference: https://www.bigmodel.cn/dev/api/search-tool/web-search-pro
  static async runByZhipu(
    q: string,
    baseUrl: string,
    apiKey: string,
  ) {
    const url = baseUrl + "tools"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const messages = [{ role: "user", content: q }]
    const body = {
      tool: "web-search-pro",
      messages,
      stream: false,
    }
    try {
      const res = await liuReq<Ns_Zhipu.WebSearchChatCompletion>(
        url, 
        body, 
        { headers }
      )
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromZhipu(q, res.data)
        return parseResult
      }
      console.warn("web-search runByZhipu got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("web-search runByZhipu error: ")
      console.log(err)
    }
  }

  // parse from zhipu's result
  private static _parseFromZhipu(
    q: string,
    chatCompletion: Ns_Zhipu.WebSearchChatCompletion,
  ): LiuAi.SearchResult | undefined {
    // 1. get results
    const theChoice = chatCompletion.choices[0]
    if(!theChoice) return
    const { finish_reason, message } = theChoice
    if(finish_reason !== "stop") {
      console.warn(`web-search finish reason is not stop: ${finish_reason}`)
      console.log(theChoice)
      return
    }
    const tool_calls = message?.tool_calls ?? []
    if(!tool_calls.length) return
    const resultData = tool_calls.find(v => v.type === "search_result")
    const results = resultData?.search_result ?? []
    if(results.length < 1) {
      return {
        markdown: `搜索：${q}\n结果：查无任何结果`,
        provider: "zhipu",
        originalResult: chatCompletion,
      }
    }

    // 2. get intent
    const intentData = tool_calls.find(v => v.type === "search_intent")
    const intents = intentData?.search_intent ?? []
    const theIntent = intents.length > 0 ? intents[0] : undefined

    let md = ""
    // 3. add intent
    if(theIntent) {
      md += `【关键词】：${theIntent.keywords}\n`
      md += `【原始意图】：${theIntent.query}\n`
      if(theIntent.intent === "SEARCH_ALL") {
        md += `【搜索范围】：全网搜索\n`
      }
    }
    else {
      md += `【搜索】：${q}\n`
    }
    md += `【搜索结果】：\n\n`

    // 4. add results
    const maxLength = Math.min(results.length, 10)
    for(let i=0; i<maxLength; i++) {
      const r = results[i]
      md += `#### ${r.title}\n`
      md += `【链接】：${r.link}\n`
      md += `【来源】：${r.media}\n`
      md += `【描述】：${r.content}\n\n`
    }

    return {
      markdown: md,
      provider: "zhipu",
      originalResult: chatCompletion,
    }
  }

}


/******************** tool for painting ************************/

interface PaletteSpecificOpt {
  apiKey: string
  baseUrl: string
  model: string
}

export class Palette {

  static async run(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    const _env = process.env
    const sfUrl = _env.LIU_SILICONFLOW_BASE_URL
    const sfApiKey = _env.LIU_SILICONFLOW_API_KEY
    const sfModel = _env.LIU_SILICONFLOW_IMAGE_GENERATION_MODEL
    
    // 1. run by siliconflow
    if(sfUrl && sfApiKey && sfModel) {
      const opt1: PaletteSpecificOpt = {
        apiKey: sfApiKey,
        baseUrl: sfUrl,
        model: sfModel,
      }
      const res1 = await this.runBySiliconflow(prompt, sizeType, opt1)
      return res1
    }
  }

  static async runByStepfun(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    // 1. get api key and base url
    const _env = process.env
    const apiKey = _env.LIU_STEPFUN_API_KEY
    const baseUrl = _env.LIU_STEPFUN_BASE_URL
    if(!apiKey || !baseUrl) {
      console.warn("there is no apiKey or baseUrl of stepfun in Palette")
      return
    }

    // 2. construct url
    const model = "step-1x-medium"
    const url = baseUrl + "images/generations"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const body = {
      model,
      prompt,
      size: sizeType === "square" ? "1024x1024" : "800x1280",
    }
    console.warn("start to draw with ", model)
    console.log(prompt)

    try {
      const stamp1 = getNowStamp()
      const res = await liuReq<Ns_Stepfun.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )
      const stamp2 = getNowStamp()
      const durationStamp = stamp2 - stamp1
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromStepfun(res.data, model, durationStamp, prompt)
        return parseResult
      }
      console.warn("palette runByStepfun got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("palette runByStepfun error: ")
      console.log(err)
    }

  }

  private static _parseFromStepfun(
    res: Ns_Stepfun.ImagesGenerationsRes,
    model: string,
    durationStamp: number,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    // 1. get duration
    const duration = valTool.numToFix(durationStamp, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration in _parseFromStepfun: ")
      console.log(res)
      return
    }

    console.log("_parseFromStepfun res: ")
    console.log(res)

    // 2. get img
    const theImg = res.data?.[0]
    const url = theImg?.url
    if(!url) {
      console.warn("cannot get the image url in _parseFromStepfun: ")
      console.log(res)
      return
    }

    return {
      url,
      prompt,
      model,
      duration,
      originalResult: res,
    }
  }

  static async runByZhipu(
    prompt: string,
    sizeType: AiImageSizeType,
  ) {
    // 1. get api key and base url
    const _env = process.env
    const apiKey = _env.LIU_ZHIPU_API_KEY
    const baseUrl = _env.LIU_ZHIPU_BASE_URL
    if(!apiKey || !baseUrl) {
      console.warn("there is no apiKey or baseUrl of zhipu in Palette")
      return
    }

    // 2. construct url, headers, and body
    const model = "cogview-3-plus"
    const url = baseUrl + "images/generations"
    const headers = { "Authorization": `Bearer ${apiKey}` }
    const body = {
      model,
      prompt,
      size: sizeType === "square" ? "1024x1024" : "768x1344",
    }
    
    console.warn("start to draw with ", model)
    console.log(prompt)

    try {
      const stamp1 = getNowStamp()
      const res = await liuReq<Ns_Zhipu.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )
      const stamp2 = getNowStamp()
      const durationStamp = stamp2 - stamp1
      if(res.code === "0000" && res.data) {
        const parseResult = this._parseFromZhipu(res.data, model, durationStamp, prompt)
        return parseResult
      }
      console.warn("palette runByZhipu got an unexpected result: ")
      console.log(res)
    }
    catch(err) {
      console.warn("palette runByZhipu error: ")
      console.log(err)
    }
  }

  private static _parseFromZhipu(
    res: Ns_Zhipu.ImagesGenerationsRes | Ns_Zhipu.ErrorResponse,
    model: string,
    durationStamp: number,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    // 1. get duration
    const duration = valTool.numToFix(durationStamp, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration in _parseFromZhipu: ")
      console.log(res)
      return
    }

    // 2. get url
    const successRes = res as Ns_Zhipu.ImagesGenerationsRes
    const failRes = res as Ns_Zhipu.ErrorResponse
    const url = successRes.data?.[0]?.url
    if(!url) {
      console.warn("cannot get the image url in _parseFromZhipu: ")
      console.log(failRes)
      return
    }

    return {
      url,
      prompt,
      model,
      duration,
      originalResult: res,
    }
  }

  static async runBySiliconflow(
    prompt: string,
    sizeType: AiImageSizeType,
    opt: PaletteSpecificOpt,
  ) {

    // 1. construct headers and body
    const url = opt.baseUrl + "/images/generations"
    const headers = {
      "Authorization": `Bearer ${opt.apiKey}`,
    }
    // reference: https://docs.siliconflow.cn/api-reference/images/images-generations
    const body: Record<string, any> = {
      model: opt.model,
      prompt,
      image_size: sizeType === "square" ? "1024x1024" : "768x1024",
      num_inference_steps: 20,
    }

    // 2.1 for stable diffusion
    if(opt.model.includes("stable-diffusion")) {
      body.batch_size = 1
      body.guidance_scale = 7.5 
    }

    console.warn("start to draw with ", opt.model)
    console.log(prompt)

    // 3. to fetch
    try {
      const res3 = await liuReq<Ns_SiliconFlow.ImagesGenerationsRes>(
        url, 
        body, 
        { headers }
      )

      if(res3.code === "0000" && res3.data) {
        const parseResult = this._parseFromSiliconflow(res3.data, opt.model, prompt)
        return parseResult
      }

      console.warn("palette runBySiliconflow got an unexpected result: ")
      console.log(res3)
    }
    catch(err) {
      console.warn("palette runBySiliconflow error: ")
      console.log(err)
    }
  }

  private static _parseFromSiliconflow(
    data: Ns_SiliconFlow.ImagesGenerationsRes,
    model: string,
    prompt: string,
  ): LiuAi.PaletteResult | undefined {
    const img = data.images?.[0]
    if(!img) return
    const inference = data.timings?.inference
    if(!inference) return
    const url = img.url

    if(model.indexOf("/") > 0) {
      const tmpList = model.split("/")
      model = tmpList[tmpList.length - 1]
    }

    const duration = valTool.numToFix(inference, 2)
    if(isNaN(duration)) {
      console.warn("cannot parse duration from siliconflow: ")
      console.log(data)
      return
    }

    return {
      url,
      model,
      prompt,
      duration,
      originalResult: data,
    }
  }

}


interface ThinkTagContent {
  content: string;
  startIndex: number;
  endIndex: number;
}


class PromptsChecker {

  // try to remove `tool` prompt when the previous prompt is not assistant
  // try to interleave the user/assistant messages in the message sequence for
  // deepseek-reasoner
  static run(
    prompts: OaiPrompt[], 
    bot?: AiBot
  ) {
    this._removeTool(prompts)
    if(bot && AiHelper.isReasoningBot(bot)) {
      this._interleaveUserAssistant(prompts)
      this._constraintPromptsNum(prompts)
      this._ensureFirstPromptIsUser(prompts)
    }
  }

  /**
   * Handle error: BadRequestError: 400 deepseek-reasoner does not support 
   * successive user or assistant messages (messages[9] and messages[10] in your input). 
   * You should interleave the user/assistant messages in the message sequence.
   */
  private static _interleaveUserAssistant(prompts: OaiPrompt[]) {
    for(let i=0; i<prompts.length-1; i++) {
      const currentOne = prompts[i]
      const nextOne = prompts[i+1]
      const currentRole = currentOne.role
      const nextRole = nextOne.role

      const twoUserPrompts = Boolean(currentRole === "user" && nextRole === "user")
      const twoAssistantPrompts = Boolean(currentRole === "assistant" && nextRole === "assistant")
      
      if(twoUserPrompts || twoAssistantPrompts) {
        const mergedContent = this._mergeTwoPrompts(currentOne, nextOne)
        if(mergedContent) {
          currentOne.content = mergedContent
          if(currentRole === "assistant") {
            delete currentOne.name
          }
          prompts.splice(i+1, 1)
        }
        else {
          prompts.splice(i, 1)
        }
        i--
      }
    }
  }

  private static _mergeTwoPrompts(currentOne: OaiPrompt, nextOne: OaiPrompt) {
    const currentContent = currentOne.content
    const nextContent = nextOne.content
    if(typeof currentContent !== "string") return
    if(typeof nextContent !== "string") return
    const newContent = `${currentContent}\n\n${nextContent}`
    return newContent
  }

  private static _removeTool(prompts: OaiPrompt[]) {
    if(prompts.length < 3) return
    const firstPrompt = prompts[0]
    const secondPrompt = prompts[1]
    if(firstPrompt.role === "system") {
      if(secondPrompt.role === "tool" && secondPrompt.tool_call_id) {
        prompts.splice(1, 1)
      }
      return
    }

    if(firstPrompt.role === "tool" && firstPrompt.tool_call_id) {
      prompts.splice(0, 1)
    }
  }

  // clip prompts to avoid Request timed out
  private static _constraintPromptsNum(
    prompts: OaiPrompt[],
    maxNum = 8,    // including system prompt
  ) {
    if(prompts.length <= maxNum) return

    for(let i=0; i<prompts.length-1; i++) {
      if(prompts.length <= maxNum) break
      const currentOne = prompts[i]
      const role = currentOne.role
      if(role === "system") continue
      prompts.splice(i, 1)
      i--
    }
  }

  private static _ensureFirstPromptIsUser(prompts: OaiPrompt[]) {
    for(let i=0; i<prompts.length; i++) {
      const v = prompts[i]
      const role = v.role
      if(role === "system" && i === 0) continue
      if(role === "user") return
      prompts.splice(i, 1)
      i--
    }
  }

}


class AiHelper {

  static async getMyAiRoom(
    entry: AiEntry,
    botUserWannaAdd?: AiBot,
  ) {
    // 1. get room
    const userId = entry.user._id
    const rCol = db.collection("AiRoom")
    const res1 = await rCol.where({ owner: userId }).getOne<Table_AiRoom>()
    const room = res1.data
    if(room) return room
  
    // 2.1 get available characters
    const b2 = getBasicStampWhileAdding()
    const characters = this.fillCharacters()

    // 2.2 try to add bot user wants
    if(botUserWannaAdd) {
      const c2_2 = botUserWannaAdd.character
      const canAdd = this.isCharacterAvailable(botUserWannaAdd.character)
      if(canAdd && !characters.includes(c2_2)) {
        characters.splice(0, 1, c2_2)
      }
    }

    // 3. to create
    const room2: Partial_Id<Table_AiRoom> = {
      ...b2,
      owner: userId,
      characters,
    }
    const res2 = await rCol.add(room2)
    const roomId = getDocAddId(res2)
    if(!roomId) {
      console.warn("cannot get roomId while creating ai room error")
      console.log(res2)
      console.log("entry: ")
      console.log(entry)
      return
    }
    LogHelper.add(characters, entry.user)
  
    // 3. return room
    const newRoom: Table_AiRoom = { _id: roomId, ...room2 }
    return newRoom
  }

  private static fillCharacters() {
    const all_characters = this.getAvailableCharacters()
    if(all_characters.length <= MAX_CHARACTERS) {
      return all_characters
    }
    const copied_characters = [...all_characters].splice(0, MAX_CHARACTERS)

    let tryTimes = 0
    const my_characters: AiCharacter[] = []
    for(let i=0; i<MAX_CHARACTERS; i++) {
      // 1. to avoid dead loop
      tryTimes++
      if(tryTimes > 10) break

      // 2. get a random character
      const r = Math.floor(Math.random() * all_characters.length)
      const c = all_characters[r]

      // 3. to skip a bot taking a rest
      if(charactersTakingARest.includes(c)) {
        i--
        continue
      }

      my_characters.push(c)
      all_characters.splice(r, 1)
    }

    // return copied characters if my_characters is empty
    if(my_characters.length < 1) {
      return copied_characters
    }

    return my_characters
  }

  static getApiEndpointFromBot(bot: AiBot): AiApiEndpoint | undefined {
    const _env = process.env
    const p = bot.provider
    const p2 = bot.secondaryProvider

    let apiKey: string | undefined
    let baseURL: string | undefined
    let defaultHeaders = bot.metaData?.defaultHeaders

    // If secondaryProvider exists, use it first
    if(p2 === "siliconflow") {
      apiKey = _env.LIU_SILICONFLOW_API_KEY
      baseURL = _env.LIU_SILICONFLOW_BASE_URL
    }
    else if(p2 === "gitee-ai") {
      apiKey = _env.LIU_GITEE_AI_API_KEY
      baseURL = _env.LIU_GITEE_AI_BASE_URL
    }
    else if(p2 === "qiniu") {
      apiKey = _env.LIU_QINIU_LLM_API_KEY
      baseURL = _env.LIU_QINIU_LLM_BASE_URL
    }
    else if(p2 === "tencent-lkeap") {
      apiKey = _env.LIU_TENCENT_LKEAP_API_KEY
      baseURL = _env.LIU_TENCENT_LKEAP_BASE_URL
    }
    else if(p === "baichuan") {
      apiKey = _env.LIU_BAICHUAN_API_KEY
      baseURL = _env.LIU_BAICHUAN_BASE_URL
    }
    else if(p === "deepseek") {
      apiKey = _env.LIU_DEEPSEEK_API_KEY
      baseURL = _env.LIU_DEEPSEEK_BASE_URL
    }
    else if(p === "minimax") {
      apiKey = _env.LIU_MINIMAX_API_KEY
      baseURL = _env.LIU_MINIMAX_BASE_URL
    }
    else if(p === "moonshot") {
      apiKey = _env.LIU_MOONSHOT_API_KEY
      baseURL = _env.LIU_MOONSHOT_BASE_URL
    }
    else if(p === "stepfun") {
      apiKey = _env.LIU_STEPFUN_API_KEY
      baseURL = _env.LIU_STEPFUN_BASE_URL
    }
    else if(p === "zero-one") {
      apiKey = _env.LIU_YI_API_KEY
      baseURL = _env.LIU_YI_BASE_URL
    }
    else if(p === "zhipu") {
      apiKey = _env.LIU_ZHIPU_API_KEY
      baseURL = _env.LIU_ZHIPU_BASE_URL
    }
    
    if(apiKey && baseURL) {
      return { apiKey, baseURL, defaultHeaders }
    }
  }

  private static getAvailableCharacters() {
    const bots = AiHelper.getAvailableBots()
    const characters = bots.map(v => v.character)
    return characters
  }

  static getAvailableBots() {
    const bots: AiBot[] = []
    for(let i=0; i<aiBots.length; i++) {
      const bot = aiBots[i]
      const existedBot = bots.find(v => v.character === bot.character)
      if(existedBot) continue
      const apiData = this.getApiEndpointFromBot(bot)
      if(apiData) {
        bots.push(bot)
      }
    }
    return bots
  }

  static async addChat(data: Partial_Id<Table_AiChat>) {
    const col = db.collection("AiChat")
    const res1 = await col.add(data)
    const chatId = getDocAddId(res1)
    if(!chatId) {
      console.warn("cannot get chatId while adding chat error")
      console.log(res1)
      console.log("data: ")
      console.log(data)
      return
    }
    return chatId
  }

  static async addUserMsg(
    entry: AiEntry,
    roomId: string,
  ) {
    const userId = entry.user._id
    const { 
      msg_type,
      text, 
      image_url,
      audio_url,
      audio_base64,
      wx_gzh_openid,
      wx_media_id,
      wx_media_id_16k,
    } = entry
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      sortStamp: b1.insertedStamp,
      roomId,
      infoType: "user",
      msgType: msg_type,
      text,
      imageUrl: image_url,
      audioUrl: audio_url,
      audioBase64: audio_base64,
      wxMediaId: wx_media_id,
      wxMediaId16K: wx_media_id_16k,
      userId,
    }
    if(wx_gzh_openid) {
      data1.channel = "wx_gzh"
    }

    const chatId = await this.addChat(data1)
    return chatId
  }

  static async addAssistantMsg(
    param: AiHelperAssistantMsgParam,
  ) {
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      sortStamp: b1.insertedStamp,
      roomId: param.roomId,
      infoType: param.funcName ? "tool_use" : "assistant",
      text: param.text,
      reasoning_content: param.reasoning_content,
      model: param.model,
      character: param.character,
      usage: param.usage,
      requestId: param.requestId,
      baseUrl: param.baseUrl,
      funcName: param.funcName,
      funcJson: param.funcJson,
      tool_calls: param.tool_calls,
      finish_reason: param.finish_reason,
      webSearchProvider: param.webSearchProvider,
      webSearchData: param.webSearchData,
      drawPictureUrl: param.drawPictureUrl,
      drawPictureModel: param.drawPictureModel,
      drawPictureData: param.drawPictureData,
    }
    const chatId = await this.addChat(data1)
    return chatId
  }

  static async getLatestChat(
    roomId: string,
    limit: number = 50,
  ): Promise<Table_AiChat[]> {
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("sortStamp", "desc")
    const res1 = await q1.limit(limit).get<Table_AiChat>()
    const results = res1.data
    const chats: Table_AiChat[] = []
    let imageNum = 0

    for(let i=0; i<results.length; i++) {
      const v = results[i]
      if(v.infoType === "clear") {
        break
      }

      // turn image to [image]
      if(v.msgType === "image") {
        imageNum++

        if(imageNum > 3 || i > INDEX_TO_PRESERVE_IMAGES) {
          v.msgType = "text"
          v.text = "[image]"
          delete v.imageUrl
        }
      }

      chats.push(v)
    }

    return chats
  }

  static calculateTextToken(text: string) {
    let token = 0
    for(let i=0; i<text.length; i++) {
      const char = text[i]
      if(valTool.isLatinChar(char)) {
        token += 0.4
      }
      else {
        token += 1
      }
    }
    return token
  }

  static calculateChatToken(
    chat: Table_AiChat,
  ) {
    const { 
      infoType, 
      usage, 
      text, 
      imageUrl,
    } = chat
    if(infoType === "assistant" || infoType === "summary") {
      const token1 = usage?.completion_tokens
      if(token1) return token1
    }

    let token = 0
    if(text) {
      token = this.calculateTextToken(text)
    }
    else if(imageUrl) {
      token += 600
    }
    
    if(infoType === "tool_use") {
      const toolToken1 = usage?.completion_tokens ?? 0
      let toolToken2 = 0
      if(chat.funcName) {
        toolToken2 += this.calculateTextToken(chat.funcName)
      }
      if(chat.funcJson) {
        const jsonStr = valTool.objToStr(chat.funcJson)
        toolToken2 += this.calculateTextToken(jsonStr)
      }
      toolToken2 += 10
      token += Math.max(toolToken1, toolToken2)
    }

    return token
  }

  // @param bot is required if isContinueCommand is true
  static async canReply(
    aiParam: AiRunParam,
    bot?: AiBot,
  ) {
    if(bot && this.isReasoningBot(bot)) {
      return true
    }

    const { room, chatId, isContinueCommand } = aiParam
    const roomId = room._id
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("sortStamp", "desc")
    const res1 = await q1.limit(10).get<Table_AiChat>()
    const chats = res1.data

    let res = false
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      const { infoType } = v

      if(isContinueCommand) {
        if(!bot) break
        if(bot.character === v.character) {
          if(v.finish_reason === "stop") break
          res = true
          break
        }
        continue
      }

      if(infoType === "user") {
        res = v._id === chatId
        break
      }
      if(infoType === "clear") {
        break
      }
    }
    return res
  }

  static isCharacterAvailable(c: AiCharacter) {
    const _env = process.env

    if(c === "baixiaoying") {
      if(_env.LIU_BAICHUAN_API_KEY && _env.LIU_BAICHUAN_BASE_URL) {
        return true
      }
      return false
    }
    if(c === "deepseek") {
      if(_env.LIU_DEEPSEEK_API_KEY && _env.LIU_DEEPSEEK_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "ds-reasoner") {
      if(_env.LIU_DEEPSEEK_API_KEY && _env.LIU_DEEPSEEK_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "hailuo") {
      if(_env.LIU_MINIMAX_API_KEY && _env.LIU_MINIMAX_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "kimi") {
      if(_env.LIU_MOONSHOT_API_KEY && _env.LIU_MOONSHOT_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "wanzhi") {
      if(_env.LIU_YI_API_KEY && _env.LIU_YI_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "yuewen") {
      if(_env.LIU_STEPFUN_API_KEY && _env.LIU_STEPFUN_BASE_URL) {
        return true
      }
      return false
    }
    else if(c === "zhipu") {
      if(_env.LIU_ZHIPU_API_KEY && _env.LIU_ZHIPU_BASE_URL) {
        return true
      }
      return false
    }
    return false
  }

  // 调用完工具后，将返回结果返回 LLM 时，若当前模型不支持 tool_use
  // 对返回结果进行转换
  static turnToolCallsIntoNormalPrompts(
    tool_calls: OaiToolCall[],
    tool_call_id: string,
    toolResultText: string,
    t: T_I18N,
    assistantName?: string,
  ): OaiPrompt[] {
    const theTool = tool_calls.find(v => v.id === tool_call_id)
    if(!theTool) return []

    const theFunc = theTool["function"]
    if(!theFunc) return []
    const funcName = theFunc.name
    const funcArgs = theFunc.arguments || "{}"
    const msg = t("bot_call_tools", { funcName, funcArgs })

    const prompts: OaiPrompt[] = [
      {
        role: "assistant",
        content: msg,
        name: assistantName,
      },
      {
        role: "user",
        content: toolResultText,
      }
    ]
    return prompts
  }

  static getMaxToken(
    totalToken: number,
    firstChat: Table_AiChat,
    bot: AiBot,
  ) {
    const restToken = (bot.maxWindowTokenK * 1000) - totalToken

    // 1. set maxTokens to double firstChat token
    const firstToken = this.calculateChatToken(firstChat)
    let maxTokens = firstToken * 2
    if(maxTokens < 280) maxTokens = 280

    // 2. adapt to wechat max characters limit
    if(maxTokens > MAX_WX_TOKEN) maxTokens = MAX_WX_TOKEN

    // 3. for reasoning model with thinkingInContent
    const isReasoning = this.isReasoningBot(bot)
    if(isReasoning) {
      if(maxTokens < MIN_REASONING_TOKENS) {
        maxTokens = MIN_REASONING_TOKENS
      }
    }

    // 4. set maxTokens to restToken if exceed
    if(maxTokens > restToken) maxTokens = restToken

    // console.log("maxTokens: ", maxTokens)

    return maxTokens
  }

  static addQuotaForUser(entry: AiEntry) {
    // 1. add
    const user = entry.user
    const userId = user._id
    const quota = user.quota ?? { aiConversationCount: 0 }
    quota.aiConversationCount += 1
    if(entry.wx_gzh_openid) {
      quota.lastWxGzhChatStamp = getNowStamp()
    }

    // 2. update
    const now2 = getNowStamp()
    const u2: Partial<Table_User> = {
      quota,
      activeStamp: now2,
      updatedStamp: now2,
    }
    const uCol = db.collection("User")
    uCol.doc(userId).update(u2)
    
    return quota.aiConversationCount
  }

  static getContentFromLLM(
    res: OaiChatCompletion,
    bot?: AiBot,
  ) {
    // 1. check out params
    const choices = res?.choices
    if(!choices || choices.length < 1) {
      console.warn("no choices in getContentFromLLM")
      console.log(res)
      return {}
    }

    const theChoice = choices[0]
    if(!theChoice) {
      console.warn("no choice in getContentFromLLM")
      console.log(choices)
      return {}
    }
    const message = theChoice.message as DsReasonerMessage
    if(!message) {
      console.warn("no message in getContentFromLLM")
      console.log(choices)
      return {}
    }

    // 2. get original content & reasoning_content
    let content = message.content ?? ""
    let reasoning_content = message.reasoning_content ?? ""
    if(!content) {
      if(!reasoning_content) {
        console.warn("no content and reasoning_content in getContentFromLLM")
        return {}
      }
      this.setFinishReasonToLength(res)
    }

    // 3. remove "?" in the beginning for zhipu
    if(bot?.character === "zhipu") {
      let err1 = content.startsWith("？")
      if(err1) content = content.substring(1)
    }

    
    // 4. handle reasoning_content if needed
    let isReasoning = Boolean(bot && this.isReasoningBot(bot))
    if(!reasoning_content && isReasoning) {
      const res4 = this._handleContentForReasoning(
        res,
        bot as AiBot,
        content,
        reasoning_content,
      )
      content = res4.content
      reasoning_content = res4.reasoning_content
    }

    // 5. finally trim
    content = content.trim()
    reasoning_content = reasoning_content.trim()

    // console.warn("let me see content and reasoning_content: ")
    // console.log("reasoning_content: ", reasoning_content)
    // console.log("content: ", content)

    return { content, reasoning_content }
  }

  private static _handleContentForReasoning(
    res: OaiChatCompletion,
    bot: AiBot,
    content: string,
    reasoning_content: string,
  ) {

    // 1. extract <think>......</think>
    const thinkContents = this.extractThinkContent(content)
    if(thinkContents.length > 0) {
      const thinkContent = thinkContents[0]
      content = content.substring(thinkContent.endIndex)
      reasoning_content = thinkContent.content
      return { content, reasoning_content }
    }
    
    // 2. starts with <think>
    if(content.startsWith("<think>")) {
      reasoning_content = content.substring(7)
      content = ""
      this.setFinishReasonToLength(res)
      return { content, reasoning_content }
    }
    
    // 3. starts with "好的，" /  "嗯，" / "好，"
    const thinkingInContent = bot.metaData?.thinkingInContent
    const finishReason = this.getFinishReason(res)
    const mightHaveReasoningContent = Boolean(finishReason === "length" && !thinkingInContent)
    if(mightHaveReasoningContent) {
      const alrightList = ["Alright, ", "好的，", "嗯，", "好，"]
      const res3 = alrightList.some(x => content.startsWith(x))
      console.log("Alright: ", res3)
      if(res3) {
        reasoning_content = content
        content = ""
      }
    }

    return { content, reasoning_content }
  }


  static getFinishReason(
    chatCompletion: OaiChatCompletion
  ): AiFinishReason | undefined {
    const reason = chatCompletion.choices?.[0]?.finish_reason
    if(reason === "stop" || reason === "length") return reason
  }

  static setFinishReasonToLength(
    chatCompletion: OaiChatCompletion,
  ) {
    const theChoice = chatCompletion?.choices?.[0]
    if(!theChoice) return
    if(theChoice.finish_reason === "stop") {
      theChoice.finish_reason = "length"
    }
  }

  static getKickCharacters(
    characters: AiCharacter[],
    results: AiRunResults,
  ) {
    const cLength = characters.length
    if(cLength < 2) return []

    const kickList: AiCharacter[] = []
    const successList: AiCharacter[] = []

    // 1. add failed characters to kickList first
    characters.forEach(v => {
      const r = results.find(v2 => v2?.character === v)
      if(!r) kickList.push(v)
      else if(r.replyStatus === "has_new_msg") kickList.push(v)
      else successList.push(v)
    })

    // 2. and then add successful characters
    kickList.push(...successList)

    return kickList
  }

  static getAddedCharacters(
    characters: AiCharacter[],
    results: AiRunResults,
  ) {
    const cLength = characters.length
    if(cLength >= MAX_CHARACTERS) return []
    
    // 1. get available characters
    const availableCharacters = this.getAvailableCharacters()
    for(let i=0; i<availableCharacters.length; i++) {
      const v = availableCharacters[i]
      if(characters.includes(v)) {
        availableCharacters.splice(i, 1)
        i--
      }
      else if(charactersTakingARest.includes(v)) {
        availableCharacters.splice(i, 1)
        i--
      }
    }
    if(availableCharacters.length <= 2) {
      return availableCharacters
    }

    // 2. select characters
    const selectNum = cLength >= (MAX_CHARACTERS - 1) ? 2 : 3
    const addedList: AiCharacter[] = []
    for(let i=0; i<selectNum; i++) {
      const aLength = availableCharacters.length
      if(aLength <= 1) {
        addedList.push(...availableCharacters)
        break
      }
      const r = Math.floor(Math.random() * aLength)
      const c = availableCharacters[r]
      addedList.push(c)
      availableCharacters.splice(r, 1)
    }

    return addedList
  }

  // only return chats when compression (turn images into text) succeeds
  static compressChatsForImages(chats: Table_AiChat[]) {
    if(chats.length < 1) return []

    // 1. check if we can compress
    let canCompress = true
    let firstAssistantIdx = -1
    let firstPhotoIdx = -1
    const cLength = chats.length
    const maxIndex1 = Math.min(cLength, 2)
    const maxIndex2 = Math.min(cLength, 5)
    for(let i=0; i<maxIndex2; i++) {
      const v = chats[i]
      const { msgType, imageUrl, infoType } = v

      // 1.2 if index is less than 2 and there is any image among the first 2 items
      // then we can't compress
      if(i < maxIndex1) {
        if(msgType === "image" || imageUrl) {
          canCompress = false
          break
        }
      }

      if(infoType === "assistant" && firstAssistantIdx < 0) {
        firstAssistantIdx = i
      }
      else if(infoType === "tool_use" && firstAssistantIdx < 0) {
        firstAssistantIdx = i
      }

      if((msgType === "image" || imageUrl) && firstPhotoIdx < 0) {
        firstPhotoIdx = i
      }
    }
    if(!canCompress) return

    // 2. if there is any photo in the first 5 messages
    if(firstPhotoIdx >= 0) {
      // 2.1 we cannot compress if there is no assistant message
      if(firstAssistantIdx < 0) return
      // 2.2 we cannot compress if the assistant message is after the first photo
      if(firstAssistantIdx > firstPhotoIdx) return
    }

    // 3. turn all images into text
    const newChats = chats.map(v => {
      const { msgType, imageUrl } = v
      if(msgType === "image" || imageUrl) {
        v.msgType = "text"
        v.text = "[image]"
        delete v.imageUrl
      }
      return v
    })
    return newChats
  }


  static needImageToTextAbility(
    chats: Table_AiChat[],
  ) {
    let need = false
    for(let i=0; i<chats.length; i++) {
      const chat = chats[i]
      if(chat.msgType === "image") {
        need = true
        break
      }
    }
    return need
  }

  static removeOneTool(funcName: string, tools: OaiTool[]) {
    for(let i=0; i<tools.length; i++) {
      const v = tools[i]
      if(v.type === "function" && v.function?.name === funcName) {
        tools.splice(i, 1)
        break
      }
    }
  }

  static getCharacterName(character?: AiCharacter) {
    if(!character) return
    let name = ""
    const bot = aiBots.find(v => v.character === character)
    if(bot) name = bot.name
    return name
  }

  static getBotsForCharacter(character: AiCharacter) {
    const bots = aiBots.filter(v => v.character === character)
    return bots
  }

  static async updateAiChat(id: string, data: Partial<Table_AiChat>) {
    if(!data.updatedStamp) data.updatedStamp = getNowStamp()
    const cCol = db.collection("AiChat")
    const res = await cCol.doc(id).update(data)
    return res
  }

  static async getNonUsedCharacters(roomId: string) {
    // 1. get history
    const chats = await this.getLatestChat(roomId, 10)
    const everExistedCharacters: AiCharacter[] = []
    chats.forEach(v => {
      const c = v.character
      if(everExistedCharacters.length > 2) return
      if(c && !everExistedCharacters.includes(c)) {
        everExistedCharacters.push(c)
      }
    })

    // 2. get availableCharacters
    const availableCharacters = this.getAvailableCharacters()
    for(let i=0; i<availableCharacters.length; i++) {
      const v = availableCharacters[i]
      if(everExistedCharacters.includes(v)) {
        availableCharacters.splice(i, 1)
        i--
      }
    }
    if(availableCharacters.length < 1) {
      return []
    }

    // 3. randomly sort
    const addedList: AiCharacter[] = []
    while(addedList.length < 5 && availableCharacters.length > 0) {
      const r = Math.floor(Math.random() * availableCharacters.length)
      const c = availableCharacters[r]
      addedList.push(c)
      availableCharacters.splice(r, 1)
    }

    return addedList
  }

  static async checkIfNobodyHere(
    entry: AiEntry, 
    room: Table_AiRoom,
  ) {
    // 1. return false if there is at least one character
    const len = room.characters.length
    if(len >= 1) return false

    // 2. get history for ever existed characters
    const addedList = await this.getNonUsedCharacters(room._id)
    const len2 = addedList.length
    if(len2 < 1) return false
    if(len2 > 3) {
      addedList.splice(3, len2 - 3)
    }

    // 3. menu
    const menuList: AiMenuItem[] = []
    addedList.forEach(v => menuList.push({ operation: "add", character: v }))
    const { t } = useI18n(aiLang, { user: entry.user })
    const prefixMessage = t("nobody_here") + "\n\n" + t("operation_title")
    TellUser.menu(entry, prefixMessage, menuList, "")
    return true
  }

  static getGzhType() {
    const _env = process.env
    return _env.LIU_WX_GZ_TYPE ?? "subscription_account"
  }

  static extractThinkContent(text: string): ThinkTagContent[] {
    const regex = /<think>([\s\S]*?)<\/think>/g;
    const results: ThinkTagContent[] = []
    
    let match: RegExpExecArray | null
    let tryTimes = 0
    while ((match = regex.exec(text)) !== null && tryTimes < 10) {
      results.push({
        content: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
      tryTimes++
    }
    
    return results
  }

  static isReasoningBot(bot: AiBot) {
    return bot.abilities.includes("reasoning")
  }

  static getProviderName(bot: AiBot) {
    const { secondaryProvider, provider } = bot
    if(secondaryProvider === "siliconflow") return "北京硅基流动"
    if(secondaryProvider === "gitee-ai") return "Gitee AI"
    if(secondaryProvider === "qiniu") return "七牛云"
    if(secondaryProvider === "tencent-lkeap") return "腾讯云"
    if(provider === "baichuan") return "北京百川智能"
    if(provider === "deepseek") return "杭州深度求索"
    if(provider === "minimax") return "上海稀宇科技"
    if(provider === "moonshot") return "北京月之暗面"
    if(provider === "stepfun") return "上海阶跃星辰"
    if(provider === "zero-one") return "北京零一万物"
    if(provider === "zhipu") return "北京智谱华章"
  }
  

}


class ChatIntoPrompter {

  private _user: Table_User
  private _canUseTool: boolean
  private _canInputAudio: boolean
  private _opt?: TurnChatsIntoPromptOpt

  constructor(user: Table_User, opt?: TurnChatsIntoPromptOpt) {
    this._user = user

    const abilities = opt?.abilities ?? ["chat"]
    this._opt = opt
    this._canUseTool = abilities.includes("tool_use")
    this._canInputAudio = abilities.includes("input_audio")
  }

  run(
    chats: Table_AiChat[],
  ) {
    const _this = this
    const messages: OaiPrompt[] = []
    const opt = _this._opt
    const cLength = chats.length
    
    for(let i=0; i<cLength; i++) {
      const v = chats[i]

      if(v.infoType === "user") {
        const userPrompt = _this.turnForUser(v, i)
        if(userPrompt) messages.push(userPrompt)
      }
      else if(v.infoType === "assistant") {
        const assistantPrompt = _this.turnForAssistant(v, i)
        if(assistantPrompt) messages.push(assistantPrompt)
      }
      else if(v.infoType === "summary") {
        if(!v.text) continue
        const summary = `【前方对话摘要】\n${v.text}`
        messages.push({
          role: opt?.metaData?.onlyOneSystemRoleMsg ? "user" : "system",
          content: summary,
        })
      }
      else if(v.infoType === "background") {
        if(!v.text) continue
        const background = `【背景信息】\n${v.text}`
        messages.push({
          role: opt?.metaData?.onlyOneSystemRoleMsg ? "user" : "system",
          content: background,
        })
      }
      else if(v.infoType === "tool_use") {
        const toolMsgs = _this.turnForToolUse(v)
        if(toolMsgs) messages.push(...toolMsgs)
      }
    }

    return messages
  }

  private turnForToolUse(v: Table_AiChat) {
    const { tool_calls } = v
    if(!tool_calls) return
    const tool_call_id = tool_calls[0]?.id
    if(!tool_call_id) return
    const user = this._user
    const { t } = useI18n(aiLang, { user })
    const canUseTool = this._canUseTool

    // 1. add tool_call_result prompt 
    // where the role is "tool" and  tool_call_id is attached
    const toolMsg = this._getToolMsg(tool_call_id, t, v)

    // 2. if we can use tool
    if(canUseTool && toolMsg) {
      const msg2 = this._getAssistantMsgWithToolMsg(tool_calls, v)
      return [toolMsg, msg2]
    }

    // 3. otherwise, turn the tool_call_result prompt into a user prompt
    let tmpPrompts: OaiPrompt[] = []
    if(toolMsg) {
      const tmpToolMsg = valTool.objToStr(toolMsg)
      const tmpUserContent = t("result_of_tool", { msg: tmpToolMsg })
      const tmpUserPrompt: OaiPrompt = {
        role: "user",
        content: tmpUserContent,
      }
      tmpPrompts.push(tmpUserPrompt)
    }

    const msg3 = this._turnToolCallIntoNormalAssistantMsg(t, v)
    if(msg3) tmpPrompts.push(msg3)
    return tmpPrompts
  }


  private _turnToolCallIntoNormalAssistantMsg(
    t: T_I18N,
    v: Table_AiChat,
  ) {
    // 1. get params
    const { funcName, funcJson, character } = v
    if(!funcName) return
    
    // 2. change prompt if funcName is draw_picture
    // just because text field storages the translated prompt
    if(funcName === "draw_picture" && v.text && funcJson) {
      funcJson.prompt = v.text
    }

    // 3. handle content
    const funcArgs = funcJson ? valTool.objToStr(funcJson) : "{}"
    const msg = t("bot_call_tools", { funcName, funcArgs })
    const assistantName = AiHelper.getCharacterName(character)
    const assistantMsg: OaiPrompt = {
      role: "assistant",
      content: msg,
      name: assistantName,
    }
    return assistantMsg
  }

  private _getAssistantMsgWithToolMsg(
    tool_calls: OaiToolCall[],
    v: Table_AiChat,
  ) {
    const { character, funcName, text } = v
    const assistantName = AiHelper.getCharacterName(character)
    let msg: OaiPrompt = {
      role: "assistant",
      tool_calls,
      name: assistantName,
    }

    if(funcName === "draw_picture" && text) {
      const aToolCall = tool_calls[0]
      if(!aToolCall) return msg
      const theFunc = aToolCall["function"]
      if(!theFunc) return msg
      const drawArgsStr = theFunc["arguments"]
      if(!drawArgsStr) return msg
      const drawArgs = valTool.strToObj(drawArgsStr)
      drawArgs.prompt = text
      const drawArgsStr2 = valTool.objToStr(drawArgs)
      theFunc["arguments"] = drawArgsStr2
    }

    return msg
  }


  private _getToolMsg(
    tool_call_id: string,
    t: T_I18N,
    v: Table_AiChat,
  ) {
    const { funcName, contentId } = v

    let toolMsg: OaiToolPrompt | undefined
    if (funcName === "add_note") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_note"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_todo") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_todo"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if (funcName === "add_calendar") {
      if (contentId) {
        toolMsg = { role: "tool", content: t("added_calendar"), tool_call_id }
      }
      else {
        toolMsg = { role: "tool", content: t("not_agree_yet"), tool_call_id }
      }
    }
    else if(funcName === "web_search") {
      if(v.text && v.webSearchData && v.webSearchProvider) {
        toolMsg = { role: "tool", content: v.text, tool_call_id }
      }
    }
    else if(funcName === "draw_picture") {
      if(v.text && v.drawPictureUrl) {
        toolMsg = { 
          role: "tool", 
          content: `[Finish to draw]`, 
          tool_call_id,
        }
      }
    }
    else if(funcName === "get_cards") {
      if(v.text) {
        toolMsg = {
          role: "tool",
          content: v.text,
          tool_call_id,
        }
      }
    }
    else if(funcName === "get_schedule") {
      if(v.text) {
        toolMsg = {
          role: "tool",
          content: v.text,
          tool_call_id,
        }
      }
    }

    return toolMsg
  }

  private turnForAssistant(
    v: Table_AiChat,
    index: number,
  ): OaiPrompt | undefined {
    const { 
      text, 
      reasoning_content, 
      character,
      finish_reason,
    } = v
    const isContinue = this._opt?.isContinueCommand
    const assistantName = AiHelper.getCharacterName(character)

    let content = ""
    if(isContinue && index < 3 && reasoning_content && finish_reason === "length") {
      const hasThink = reasoning_content.startsWith("<think>")
      if(hasThink) content = reasoning_content
      else content = `<think>${reasoning_content}</think>`
      if(text) {
        content += `\n${text}`
      }
    }
    else if(text) {
      content = text
    }
    else if(reasoning_content) {
      const hasThink = reasoning_content.startsWith("<think>")
      if(hasThink) content = reasoning_content
      else content = `<think>${reasoning_content}`
    }
    
    if(!content) return

    return {
      role: "assistant",
      content,
      name: assistantName,
    }
  }

  private turnForUser(
    v: Table_AiChat,
    index: number,
  ): OaiPrompt | undefined {
    const {
      text, 
      imageUrl,
      audioBase64,
      msgType,
    } = v
    const canInputAudio = this._canInputAudio
    const c = this._opt?.character

    if(imageUrl) {
      return {
        role: "user",
        content: [{ type: "image_url", image_url: { url: imageUrl } }]
      }
    }
    if(msgType === "voice" && audioBase64 && canInputAudio) {
      const audioPrompt: OaiPrompt = {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: audioBase64,
              format: "mp3",
            }
          }
        ]
      }
      if(!c) return audioPrompt
      if(c === "hailuo" && index === 0) {
        return audioPrompt
      }
    }

    if(text) {
      return {
        role: "user",
        content: text,
      }
    }

  }

}


class UserHelper {

  static async checkQuota(
    entry: AiEntry,
  ) {
    const user = entry.user
    const quota = user.quota
    if(!quota) return true

    const count = quota.aiConversationCount
    const isSubscribed = checkIfUserSubscribed(user)
    const MAX_TIMES = isSubscribed ? MAX_TIMES_MEMBERSHIP : MAX_TIMES_FREE

    const available = count < MAX_TIMES
    if(!available) {
      if(MAX_TIMES === MAX_TIMES_FREE) {
        this.sendQuotaWarning(entry)
      }
      else {
        this.sendQuotaWarning2(entry)
      }
    }
    return available
  }

  static async sendQuotaWarning2(entry: AiEntry) {
    // 1. get payment link
    const paymentLink = await this._getPaymentLink(entry)
    if(!paymentLink) return
    
    // 2. send
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    let msg = t("quota_warning_2", { 
      membershipTimes: MAX_TIMES_MEMBERSHIP,
      link: paymentLink,
    })

    TellUser.text(entry, msg)
  }

  static async sendQuotaWarning(entry: AiEntry) {
    // 1. get payment link
    const _env = process.env
    const paymentLink = await this._getPaymentLink(entry)
    if(!paymentLink) return

    // 2. i18n
    const { user } = entry
    const { t } = useI18n(aiLang, { user })
    let msg = t("quota_warning", { 
      freeTimes: MAX_TIMES_FREE,
      membershipTimes: MAX_TIMES_MEMBERSHIP,
      link: paymentLink,
    })
    msg += "\n\n"
    msg += t("see_question_box")

    // 3. tell user
    TellUser.text(entry, msg)
  }

  private static async _getPaymentLink(entry: AiEntry) {
    // 1. check out domain
    const domain = getLiuDoman()

    // 2. get my order
    const order = await this._createOrderForQuota(entry)
    if(!order) return

    // 3. get payment link
    const orderId = order.order_id
    const paymentLink = `${domain}/payment/${orderId}`
    return paymentLink
  }

  private static async _createOrderForQuota(entry: AiEntry) {
    // 1. get param
    const { user, wx_gzh_openid } = entry
    const userId = user._id
    const stamp1 = getNowStamp() + MIN_3
    
    // 2. get existed order
    const oCol = db.collection("Order")
    const w2: Record<string, any> = {
      user_id: userId,
      oState: "OK",
      orderStatus: "INIT",
      orderType: "subscription",
      expireStamp: _.gte(stamp1),
    }
    if(wx_gzh_openid) {
      w2.channel = "wx_gzh"
    }
    const res2 = await oCol.where(w2).getOne<Table_Order>()
    let theOrder = res2.data ?? undefined

    // 3. calculate expireStamp
    if(!theOrder) {
      theOrder = await this._createOrder(entry)
    }

    return theOrder
  }

  private static async _createOrder(entry: AiEntry) {
    // 1. get subscription
    const sCol = db.collection("Subscription")
    const q1 = sCol.where({ isOn: "Y", payment_circle: "monthly" })
    const res1 = await q1.getOne<Table_Subscription>()
    const subPlan = res1.data
    if(!subPlan) return

    // 2. check out amount_CNY
    if(typeof subPlan.amount_CNY !== "number") {
      return
    }

    // 3. create order_id
    const order_id = await createAvailableOrderId()
    if(!order_id) return

    // 4. construct an order
    const { user, wx_gzh_openid } = entry
    const userId = user._id
    const b4 = getBasicStampWhileAdding()
    const data4: Partial_Id<Table_Order> = {
      ...b4,
      user_id: userId,
      order_id,
      oState: "OK",
      orderStatus: "INIT",
      orderType: "subscription",
      orderAmount: subPlan.amount_CNY,
      paidAmount: 0,
      refundedAmount: 0,
      currency: "cny",
      plan_id: subPlan._id,
      expireStamp: getNowStamp() + HOUR_12,
    }
    if(wx_gzh_openid) {
      data4.channel = "wx_gzh"
    }

    // 5. add the order
    const oCol = db.collection("Order")
    const res5 = await oCol.add(data4)
    const id5 = getDocAddId(res5)
    if(!id5) return

    const newOrder: Table_Order = {
      _id: id5,
      ...data4,
    }
    return newOrder
  }

}

class TellUser {

  static async text(
    entry: AiEntry, 
    text: string,
    from?: AiBot,
    fromCharacter?: AiCharacter
  ) {
    const { wx_gzh_openid } = entry

    // 1. send to wx gzh
    if(wx_gzh_openid) {
      // console.warn("markdown: ")
      // console.log(text)
      text = MarkdownParser.mdToWxGzhText(text)
      // console.warn("wx gzh text: ")
      // console.log(text)

      const obj1: Wx_Gzh_Send_Msg = {
        msgtype: "text",
        text: { content: text },
      }
      this._fillWxGzhKf(obj1, from, fromCharacter)
      const res1 = await this._sendToWxGzh(wx_gzh_openid, obj1)
      return res1
    }

  }

  static async image(
    entry: AiEntry,
    imageUrl: string,
    from?: AiBot,
    fromCharacter?: AiCharacter,
  ) {
    const { wx_gzh_openid } = entry

    // 1. send to wx gzh
    if(wx_gzh_openid) {
      const res1 = await WxGzhUploader.mediaByUrl(imageUrl)
      const media_id = res1?.media_id
      if(!media_id) return

      const obj2: Wx_Gzh_Send_Msg = {
        msgtype: "image",
        image: { media_id },
      }
      this._fillWxGzhKf(obj2, from, fromCharacter)
      const res2 = await this._sendToWxGzh(wx_gzh_openid, obj2)
      return res2
    }
  }


  static async menu(
    entry: AiEntry,
    prefixMessage: string,
    menuList: AiMenuItem[],
    suffixMessage: string,
    fromCharacter?: AiCharacter
  ) {
    const _env = process.env
    const gzhType = AiHelper.getGzhType()
    const { wx_gzh_openid, user } = entry
    const { t } = useI18n(aiLang, { user })

    // 1. localize the menuList
    const wx_menu_list: Wx_Gzh_Send_Msgmenu_Item[] = []
    for(let i=0; i<menuList.length; i++) {
      const v = menuList[i]
      const { operation, character } = v

      if(operation === "clear_history") {
        wx_menu_list.push({ id: "clear_history", content: t("clear_context") })
        continue
      }

      if(operation === "kick" && character) {
        const characterName = AiHelper.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "kick_" + character, content: t("kick") + characterName })
      }

      if(operation === "add" && character) {
        const characterName = AiHelper.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "add_" + character, content: t("add") + characterName })
      }

      if(operation === "continue" && character) {
        const botName = AiHelper.getCharacterName(character)
        if(!botName) continue
        wx_menu_list.push({
          id: "continue_" + character,
          content: t("continue_bot", { botName })
        })

        // turn markdown to plain-text for wx gzh
        if(wx_gzh_openid) {
          prefixMessage = MarkdownParser.mdToWxGzhText(prefixMessage)
        }
      }

    }

    // 2. send to wx gzh
    if(wx_gzh_openid) {
      if(gzhType === "subscription_account") {
        console.warn("we cannot send the menu to the user due to subscription_account")
        return
      }

      const obj2: Wx_Gzh_Send_Msgmenu = {
        msgtype: "msgmenu",
        msgmenu: {
          head_content: prefixMessage,
          list: wx_menu_list,
          tail_content: suffixMessage,
        }
      }
      this._fillWxGzhKf(obj2, undefined, fromCharacter)
      const res2 = await this._sendToWxGzh(wx_gzh_openid, obj2)
      return res2
    }
    

  }

  static async typing(entry: AiEntry) {
    const { wx_gzh_openid } = entry

    // 1. to wx gzh
    if(wx_gzh_openid) {
      const wxGzhAccessToken = await checkAndGetWxGzhAccessToken()
      if(!wxGzhAccessToken) return
      WxGzhSender.sendTyping(wx_gzh_openid, wxGzhAccessToken)
    }
  }

  private static _fillWxGzhKf(
    obj: Wx_Gzh_Send_Msg,
    bot?: AiBot,
    character?: AiCharacter,
  ) {
    const kf_account = this._getWxGzhKfAccount(bot, character)
    if(kf_account) {
      obj.customservice = { kf_account }
    }
  }

  private static _getWxGzhKfAccount(
    bot?: AiBot,
    character?: AiCharacter,
  ) {
    let c = bot?.character ?? character
    if(!c) return

    const _env = process.env
    if(c === "baixiaoying") {
      return _env.LIU_WXGZH_KF_BAIXIAOYING
    }
    else if(c === "deepseek") {
      return _env.LIU_WXGZH_KF_DEEPSEEK
    }
    else if(c === "ds-reasoner") {
      return _env.LIU_WXGZH_KF_DS_REASONER
    }
    else if(c === "hailuo") {
      return _env.LIU_WXGZH_KF_HAILUO
    }
    else if(c === "kimi") {
      return _env.LIU_WXGZH_KF_KIMI
    }
    else if(c === "wanzhi") {
      return _env.LIU_WXGZH_KF_WANZHI
    }
    else if(c === "yuewen") {
      return _env.LIU_WXGZH_KF_YUEWEN
    }
    else if(c === "zhipu") {
      return _env.LIU_WXGZH_KF_ZHIPU
    }
  }

  private static async _sendToWxGzh(
    wx_gzh_openid: string,
    obj: Wx_Gzh_Send_Msg,
  ) {
    const accessToken = await checkAndGetWxGzhAccessToken()
    if(!accessToken) return
    const res = await WxGzhSender.sendMessage(wx_gzh_openid, accessToken, obj)
    return res
  }

}

class TransformText {

  static handleFromAssistantChoice(choice: OaiChoice) {
    const finish_reason = choice.finish_reason

    // 1.1 only reserve one tool
    if(finish_reason === "tool_calls") {
      const toolNum = choice.message.tool_calls?.length ?? 0
      if(toolNum > 1) {
        choice.message.tool_calls?.splice(1, toolNum - 1)
        return true
      }
    }

    // 1.2 get text
    if(finish_reason !== "stop") return
    const { message } = choice
    let text = message.content
    if(!text) return
    const originalText = text.trim()

    // 2. for shape 1
    const res2 = this._turnIntoTool_1(choice, originalText)
    if(res2) return true

    // 3. for shape 2
    const res3 = this._turnIntoTool_2(choice, originalText)
    if(res3) return true

    // 4. for shape 3
    const res4 = this._turnIntoTool_3(choice, originalText)
    if(res4) return true

    // 5. remove <assistant></assistant>
    const res5 = this._removeAssistantTag(choice, originalText)
    return res5
  }


  private static _removeAssistantTag(
    choice: OaiChoice,
    text: string,
  ) {
    let hasChanged = false
    const str1 = "<assistant>"
    const str2 = "</assistant>"
    if(text.startsWith(str1)) {
      hasChanged = true
      text = text.substring(str1.length)
      text = text.trimStart()
    }
    if(text.endsWith(str2)) {
      hasChanged = true
      text = text.substring(0, text.length - str2.length)
      text = text.trimEnd()
    }
    if(hasChanged) {
      choice.message.content = text
    }
    return hasChanged
  } 

  private static _fillChoiceWithToolCall(
    choice: OaiChoice, 
    toolName: string,
    toolArgs: string,
  ) {
    const toolCall: OaiToolCall = {
      "type": "function",
      "function": {
        "name": toolName,
        "arguments": toolArgs,
      },
      "id": `call_${createRandom(5)}`,
    }
    choice.message.content = ""
    choice.message.tool_calls = [toolCall]
    choice.finish_reason = "tool_calls"
    return toolCall
  }

  /**
   * change shape like:
   * 
   * function draw_picture
   * ```json
   * {"prompt": "......"}
   * ```
   * 
   * into tool call
   */
  private static _turnIntoTool_3(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. check if the text starts with "function"
    let index1 = -1
    let thePrefix1 = ""
    const prefix1s = ["function ", "function: "]
    for(let i=0; i<prefix1s.length; i++) {
      const v = prefix1s[i]
      index1 = text.indexOf(v)
      if(index1 >= 0) {
        thePrefix1 = v
        break
      }
    }
    if(!thePrefix1) return

    // 2. get toolName
    text = text.substring(index1 + thePrefix1.length).trimStart()
    const tmpList2 = text.split("\n")
    if(!tmpList2 || tmpList2.length < 2) return
    const toolName = tmpList2[0].trim()
    if(!toolName) return
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 3. check if the rest of the text starts with ```json
    tmpList2.shift()
    text = tmpList2.join("\n").trim()
    const prefix3s = ["```json", "```JSON"]
    const thePrefix3 = prefix3s.find(v => text.startsWith(v))
    if(!thePrefix3) return

    // 4. check if the rest of the text ends with ```
    text = text.substring(thePrefix3.length).trimStart()
    if(!text.endsWith("```")) return
    text = text.substring(0, text.length - 3).trimEnd()

    // 5. handle toolArgs
    let toolArgs = ""
    try {
      toolArgs = JSON.stringify(text)
    }
    catch(err) {
      console.warn("_turnIntoTool_3 err when stringify: ")
      console.log(err)
      return
    }

    // 6. let's transform!
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_3: ")
    console.log(toolCall)
    return true
  }

  /**
   * change shape like:
   * 
   * {
   *   "name": "draw_picture",
   *   "parameters": {...}
   * }
   * 
   * into tool call
   */
  private static _turnIntoTool_2(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. start and end with
    const startMatched = text.startsWith("{")
    const endMatched = text.endsWith("}")
    if(!startMatched || !endMatched) return

    // 2. get toolName and tmpArgs
    let toolName = ""
    let tmpArgs: unknown
    try {
      const obj = JSON.parse(text)
      if(!obj) return
      toolName = obj.name
      if(obj["parameters"]) {
        tmpArgs = obj["parameters"]
      }
      if(obj["arguments"]) {
        tmpArgs = obj["arguments"]
      }
    }
    catch(err) {
      console.warn("_turnIntoTool_2 err: ")
      console.log(err)
      return
    }
    if(!toolName || !tmpArgs) return

    // 3. check if toolName exists
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 4. handle toolArgs
    let toolArgs = ""
    if(typeof tmpArgs === "string") {
      let tmp4 = tmpArgs.trim()
      try {
        JSON.parse(tmp4)
      }
      catch(err) {
        console.warn("JSON.parse(tmp4) error: ")
        console.log(err)
        return
      }
      toolArgs = tmp4
    }
    else if(typeof tmpArgs === "object") {
      try {
        toolArgs = JSON.stringify(tmpArgs)
      }
      catch(err) {
        console.warn("JSON.stringify(tmpArgs) error: ")
        console.log(err)
      }
    }
    if(!toolArgs) return

    
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_2: ")
    console.log(toolCall)
    return true
  }

  /**
   * change shape like:
   * 
   * 调用工具: xxx
   * 参数: xxxxxx
   * 
   * into tool call
   */
  private static _turnIntoTool_1(
    choice: OaiChoice,
    text: string,
  ) {
    // 1. check if the text starts with "调用工具"
    let index1 = -1
    let thePrefix1 = ""
    const prefix1s = ["调用工具:", "調用工具:", "Call a tool:"]
    for(let i=0; i<prefix1s.length; i++) {
      const v = prefix1s[i]
      index1 = text.indexOf(v)
      if(index1 >= 0) {
        thePrefix1 = v
        break
      }
    }
    if(!thePrefix1) return

    // 2. get toolName
    text = text.substring(index1 + thePrefix1.length).trimStart()
    const tmpList2 = text.split("\n")
    if(!tmpList2 || tmpList2.length < 2) return
    const toolName = tmpList2[0].trim()
    if(!toolName) return
    const hasTheTool = aiTools.find(v => v.function?.name === toolName)
    if(!hasTheTool) return

    // 3. check if the rest of the text starts with "参数"
    tmpList2.shift()
    text = tmpList2.join("\n").trim()
    const prefix3s = ["参数:", "參數:", "Arguments:"]
    const thePrefix3 = prefix3s.find(v => text.startsWith(v))
    if(!thePrefix3) return

    // 4. get args
    text = text.substring(thePrefix3.length).trimStart()
    let toolArgs = text.split("\n")[0]
    if(!toolArgs) return
    toolArgs = toolArgs.trim()
    try {
      const args = JSON.parse(toolArgs)
      console.warn("see args in _turnIntoTool: ")
      console.log(args)
    }
    catch(err) {
      console.warn("TransformText _turnIntoTool err: ")
      console.log(err)
      return
    }

    // 5. let's transform!
    const toolCall = this._fillChoiceWithToolCall(choice, toolName, toolArgs)
    console.warn("success to turnIntoTool_1: ")
    console.log(toolCall)
    return true
  }

}


export class Translator {

  private _bot?: AiBot
  private _user?: Table_User

  constructor(bot?: AiBot, user?: Table_User) {
    this._bot = bot
    this._user = user
  }

  async run(
    text: string,
  ): Promise<LiuAi.TranslateResult | undefined> {
    // 1. get apiEndpoint
    let apiEndpoint: AiApiEndpoint | undefined
    const bot = this._bot
    const canUseChat = bot?.abilities.includes("chat")
    if(canUseChat && bot) {
      apiEndpoint = AiHelper.getApiEndpointFromBot(bot)
    }
    let model = bot?.model
    if(!apiEndpoint || !model) {
      const _env = process.env
      const baseURL = _env.LIU_TRANSLATION_BASE_URL
      const apiKey = _env.LIU_TRANSLATION_API_KEY
      model = _env.LIU_TRANSLATION_MODEL
      if(!apiKey || !baseURL || !model) {
        console.warn("there is no apiKey or baseUrl in Translator")
        return
      }
      apiEndpoint = { apiKey, baseURL }
    }

    // 2. get prompts
    const { p } = aiI18nShared({ type: "translate", user: this._user})
    const prompts: OaiPrompt[] = [
      { role: "system", content: p("system") },
      { role: "user", content: p("user_1") },
      { role: "assistant", content: p("assistant_1") },
      { role: "user", content: p("user_2") },
      { role: "assistant", content: p("assistant_2") },
      { role: "user", content: p("user_3") },
      { role: "assistant", content: p("assistant_3") },
      { role: "user", content: p("user_4") },
      { role: "assistant", content: p("assistant_4") },
      { role: "user", content: p("user_5") },
      { role: "assistant", content: p("assistant_5") },
      { role: "user", content: p("user_6") },
      { role: "assistant", content: p("assistant_6") },
      { role: "user", content: text },
    ]

    // 3. chat 
    const llm = new BaseLLM(apiEndpoint.apiKey, apiEndpoint.baseURL)
    const res3 = await llm.chat({ model, messages: prompts })
    if(!res3) {
      console.warn("no res3 in Translator")
      return
    }

    // 4. get translatedText
    const {
      content: translatedText,
    } = AiHelper.getContentFromLLM(res3, this._bot)
    if(!translatedText) {
      console.warn("no translatedText in Translator")
      return
    }

    // 5. return 
    const res5: LiuAi.TranslateResult = {
      originalText: text,
      translatedText,
      model,
    }
    console.log("see translate result: ")
    console.log(res5)
    return res5
  }


}


/*************** Turn Audio into Text  **************/

export class Transcriber {

  private _audioUrl: string

  constructor(audioUrl: string) {
    this._audioUrl = audioUrl
  }

  async run() {
    // 1. get params
    const _env = process.env
    const baseUrl = _env.LIU_SILICONFLOW_BASE_URL
    const apiKey = _env.LIU_SILICONFLOW_API_KEY
    if(!baseUrl || !apiKey) {
      console.warn("there is no baseUrl or apiKey in Transcriber")
      return
    }

    // 2. download file
    const res2 = await downloadFile(this._audioUrl)
    const { code, data, errMsg } = res2
    if(code !== "0000" || !data) {
      console.warn("download file err:::")
      console.log(code)
      console.log(errMsg)
      return
    }
    
    // 3. get formdata
    const response = data.res
    const filename = `` + getNowStamp() + `.mp3`
    const { form, b64 } = await responseToFormData(response, { 
      formKey: "file",
      filename,
    })
    form.append("model", "FunAudioLLM/SenseVoiceSmall")

    // 4. transcribe
    const headers = {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "multipart/form-data",
    }
    const url4 = baseUrl + "/audio/transcriptions"
    let data4: Ns_SiliconFlow.AudioToTextRes | undefined
    try {
      const res4 = await axios.post(url4, form, { headers })
      console.warn("the result or transcribe: ")
      console.log(res4.data)
      data4 = res4.data
    }
    catch(err) {
      console.warn("Transcriber error: ")
      console.log(err)
    }

    // 5. return
    return { text: data4?.text, audioBase64: b64 }
  }


}

/*************** Turn image url into base64 ************/
class ImageHelper {

  static async checkPromptsForBase64(
    prompts: OaiPrompt[],
  ) {
    const _this = this
    for(let i=0; i<prompts.length; i++) {
      const v = prompts[i]
      const c1 = v.content
      if(!c1) continue
      if(typeof c1 === "string") continue
      for(let j=0; j<c1.length; j++) {
        const c2 = c1[j]
        if(c2.type !== "image_url") continue
        const url = c2.image_url.url
        if(url.startsWith("data:image")) continue
        if(!url.startsWith("http")) continue
        console.log("get to convert image url to base64......")
        const b64 = await _this.getBase64(url)
        if(!b64) continue
        c2.image_url.url = b64
      }
    }
  }

  static async getBase64(url: string) {
    const res1 = await downloadFile(url)
    const { code, data, errMsg } = res1
    if(code !== "0000" || !data) {
      console.warn("download file err in getBase64")
      console.log(code)
      console.log(errMsg)
      return
    }

    const response = data.res
    const filename = `` + getNowStamp() + `.mp3`
    const { b64, contentType } = await responseToFormData(response, { 
      formKey: "file",
      filename,
    })

    console.warn("see contentType in getBase64: ")
    console.log(contentType)

    const imageBase64 = `data:${contentType};base64,${b64}`
    return imageBase64
  }

}


class LogHelper {

  static kick(
    characters: AiCharacter[],
    user?: Table_User,
  ) {
    const row: Partial<Table_LogAi> = {
      infoType: "kick_character",
      characters,
      userId: user?._id,
    }
    this._insert(row)
  }

  static add(
    characters: AiCharacter[],
    user?: Table_User,
  ) {
    const row: Partial<Table_LogAi> = {
      infoType: "add_character",
      characters,
      userId: user?._id,
    }
    this._insert(row)
  }

  static _insert(log: Partial<Table_LogAi>) {
    const b1 = getBasicStampWhileAdding()
    log = { ...b1, ...log }
    const logCol = db.collection("LogAi")
    logCol.add(log)
  }

  static printLastItems(
    messages: Array<Record<string, any>>,
    lastNum = 5,
  ) {
    const msgLength = messages.length
    console.log(`print last ${lastNum} prompts: `)
    if(msgLength > lastNum) {
      const messages2 = messages.slice(msgLength - lastNum)
      const printMsg = valTool.objToStr({ messages: messages2 })
      console.log(printMsg)
    }
    else {
      const printMsg = valTool.objToStr({ messages })
      console.log(printMsg)
    }
  }

}
