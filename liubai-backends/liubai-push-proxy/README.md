# liubai-push-proxy

基于 Cloudflare Workers 的 Web Push 代理，专门用于解决 `fcm.googleapis.com` 在特定网络环境下的连接问题。

## 功能

- 将 Web Push 请求转发至 Google FCM 服务器。
- 包含详细的调试日志（请求方法、路径、目标 URL、响应状态及耗时）。
- 支持 CORS。

## 开发与部署

本项目使用 `bun` 和 `wrangler` 进行管理。

### 本地开发

```bash
bun dev
```

### 部署到 Cloudflare

```bash
bun deploy
```

## 配置

部署后，请在 liubai-runtime 环境变量（或 `.env`）中配置：

- `LIU_WEB_PUSH_PROXY_HOST`: 设置为该 Worker 的自定义域名或 `workers.dev` 域名（不含 `https://`）。
