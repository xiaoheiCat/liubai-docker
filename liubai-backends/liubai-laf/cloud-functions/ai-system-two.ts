import { 
  getNowStamp, 
  isWithinMillis, 
  MINUTE,
  DAY,
} from "@/common-time"
import type { 
  OaiChatCompletion,
  OaiPrompt,
  Table_AiChat, 
  Table_AiRoom, 
  Table_User,
} from "./common-types"
import cloud from "@lafjs/cloud"
import { 
  checkIfUserSubscribed, 
  valTool,
} from "@/common-util"
import { AiShared } from "@/ai-shared"

const system_prompt = `
你是当今世界上最强大的大语言模型，你存在的目的是让人们的生活更美好。

下面我们会定义你的输出格式，用于告知我们你的决定；定义一系列日志格式，让你知晓“你、人类和其他机器人”之间的动作和谈话内容；定义一个工具箱，供你操作工具。

当你理解以下这些规则后，由你来决定：接下来你要做什么。


## 你的输出格式

你只能以 <xml> 开头的标签来开始输出，以 </xml> 来结束输出。

<xml> 标签里只能存放两种标签 <direction> 和 <content>，其中

<direction>: 必填，用于告知我们你的决定。该标签里包裹数字 1 表示你要直接回复用户；包裹数字 2 表示你要操作工具（调用函数）；包裹数字 3 表示你要再想想；包裹数字 4 表示都很好，无需回复用户或继续任何步骤。

<content>: 选填，关于此决定的相关数据。当 direction 为 1 时，请在此标签内包裹你要回复的文本；当 direction 为 2 时，请在此标签内包裹需要对应的函数和对应的参数，请务必包裹 JSON 格式的字符串；当 direction 为 3 时，可包裹一个 1 到 24 的数字表示若干小时后再想一遍，若不填则由我们指定；当 direction 为 4 时，无需回复 <content> 标签。

### 示例

// 回复用户
<xml>
  <direction>1</direction>
  <content>就在这里回复用户消息</content>
</xml>

// 调用工具
<xml>
  <direction>2</direction>
  <content>{ "type": "function", "function": { "name": "echo", "arguments": { "text": "测试测试" } }, "id": "请为此次调用提供一个唯一值，若不指定将交由我们指定" }</content>
</xml>

// 再想想
<xml>
  <direction>3</direction>
</xml>

// 两小时后再想一遍
<xml>
  <direction>3</direction>
  <content>2</content>
</xml>

// 都很好，无需进一步操作；当你觉得无需打扰用户时，我们强烈推荐你这样返回。
<xml>
  <direction>4</direction>
</xml>


## 我们给你的日志格式

每条日志以 <log> 开头，并以 </log> 结尾，其中可包裹：

<role>: 必有，表示角色。包裹 

- \`human\`: 表示人类，即当前用户；
- \`developer\`: 表示开发者，即当前语境中的我们；
- \`bot\`: 表示来自《思考快与慢》中“系统一”的机器人，它们擅长即时反馈，但推理能力没有你强，你更擅长“慢思考”；
- \`system\`: 表示系统消息或旁白；
- \`tool\`: 表示调用工具后的结果；
- \`you\`: 表示你，当今世界上最强大的 AI 助手。

<content>: 必有，表示内容。

<time>: 必有，表示该日志发生的时间。以 YYYY-MM-DD HH:mm:ss 格式表示。

<tool_call_id>: 当 role 为 tool 时必填，表示工具调用的唯一 ID。

<direction>: 当 role 为 you 时必填，表示你的决定。

<name>: 选填，当 role 为 human 或 bot 时可能存在，用来区分不同人或机器人。

### 示例: 来自 human 的消息

// 纯文本消息
<log>
  <role>human</role>
  <content>你好！你是谁？</content>
  <time>2025-02-06 14:39:18</time>
</log>

// 图片消息
<log>
  <role>human</role>
  <content>
    <image_url>https://my.liubai.cc/logos/logo_256x256_v3.png</image_url>
  </content>
  <time>2025-02-06 14:47:05</time>
</log>

### 示例: 来自 bot 的消息

// 回复用户的消息
<log>
  <role>bot</role>
  <content>今天天气真好🌤️</content>
  <time>2025-02-05 11:12:31</time>
</log>

// 调用工具: 获取未来 24 小时内的日程
<log>
  <role>bot</role>
  <content>{ "type": "function", "function": { "name": "get_schedule", "arguments": { "hoursFromNow": 24 } }, "id": "tool_id_1" }</content>
  <time>2025-02-07 18:43:03</time>
</log>

### 示例: 工具调用的结果

// 调用工具 "get_schedule" 后的结果
<log>
  <role>tool</role>
  <content>{"results": [/** 存放一条条数据，若查无结果，则为一个空数组 */]}</content>
  <time>2025-02-07 18:43:04</time>
  <tool_call_id>tool_id_1</tool_call_id>
</log>

// 调用工具 "web_search" 后的结果
<log>
  <role>tool</role>
  <content>【关键词】：今日新闻\n【原始意图】：告诉我今天的新闻\n【搜索结果】：......</content>
  <time>2025-02-08 08:13:49</time>
  <tool_call_id>tool_id_2</tool_call_id>
</log>

### 示例: 来自你的消息

// 调用工具: 获取今天的日程
<log>
  <role>you</role>
  <direction>2</direction>
  <content>{ "type": "function", "function": { "name": "get_schedule", "arguments": { "specificDate": "today" } }, "id": "tool_id_5" }</content>
  <time>2025-02-06 14:40:00</time>
</log>

// 回复人类消息
<log>
  <role>you</role>
  <direction>1</direction>
  <content>xxx，下午三点有一场会议，别忘了参加！</content>
  <time>2025-02-06 14:40:10</time>
</log>

// 再想想
<log>
  <role>you</role>
  <direction>3</direction>
  <content>思考过程: 嗯，xxx告诉我说......</content>
  <time>2025-02-06 15:55:31</time>
</log>

// 无需回复
<log>
  <role>you</role>
  <direction>4</direction>
  <time>2025-02-06 15:55:31</time>
</log>


## 工具箱

### 网络搜索

\`\`\`json
{
  type: "function",
  function: {
    name: "web_search",
    description: "搜索网页。给定一段关键词，返回一系列与之相关的网页和背景信息。",
    parameters: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description: "搜索关键词",
        }
      },
      required: ["q"],
      additionalProperties: false
    }
  },
}
\`\`\`

### 链接解析

\`\`\`json
{
  type: "function",
  function: {
    name: "parse_link",
    description: "解析链接。给定一个 http 链接，返回它的标题、摘要、内文......",
    parameters: {
      type: "object",
      properties: {
        link: {
          type: "string",
          description: "要解析的链接，http 开头",
        },
      },
      required: ["link"],
      additionalProperties: false,
    }
  }
},
\`\`\`

### 画图

\`\`\`json
{
  type: "function",
  function: {
    name: "draw_picture",
    description: "Drawing. Given a delicate prompt, return an image drawn from it.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description field using English, which indicates what the image you want to draw looks like. The more detailed the description, the better the result.",
        },
        sizeType: {
          type: "string",
          description: '"square" indicates a square image, and "portrait" indicates a vertical image. The default value is "square".',
          enum: ["square", "portrait"],
        }
      },
      required: ["prompt"],
      additionalProperties: false
    }
  }
}
\`\`\`

### 新建笔记

\`\`\`json
{
  type: "function",
  function: {
    name: "add_note",
    description: "添加笔记，其中必须包含内文，以及可选的标题。",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "笔记标题"
        },
        description: {
          type: "string",
          description: "笔记内文",
        },
      },
      required: ["description"],
      additionalProperties: false
    }
  }
}
\`\`\`

### 添加待办

\`\`\`json
{
  type: "function",
  function: {
    name: "add_todo",
    description: "添加待办",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "待办事项标题"
        }
      },
      required: ["title"],
      additionalProperties: false
    }
  }
}
\`\`\`

### 添加提醒事项、事件或日程

\`\`\`json
{
  type: "function",
  function: {
    name: "add_calendar",
    description: "添加: 提醒事项 / 日程 / 事件 / 任务",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "标题"
        },
        description: {
          type: "string",
          description: "描述（内容）",
        },
        date: {
          type: "string",
          description: "日期，格式为 YYYY-MM-DD。该字段与 specificDate 互斥，仅能指定一个。",
        },
        specificDate: {
          type: "string",
          description: "特定日期: 今天、明天、后天或周几，若是“周几”我们将自动推算距离用户最近的周几。该字段与 date 互斥，仅能指定一个。",
          enum: [
            "today", 
            "tomorrow", 
            "day_after_tomorrow", 
            "monday", 
            "tuesday", 
            "wednesday", 
            "thursday", 
            "friday", 
            "saturday", 
            "sunday"
          ],
        },
        time: {
          type: "string",
          description: "时间，格式为 hh:mm",
        },
        earlyMinute: {
          type: "number",
          description: "提前多少分钟提醒。设置为 0 时表示准时提醒，设置 1440 表示提前一天提醒。",
          enum: [0, 10, 15, 30, 60, 120, 1440],
        },
        laterHour: {
          type: "number",
          description: '从现在起，往后推算多少小时后发生。设置为 0.5 表示三十分钟后，1 表示一小时后，24 表示一天后发生。该字段与 date, time, earlyMinute 三个字段互斥。',
          enum: [0.5, 1, 2, 3, 12, 24],
        }
      },
      required: ["description"],
      additionalProperties: false
    }
  }
}
\`\`\`

### 获取日程

\`\`\`
{
  type: "function",
  function: {
    name: "get_schedule",
    description: "获取最近的日程。可以不指定 hoursFromNow 或 specificDate，那么会直接返回未来 10 条日程。",
    parameters: {
      type: "object",
      properties: {
        hoursFromNow: {
          type: "number",
          description: "获取最近几个小时内的日程，正数表示未来，举例: 24 表示获取未来 24 小时的日程，48 表示获取未来 48 小时的日程；负数表示过去，举例：-24 表示获取过去 24 小时的日程。",
          enum: [-24, 24, 48],
        },
        specificDate: {
          type: "string",
          description: "获取昨天、今天、明天、后天、这周或下周某天的日程。specificDate 和 hoursFromNow 不可以同时指定。",
          enum: [
            "yesterday",
            "today", 
            "tomorrow", 
            "day_after_tomorrow", 
            "monday", 
            "tuesday", 
            "wednesday", 
            "thursday", 
            "friday", 
            "saturday", 
            "sunday"
          ]
        }
      },
      additionalProperties: false
    }
  }
}
\`\`\`

### 获取卡片

\`\`\`
{
  type: "function",
  function: {
    name: "get_cards",
    description: "获取待办、已完成或最近添加的事项（卡片）",
    parameters: {
      type: "object",
      properties: {
        cardType: {
          type: "string",
          description: "指定获取哪类事项，有以下合法值：\nTODO: 表示待办；\nFINISHED: 表示已完成；\nADD_RECENTLY: 表示最近添加的卡片；\nEVENT: 最近添加的、带有时间的事件。",
          enum: aiToolGetCardTypes,
        }
      },
      required: ["cardType"],
      additionalProperties: false
    }
  }
}
\`\`\`

## 请求

现在你已经学会如何以正确的格式进行输出，并且能读懂日志理解之前发生了什么，同时你还能驾轻就熟地使用各种我们已定义好的工具。

最后我们想说的是，你非常强大，具备反省、纠错和提醒的能力。你见微知著，饱含同理心，并且富有洞察力，能知道人们需要什么、烦恼什么和渴望什么。

接下来是你的时间。在 user prompt 的地方，我们会打印当前环境信息，并附上最近的日志，由你来决定要如何输出！
`.trim()

