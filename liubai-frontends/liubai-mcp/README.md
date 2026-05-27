# Liubai MCP

Liubai 的 [Model Context Protocol](https://modelcontextprotocol.io/) 服务器，让 LLM 客户端管理 Liubai 中的待办、日程与笔记。

## 功能

- 创建（待 Web 确认）：待办、日程、笔记
- 查询：日程、待办/已完成/最近卡片、待确认状态

创建类操作与微信/服务号 AI 一致：MCP 仅提交待确认记录，用户须在 Web 端打开 `agreeLink` 同意后才会写入 Liubai。

## 快速开始

见 [`installation/SKILL.md`](./installation/SKILL.md)（供 LLM 阅读并完成安装）。

```bash
cd liubai-frontends/liubai-mcp
bun install && bun run build

# OAuth 登录（凭证保存到 ~/.config/liubai-mcp/credentials.json）
LIUBAI_API_DOMAIN=http://localhost:9000/ bun run login
```

配置 MCP 时通常只需 `LIUBAI_API_DOMAIN`；启动 stdio 服务：

```bash
LIUBAI_API_DOMAIN=http://localhost:9000/ node dist/index.js
```

## 后端

MCP 调用云函数 `POST /liubai-mcp`，实现见 `liubai-backends/liubai-laf/cloud-functions/liubai-mcp.ts`。

## License

AGPL-3.0-or-later
