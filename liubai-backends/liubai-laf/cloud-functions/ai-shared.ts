import cloud from "@lafjs/cloud"
import type { 
  LiuAi, 
  AiBot,
  AiEntry,
  AiCharacter,
  Wx_Gzh_Send_Msg,
  Wx_Gzh_Send_Msgmenu,
  Wx_Gzh_Send_Msgmenu_Item,
  Ns_Zhipu,
  Ns_SiliconFlow,
  AiImageSizeType,
  Ns_Stepfun,
  Table_User,
  Partial_Id,
  Table_LogAi,
  OaiChatCompletion,
  OaiCreateParam,
  AiFinishReason,
  OaiPrompt,
  DsReasonerMessage,
  Table_AiChat,
} from "@/common-types"
import { WxGzhSender } from "@/service-send"
import { 
  checkAndGetWxGzhAccessToken,
  getDocAddId,
  liuReq,
  MarkdownParser,
  valTool,
} from "@/common-util"
import { aiBots, aiI18nShared } from "@/ai-prompt"
import { useI18n, aiLang } from "@/common-i18n"
import { WxGzhUploader } from "@/file-utils"
import { getBasicStampWhileAdding, getNowStamp } from "@/common-time"
import OpenAI from "openai"

const db = cloud.database()
const _ = db.command


type BaseChatResolver = (res: OaiChatCompletion | undefined) => void

export class BaseLLM {
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
    opt?: LiuAi.BaseLLMChatOpt,
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
    opt?: LiuAi.BaseLLMChatOpt,
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
    opt?: LiuAi.BaseLLMChatOpt,
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


interface ThinkTagContent {
  content: string;
  startIndex: number;
  endIndex: number;
}

export class AiShared {

  static getApiEndpointFromBot(
    bot: AiBot
  ): LiuAi.ApiEndpoint | undefined {
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

  static getCharacterName(character?: AiCharacter) {
    if(!character) return
    let name = ""
    const bot = aiBots.find(v => v.character === character)
    if(bot) name = bot.name
    return name
  }

  static getGzhType() {
    const _env = process.env
    return _env.LIU_WX_GZ_TYPE ?? "subscription_account"
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

  private static extractThinkContent(text: string): ThinkTagContent[] {
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

  private static handleContentForReasoning(
    res: OaiChatCompletion,
    bot: AiBot,
    content: string,
    reasoning_content: string,
  ) {

    // 1. extract <think>......</think>
    const thinkContents = AiShared.extractThinkContent(content)
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
      AiShared.setFinishReasonToLength(res)
      return { content, reasoning_content }
    }
    
    // 3. starts with "好的，" /  "嗯，" / "好，"
    const thinkingInContent = bot.metaData?.thinkingInContent
    const finishReason = AiShared.getFinishReason(res)
    const mightHaveReasoningContent = Boolean(finishReason === "length" && !thinkingInContent)
    if(mightHaveReasoningContent) {
      const alrightList = ["Alright, ", "好的，", "嗯，", "好，", "好吧，"]
      const res3 = alrightList.some(x => content.startsWith(x))
      if(res3) {
        reasoning_content = content
        content = ""
      }
    }

    return { content, reasoning_content }
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
      AiShared.setFinishReasonToLength(res)
    }

    // 3. remove "?" in the beginning for zhipu
    if(bot?.character === "zhipu") {
      let err1 = content.startsWith("？")
      if(err1) content = content.substring(1)
    }

    
    // 4. handle reasoning_content if needed
    let isReasoning = Boolean(bot && AiShared.isReasoningBot(bot))
    if(!reasoning_content && isReasoning) {
      const res4 = AiShared.handleContentForReasoning(
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

  static isReasoningBot(bot: AiBot) {
    return bot.abilities.includes("reasoning")
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
    token = Math.ceil(token)
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
      token = AiShared.calculateTextToken(text)
    }
    else if(imageUrl) {
      token += 600
    }
    
    if(infoType === "tool_use") {
      const toolToken1 = usage?.completion_tokens ?? 0
      let toolToken2 = 0
      if(chat.funcName) {
        toolToken2 += AiShared.calculateTextToken(chat.funcName)
      }
      if(chat.funcJson) {
        const jsonStr = valTool.objToStr(chat.funcJson)
        toolToken2 += AiShared.calculateTextToken(jsonStr)
      }
      toolToken2 += 10
      token += Math.max(toolToken1, toolToken2)
    }

    return token
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


}

export class TellUser {

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
    menuList: LiuAi.MenuItem[],
    suffixMessage: string,
    fromCharacter?: AiCharacter
  ) {
    const _env = process.env
    const gzhType = AiShared.getGzhType()
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
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "kick_" + character, content: t("kick") + characterName })
      }

      if(operation === "add" && character) {
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({ id: "add_" + character, content: t("add") + characterName })
      }

      if(operation === "continue" && character) {
        const characterName = AiShared.getCharacterName(character)
        if(!characterName) continue
        wx_menu_list.push({
          id: "continue_" + character,
          content: t("continue_bot", { botName: characterName })
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

/******************** shared tools ************************/
export class ToolShared {

  async web_search(funcJson: Record<string, any>) {
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

    return searchRes
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
    let apiEndpoint: LiuAi.ApiEndpoint | undefined
    const bot = this._bot
    const canUseChat = bot?.abilities.includes("chat")
    if(canUseChat && bot) {
      apiEndpoint = AiShared.getApiEndpointFromBot(bot)
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
    } = AiShared.getContentFromLLM(res3, this._bot)
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

export class LogHelper {

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