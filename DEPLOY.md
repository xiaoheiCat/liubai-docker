# Liubai Docker 部署指南

本文档说明如何使用 Docker Compose 自托管 Liubai 后端（及可选前端）。

## 前置条件

- Docker 与 Docker Compose v2
- [Bun](https://bun.sh/)（仅部署 `liubai-push-proxy` 到 Cloudflare 时需要）
- 已解析的域名与 HTTPS 反向代理（生产环境推荐，Compose 本身只暴露 HTTP 端口）

## 架构概览

| Compose 服务 | 说明 |
|--------------|------|
| `db` | 独立 MongoDB 容器，**不**捆绑在 runtime 内 |
| `minio` | 对象存储（S3 兼容），默认用于图片/文件上传 |
| `minio-init` | 一次性初始化 bucket 与公开读策略 |
| `runtime` | `liubai-runtime`（Bun），运行原 `liubai-laf` 云函数 |
| `ffmpeg` | AMR 转 MP3 服务 |
| `web` | 可选，profile `with-web`，Nginx 托管静态前端 |

默认使用 [GHCR 预构建镜像](https://github.com/xiaoheiCat/liubai-docker/pkgs/container/liubai-runtime)（`latest`）。拉取失败或需改源码时，改用 [`docker-compose.local.yml`](docker-compose.local.yml) 在本地构建。

## Step 1 — 部署 liubai-push-proxy（Cloudflare，推荐）

Web Push 需能访问 FCM。在部分网络环境下需通过 Cloudflare Worker 代理：

```bash
cd liubai-backends/liubai-push-proxy
bun install
bun deploy
```

部署完成后，将 Worker 域名（不含 `https://`）写入环境变量 `LIU_WEB_PUSH_PROXY_HOST`。

## Step 2 — 配置后端

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 在 [`liubai-laf/cloud-functions/`](liubai-backends/liubai-laf/cloud-functions/) 下创建 `secret-config.ts`（参考 [`liubai-laf/README.md`](liubai-backends/liubai-laf/README.md) 中的模板）。Docker 构建时会使用 [`liubai-runtime/defaults/secret-config.ts`](liubai-backends/liubai-runtime/defaults/secret-config.ts) 作为空占位；生产环境请填写微信支付/支付宝等密钥。

3. 编辑 `.env`，至少设置：

   - `LIU_DOMAIN` — 前端站点 URL
   - `LIU_TRIGGER_TOKEN` — 定时任务内部 token（请改为随机字符串）
   - 各第三方服务密钥（OAuth、Stripe 等，见 [`liubai-laf/.env.template`](liubai-backends/liubai-laf/.env.template)）
   - **对象存储**：Compose 默认捆绑 MinIO，一般只需设置 `LIU_MINIO_PUBLIC_URL` 为浏览器可访问的 MinIO 地址（如 `http://localhost:19000` 或反代后的 `https://storage.example.com`）。若改用七牛，请清空 `.env` 中全部 `LIU_MINIO_*` 并填写 `LIU_QINIU_*`。
   - `GHCR_MIRROR` — 若无法直连 `ghcr.io`，可改为自定义镜像仓库前缀（默认 `ghcr.io`）；也可单独设置 `LIUBAI_*_IMAGE` 覆盖完整镜像地址

4. `LIU_FFMPEG_BASEURL` 在 Compose 内已默认为 `http://ffmpeg:3000`，一般无需修改。

## Step 3 — 启动后端

仅启动 MongoDB + runtime + ffmpeg（**默认拉取 GHCR 镜像**）：

```bash
docker compose pull
docker compose up -d
```

若包为 private，先登录 GHCR：

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**拉取失败或需要本地构建时**，合并 local override 并构建：

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

也可在 `.env` 中固定启用本地构建：

```bash
COMPOSE_FILE=docker-compose.yml:docker-compose.local.yml
docker compose up -d --build
```

本地构建 `runtime` 时，仍需按 Step 2 准备 `secret-config.ts`（构建上下文会打入镜像）。

查看日志：

```bash
docker compose logs -f runtime
```

验证 API（runtime 默认映射宿主机 `9000` 端口）：

```bash
curl -X POST http://localhost:9000/hello-world \
  -H "Content-Type: application/json" \
  -d '{"x_liu_language":"zh-CN","x_liu_theme":"light","x_liu_version":"0.31.0","x_liu_stamp":1,"x_liu_timezone":"8.0","x_liu_client":"web"}'
```

首次启动时 `runtime` 会自动执行 `__init__`（初始化 Config 集合与 RSA/AES 密钥）。也可在设置 `LIU_DEBUG_KEY` 后手动触发：

```bash
curl -X POST http://localhost:9000/__init__ \
  -H "x-liu-debug-key: YOUR_DEBUG_KEY"
```

## Step 4 — 前端（二选一，可选）

### A. Cloudflare Pages / 自有 CDN

在 Cloudflare Pages 中建议配置：

| 项 | 值 |
|----|-----|
| 根目录（Root directory） | `liubai-frontends/liubai-web` |
| 构建命令 | `bun install && bun run build` |
| 输出目录 | `dist` |

环境变量：

| 变量 | 值 |
|------|-----|
| `SKIP_DEPENDENCY_INSTALL` | `1`（跳过 Pages 默认 `npm install`，由构建命令中的 `bun install` 负责安装） |
| `VITE_API_DOMAIN` | runtime 公网地址，需以 `/` 结尾，例如 `https://api.example.com/` |

### B. 与 Compose 一起启动

```bash
docker compose pull
docker compose --profile with-web up -d
```

本地构建前端时：

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml --profile with-web up -d --build
```

默认将前端映射到宿主机 `8080` 端口。构建时通过 `.env` 中的 `VITE_API_DOMAIN` 注入 API 地址。

## 对象存储（MinIO）

Compose 默认启动 MinIO，runtime 在检测到 `LIU_MINIO_*` 环境变量时会**优先使用 MinIO**，无需配置七牛。

| 变量 | 说明 |
|------|------|
| `LIU_MINIO_ENDPOINT` | runtime 容器内访问 MinIO 的地址，默认 `http://minio:9000` |
| `LIU_MINIO_PUBLIC_URL` | **浏览器**上传/读取文件的地址，必须与用户访问前端时的网络可达；本地默认 `http://localhost:19000` |
| `LIU_MINIO_ACCESS_KEY` / `LIU_MINIO_SECRET_KEY` | MinIO 凭证，默认 `minioadmin` |
| `LIU_MINIO_BUCKET` | bucket 名称，默认 `liubai` |
| `LIU_MINIO_CORS_ORIGIN` | 浏览器跨域上传允许的 Origin（Community Edition 仅支持全局 CORS；默认 `*`，生产建议设为前端域名） |
| `MINIO_API_PORT` / `MINIO_CONSOLE_PORT` | 宿主机映射端口，默认 `19000` / `19001` |

> **注意**：MinIO Community Edition 不支持 `mc cors set` 桶级 CORS（该命令会报错并导致 `minio-init` 失败）。CORS 通过 `MINIO_API_CORS_ALLOW_ORIGIN` 在 `minio` 服务上全局配置。若 MinIO 走 Nginx 反代，也可在反代层添加 CORS 头。

生产环境建议：

1. 修改 MinIO 默认密码。
2. 通过 Nginx/Caddy 为 `LIU_MINIO_PUBLIC_URL` 配置 HTTPS 反代（MinIO API 端口 9000）。
3. 若前端部署在 Cloudflare Pages，需重新构建前端以包含 MinIO 上传逻辑（`upload-via-minio`）。

MinIO 控制台：`http://localhost:19001`（默认账号密码见上表）。

### 上传仍报 `qiniu access_key ... required`

说明 **runtime 容器仍在走七牛逻辑**，常见原因：

1. **GHCR 镜像是旧版本**（不含 MinIO 代码）— 需拉取并重建 runtime：

```bash
docker compose pull runtime
docker compose up -d --force-recreate runtime
```

或本地构建：

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build runtime
```

2. **`.env` 未配置 MinIO** — 确认存在：

```env
LIU_STORAGE=minio
LIU_MINIO_PUBLIC_URL=https://你的-storage-域名
```

3. **`docker-compose.proxy.yml` 覆盖了 runtime 环境** — 需保留 `LIU_STORAGE` 与 `LIU_MINIO_*`，可参考 [`docker-compose.proxy.example.yml`](docker-compose.proxy.example.yml)。

验证 runtime 是否已启用 MinIO：

```bash
curl -s http://localhost:9000/health | jq .storage
```

应看到 `"backend": "minio"` 且 `"minio_configured": true`。若仍是 `qiniu` 或 `other`，必须**重建 runtime**：

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build runtime
docker compose -f docker-compose.yml -f docker-compose.proxy.yml up -d --force-recreate runtime
```

旧命令（检查 cloud-functions 内文件）仅适用于未升级镜像；**自 vNext 起 MinIO 逻辑在 runtime `src/storage/`**，以 `/health` 为准。

```bash
docker exec liubai-runtime printenv | grep -E 'LIU_DOCKER|LIU_STORAGE|LIU_MINIO'
```

## 运维备忘

- **Webhook**：微信/Stripe/七牛等回调 URL 需指向 runtime 公网地址下的对应路径，如 `https://api.example.com/webhook-stripe`。
- **Cron**：`clock-per-min` / `clock-half-hr` / `clock-one-hr` 由 runtime 容器内调度；需保持 runtime 常驻。可用 `LIU_DISABLE_CRON=01` 关闭。
- **MongoDB 备份**：数据卷 `mongo_data`，请定期备份。
- **切换外部 MongoDB**：修改 `MONGODB_URI` 并移除或停用 Compose 中的 `db` 服务即可。

## 本地开发 runtime（不用 Docker）

```bash
# 需本地或远程 MongoDB
export MONGODB_URI=mongodb://127.0.0.1:27017/liubai
cd liubai-backends/liubai-runtime
bun install
bun run dev
```

## 相关文档

- 上游同步与维护目标：[`AGENTS.md`](./AGENTS.md)
- push-proxy 开发说明：[`liubai-backends/liubai-push-proxy/README.md`](liubai-backends/liubai-push-proxy/README.md)
