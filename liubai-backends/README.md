# liubai-backends

后端各项目和资源的根目录。

## 项目结构

- [liubai-laf](./liubai-laf/): 基于 Laf 的核心业务云函数（与上游 https://github.com/yenche123/liubai 同步）。
- [liubai-runtime](./liubai-runtime/): 基于 Bun 的自托管运行时，加载 `liubai-laf/cloud-functions` 并提供 HTTP 服务。
- [liubai-push-proxy](./liubai-push-proxy/): 基于 Cloudflare Workers 的 Web Push 代理，用于转发 FCM 推送。
- [liubai-ffmpeg](./liubai-ffmpeg/): 音视频处理相关的后端服务。

## Docker 部署

见仓库根目录 [DEPLOY.md](../DEPLOY.md)。