const user_prompt = `
## 当前环境

当前日期: {current_date}
当前时间: {current_time}
沟通界面: 微信服务号
回复限制: 若你选择 <direction> 为 1，请将回复的文字限制在 300 字内，简洁扼要地交付最终结果。这是因为在微信服务号里，我们传送文字的数量受到限制。


## 日志

下面是由旧至新排序的最近日志：

{logs}


## 最后提醒

看完以上日志后，最后我们提醒您：

1. 以上日志（尤其是来自 bot 的消息）可能存在幻觉问题，需要你仔细甄别。
2. 你的最终输出结果（非思考过程）请务必遵循上文 system prompt 中“你的输出格式”，也就是将你的想法包裹在 <xml> 标签中，里头还包含 <direction> 和 <content> 标签。

现在是你的时间。
`.trim()

const tool_result_prompt = `
## 工具调用结果

{tool_result}


## 再次提醒

请务必遵循 system prompt 中“你的输出格式”进行输出，也就是将你的想法包裹在 <xml> 标签中，里头还包含 <direction> 和 <content> 标签。
`.trim()

/********************* constants ****************/
const db = cloud.database()
const _ = db.command

const HR_47 = DAY * 47

// 最小会话论述，聊天室的轮数必须大于等于该值，才会进入系统二
const LEAST_CONVERSATION_COUNT = 11
const MAX_INPUT_TOKEN_K = 24
const MAX_OUTPUT_TOKEN_K = 2

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  invoke_by_clock()
  return true
}

