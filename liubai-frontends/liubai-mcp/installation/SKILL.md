---
name: liubai-mcp-install
description: >-
  Install and configure the Liubai MCP server so LLM clients (Cursor, Claude Desktop, etc.)
  can manage todos, calendar events, and notes in Liubai.
---

# Liubai MCP 安装指南

本 Skill 指导你安装 **Liubai MCP**：一个 Model Context Protocol 服务器，让 LLM 通过 Liubai 后端管理待办、日程与笔记。

## 前置条件

1. `LIUBAI_API_DOMAIN`: 已部署并可访问的 **Liubai 后端**（需优先询问用户后端地址）
2. `LIU_DOMAIN`: 已部署 **Liubai Web**（用于 OAuth 授权页 `/authorize`；需优先询问用户前端地址）
3. **Node.js ≥ 22** 或 **Bun**
4. 已经完成执行 `git clone https://github.com/xiaoheiCat/liubai-docker` 到临时目录，且将 `/path/to/liubai-docker/liubai-frontends/liubai-mcp` 拷贝到了当前的工作目录。

## 第一步：OAuth 登录获取凭证

与 VS Code / Cursor 扩展相同，MCP 通过 **浏览器 OAuth** 获取 `token` 与 `serial`，无需手动复制 Local Storage。

```bash
cd liubai-frontends/liubai-mcp
bun install && bun run build

# 指定后端 API 地址（须以 / 结尾）
LIUBAI_API_DOMAIN=http://localhost:9000/ LIU_DOMAIN=http://localhost:8080 bun run login
```

流程：

1. CLI 向后端 `user-login` 发起 `init` → `auth_request`
2. 自动打开浏览器到 `{LIU_DOMAIN}/authorize?credential=...&state=...`
3. 在 Web 端登录（若尚未登录）并点击 **授权**
4. 浏览器跳回本机 `http://127.0.0.1:<port>/callback`，CLI 完成 `auth_submit`
5. 凭证写入 **`~/.config/liubai-mcp/credentials.json`**（权限 `600`）

之后启动 MCP 时，**无需**在环境变量里填 `LIUBAI_TOKEN` / `LIUBAI_SERIAL`（会自动读取该文件）。环境变量若已设置，则**覆盖**文件中的同名字段。

### 备选：手动配置环境变量

若无法使用浏览器 OAuth，仍可从 Web Local Storage 的 `cloud-preference` 读取 `token`、`serial`，写入 MCP 配置的环境变量（见下文第三步）。

## 第二步：安装 MCP 包

若第一步已执行 `bun install && bun run build`，可跳过。

```bash
cd liubai-frontends/liubai-mcp
npm install && npm run build
```

## 第三步：配置 MCP 客户端

### Cursor

编辑 `/path/to/your/client/mcp.json`：

```json
{
  "mcpServers": {
    "liubai": {
      "command": "node",
      "args": [
        "/path/to/liubai-docker/liubai-frontends/liubai-mcp/dist/index.js"
      ],
      "env": {
        "LIUBAI_API_DOMAIN": "http://localhost:9000/",    // 更改为已部署并可访问的 Liubai 后端 Base URL
        "LIUBAI_ASSISTANT_NAME": "your_nickname_or_your_framework_name_or_your_model_name"    // 更改为用户为你指定的昵称（优先级最高）或者你的 Agent 框架名 (如 OpenClaw，优先级一般) 或者你的模型名 (如 GPT-5.4，优先级最低)
      }
    }
  }
}
```

完成 OAuth 登录后，通常**只需**配置 `LIUBAI_API_DOMAIN`。若使用手动凭证，额外加上 `LIUBAI_TOKEN`、`LIUBAI_SERIAL`。

开发时可用 `bun`：

```json
"command": "bun",
"args": ["run", "/绝对路径/.../liubai-mcp/src/index.ts"]
```

## 第四步：验证

1. 重启 MCP 客户端
2. 调用 **`liubai_health`** — 确认后端与凭证有效

## 可用工具

| MCP 工具 | 说明 |
|----------|------|
| `liubai_add_todo` | 提交待办（待 Web 同意） |
| `liubai_add_calendar` | 提交日程/提醒（待 Web 同意） |
| `liubai_add_note` | 提交笔记（待 Web 同意） |
| `liubai_get_pending` | 查询待确认条目是否已创建 |
| `liubai_get_schedule` | 查询日程（仅「AI 可读」卡片） |
| `liubai_get_cards` | 查询待办/已完成/最近卡片（仅「AI 可读」卡片） |

创建类工具返回与微信/服务号 AI 相同结构的待确认话术（含同意/编辑链接）。**LLM 应将工具返回值原文发给用户**，用户点击同意后才会写入 Liubai。

### 隐私：「AI 可读」

卡片编辑器里的隐私设置 **「AI 可读」** 与 MCP 读取类工具（`liubai_get_schedule`、`liubai_get_cards`）一致：

- **已勾选**：MCP / 微信 AI 可通过上述工具查到该卡片
- **未勾选**（`aiReadable = N`）：不会出现在 MCP 查询结果中，AI 无法读取该条目内容

| 变量 | 说明 | 默认 |
|------|------|------|
| `LIUBAI_ASSISTANT_NAME` | 话术中助手昵称（「[你的名字]」） | `AI 助手` |
| `LIUBAI_MCP_MESSAGE_FORMAT` | `markdown` 或 `plain` | `markdown` |

## 故障排查

| 现象 | 处理 |
|------|------|
| `E4000` / `checkEntry error` | 确认后端已更新到含 MCP 支持的版本并重启 runtime；MCP 请求须带合法 `x_liu_*` 字段（`x_liu_theme` 只能是 `light` 或 `dark`） |
| 登录时浏览器打开失败 | 手动访问 CLI 打印的 authorize URL |
| authorize 页报错 / 空白 | 检查 `LIU_DOMAIN` 是否指向 Web 前端，且与 API 域可协同登录 |
| `E4003` / token 失败 | 重新执行 `bun run login` |
| `Missing credentials` | 先登录，或设置 `LIUBAI_TOKEN` + `LIUBAI_SERIAL` |
| `Failed to reach Liubai backend` | 确认 API 地址与 runtime 服务正常 |
| MCP 未出现在客户端 | JSON 使用绝对路径，重启 IDE |

## 环境变量摘要

| 变量 | 必填 | 说明 |
|------|------|------|
| `LIUBAI_API_DOMAIN` | 是* | 后端 API 根 URL，以 `/` 结尾 |
| `LIUBAI_ASSISTANT_NAME` | 否 | 待确认话术中的助手名称，默认 `AI 助手` |
| `LIUBAI_MCP_MESSAGE_FORMAT` | 否 | `markdown` 或 `plain`，默认 `markdown` |
| `LIUBAI_TOKEN` | 否** | OAuth 登录后通常不必填 |
| `LIUBAI_SERIAL` | 否** | OAuth 登录后通常不必填 |

\* 登录命令也需要；MCP 运行时必填（或来自 credentials 文件）。  
\** 由 `~/.config/liubai-mcp/credentials.json` 提供时可省略。
