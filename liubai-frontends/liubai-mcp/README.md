# Liubai MCP

Liubai 的 [Model Context Protocol](https://modelcontextprotocol.io/) 服务器，让 LLM 客户端管理 Liubai 中的待办、日程与笔记。

## 安装

在 [GitHub Releases](https://github.com/xiaoheiCat/liubai-docker/releases) 下载与系统和架构匹配的文件：

- Linux：`liubai-mcp-linux-*`；Alpine 等 musl 系统选择带 `musl` 的文件
- macOS：`liubai-mcp-darwin-*`
- Windows：`liubai-mcp-windows-*.exe`

Linux/macOS 下载后需要添加执行权限：

```bash
chmod +x /绝对路径/liubai-mcp-*
```

以 Cursor 风格的 MCP 配置为例：

```json
{
  "mcpServers": {
    "liubai": {
      "command": "/绝对路径/liubai-mcp-darwin-arm64",
      "env": {
        "LIUBAI_API_DOMAIN": "http://localhost:9000/",
        "LIUBAI_ASSISTANT_NAME": "AI 助手"
      }
    }
  }
}
```

可执行文件已包含运行时，不需要安装 Node.js 或 Bun。每次提交 MCP 相关变更时，GitHub Actions 会按 `package.json` 版本号与 commit 短 hash 创建 Release，例如 `0.31.0-a4d0034`。

## 登录

MCP 无需预先登录即可启动。Agent 应通过 MCP 工具完成登录，不应打开浏览器、执行登录脚本或手动访问回调地址：

1. 调用 `login_start`。若 MCP 配置中没有 `LIUBAI_API_DOMAIN`，在参数 `apiDomain` 中传入后端 API 根地址。
2. 将工具返回的授权链接和说明原样发给用户。
3. 用户完成授权后会跳转到无法打开的 `http://127.0.0.1:端口/callback?...`；请用户复制浏览器地址栏中的完整链接。
4. 把完整链接作为 `callbackUrl` 调用 `login_finish`。

凭据会保存到 `~/.config/liubai-mcp/credential.json`（权限 `600`），登录完成后无需重启 MCP。旧版 `credentials.json` 仍可读取，下一次登录后会写入新文件名。

容器等需要自定义配置目录的环境可设置 `LIUBAI_MCP_CONFIG_DIR`。

未登录或登录态失效时，业务工具统一返回：

```text
未登录/登录态失效，请使用 login_start 开始一个新的登录。
```

## 可用工具

| MCP 工具 | 说明 |
|----------|------|
| `login_start` | 生成登录授权链接 |
| `login_finish` | 解析 OAuth 回调链接并保存凭据 |
| `liubai_health` | 检查账号连接 |
| `liubai_add_todo` | 提交待办（待 Web 确认） |
| `liubai_add_calendar` | 提交日程/提醒（待 Web 确认） |
| `liubai_add_note` | 提交笔记（待 Web 确认） |
| `liubai_get_pending` | 查询待确认条目是否已创建 |
| `liubai_get_schedule` | 查询日程（仅“AI 可读”卡片） |
| `liubai_get_cards` | 查询待办/已完成/最近卡片（仅“AI 可读”卡片） |

创建类工具仅提交待确认记录。Agent 应把包含同意/编辑链接的结果原样返回给用户，用户在 Web 端确认后才会写入 Liubai。

## 本地开发

```bash
bun install
bun run --cwd liubai-frontends/liubai-mcp typecheck
bun run --cwd liubai-frontends/liubai-mcp dev
```

本地编译当前平台的独立可执行文件：

```bash
bun run --cwd liubai-frontends/liubai-mcp compile
```

MCP 调用云函数 `POST /liubai-mcp`，实现见 `liubai-backends/liubai-laf/cloud-functions/liubai-mcp.ts`。

## License

AGPL-3.0-or-later