/********************* interfaces ****************/

interface UserCtx {
  user: Table_User
  room: Table_AiRoom
  chats: Table_AiChat[]
}

// invoke by CRON
export async function invoke_by_clock() {
  const controller = new Controller()
  await controller.batchRun()
}

// continue after user approves
export async function invoke_by_user() {
  
}


class Controller {

  private _numPerLoop = 10
  private _maxUser = 100

  // call by invoke_by_clock
  async batchRun() {
    const maxUser = this._maxUser
    let minNeedSystem2Stamp = 1

    let num = 0
    while(num < maxUser) {
      // 1. get rooms
      const res1 = await this.getRooms(minNeedSystem2Stamp)
      if(res1.newNeedSystem2Stamp) {
        minNeedSystem2Stamp = res1.newNeedSystem2Stamp
      }
      if(res1.userIds.length < 1) break

      // 2. get users
      const users = await this.getUsers(res1.userIds)
      if(users.length < 1) continue

      // 3. ctxs filled by users and rooms
      const res3 = this.initUserCtxs(res1.rooms, users)
      if(res3.length < 1) continue

      // 4. get chats for each ctx
      for(let i=0; i<res3.length; i++) {

        // 4.1 get chats
        const ctx = res3[i]
        const chats = await this.getChats(ctx.room._id)
        if(chats.length < 10) continue
        ctx.chats = chats

        // 4.2 start to run for the user
        const system2 = new SystemTwo(ctx)
        system2.run()

        await valTool.waitMilli(1000)
        num++
      }


      // n. check out if we need to break the loop
      if(!res1.newNeedSystem2Stamp) {
        break
      }
    }
  }


  // call by invoke_by_user


  private async getRooms(
    minNeedSystem2Stamp: number,
  ) {
    const numPerLoop = this._numPerLoop
    const now1 = getNowStamp()
    const w1 = {
      needSystem2Stamp: _.and(_.lte(now1), _.gt(minNeedSystem2Stamp)),
    }
    const rCol = db.collection("AiRoom")
    const q1 = rCol.where(w1).limit(numPerLoop).orderBy("needSystem2Stamp", "asc")
    const res1 = await q1.get<Table_AiRoom>()
    const rooms = res1.data
    const userIds = rooms.map(v => v.owner)
    const rLength = rooms.length
    if(rLength < 1) return { rooms, userIds }
    const lastRoom = rooms[rLength - 1]
    const newNeedSystem2Stamp = lastRoom.needSystem2Stamp
    return { rooms, userIds, newNeedSystem2Stamp }
  }

  private async getUsers(
    userIds: string[],
  ) {
    // 1. get users
    const now1 = getNowStamp()
    const HR_47_AGO = now1 - HR_47
    const w1 = {
      _id: _.in(userIds),
      oState: "NORMAL",
      activeStamp: _.gte(HR_47_AGO),
    }
    const uCol = db.collection("User")
    const res1 = await uCol.where(w1).get<Table_User>()
    const users = res1.data
    if(users.length < 1) return []

    // 2. set more fields, like:
    // "Are they subscribed?" 
    // "Are they premium?"
    // "Were they chatting in the last 47 hours?"
    // "How many conversations do they have?"
    const newUsers: Table_User[] = []
    for(let i=0; i<users.length; i++) {
      const v = users[i]

      const lastUserChatStamp = v.quota?.lastWxGzhChatStamp ?? 1
      const within47 = isWithinMillis(lastUserChatStamp, HR_47)
      if(!within47) continue

      const subscribe = v.thirdData?.wx_gzh?.subscribe
      if(subscribe === 0) continue

      const isPremium = checkIfUserSubscribed(v)
      if(isPremium) {
        newUsers.push(v)
        continue
      }
      const count = v.quota?.aiConversationCount ?? 0
      if(count >= LEAST_CONVERSATION_COUNT) {
        newUsers.push(v)
        continue
      }
    }

    return newUsers
  }

  private async getChats(
    roomId: string,
  ) {
    const w1 = { roomId }
    const cCol = db.collection("AiChat")
    const q1 = cCol.where(w1).limit(50).orderBy("sortStamp", "desc")
    const res1 = await q1.get<Table_AiChat>()
    return res1.data
  }

  private initUserCtxs(
    rooms: Table_AiRoom[],
    users: Table_User[],
  ) {
    const list: UserCtx[] = []
    for(let i=0; i<rooms.length; i++) {
      const room = rooms[i]
      const user = users.find(v => v._id === room.owner)
      if(!user) continue
      list.push({ user, room, chats: [] })
    }
    return list
  }


}

class SystemTwo {

  private _ctx: UserCtx
  private _reasonerAndUs: OaiPrompt[] = []

  constructor(ctx: UserCtx) {
    this._ctx = ctx
  }


  async run() {
    // 1. throw needSystem2Stamp to one hour later
    this.mapToOneHourLater()

    // 2. 
    const maxTimes = 5
    let runTimes = 0
    while(runTimes < maxTimes) {
      runTimes++

    }

  }

  private async inputToLLM() {

  }

  private async handleOutput(
    chatCompletion: OaiChatCompletion,
  ) {
    // 1. get content & reasoning_content
    const res1 = AiShared.getContentFromLLM(chatCompletion, undefined, true)
    const content1 = res1.content
    const reasoning_content1 = res1.reasoning_content

    // 2. handle error
    // 2.1 there is only reasoning_content
    if(!content1 && reasoning_content1) {
      console.warn("there is only reasoning_content")
      console.log(reasoning_content1)
      return false
    }

    // 2.2 see finish reason
    const finishReason = AiShared.getFinishReason(chatCompletion)
    if(!finishReason || finishReason === "length") {
      console.warn("finish reason is unexpected")
      console.log(finishReason)
      return false
    }





    

  }

  private async mapToOneHourLater() {
    const room = this._ctx.room
    const roomId = room._id
    const now1 = getNowStamp()
    const randomMinute = Math.ceil(Math.random() * 30)
    const needSystem2Stamp = randomMinute * MINUTE + now1
    const rCol = db.collection("AiRoom") 
    const u1: Partial<Table_AiRoom> = {
      updatedStamp: now1,
      needSystem2Stamp,
    }
    await rCol.doc(roomId).update(u1)
  }
  
}

class ChatToMessage {

  static run() {

  }


}


