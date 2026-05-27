# AGENTS.md — Liubai Docker 维护指南

本仓库基于 [yenche123/liubai](https://github.com/yenche123/liubai) 改造，用于 Docker 自托管部署。

## 长期目标

**同步上游仓库 https://github.com/yenche123/liubai，主要工作是将上游最新的 `liubai-laf` 云函数迁移到本仓库的 Bun 运行时 `liubai-runtime`。**

- 业务逻辑保持在 [`liubai-backends/liubai-laf/cloud-functions/`](liubai-backends/liubai-laf/cloud-functions/)（与上游结构一致）
- **不要**在 cloud-functions 内重写 Laf 业务；平台差异由 [`liubai-runtime`](liubai-backends/liubai-runtime/) 的 `@lafjs/cloud` shim 吸收
- **不要**修改 [`liubai-frontends/`](liubai-frontends/) 与根目录 [`README.md`](README.md)，除非有明确需求

## 仓库结构（后端）

| 目录 | 角色 |
|------|------|
| `liubai-laf/` | 上游云函数镜像，从 upstream 合并 |
| `liubai-runtime/` | Bun HTTP 服务 + Laf shim + cron |
| `liubai-ffmpeg/` | 音视频转换 |
| `liubai-push-proxy/` | Cloudflare Worker，Web Push 代理 |

## 上游同步流程

1. `git fetch upstream`（需先添加上游 remote）
2. 对比并合并 `liubai-backends/liubai-laf/`，重点是 `cloud-functions/`
3. 确认 `liubai-runtime` 的 tsconfig `@/*` 路径仍指向 `liubai-laf/cloud-functions`
4. 本地或 Docker 回归：`hello-world`、`user-login`、`sync-get`、主要 webhook
5. 若端口/环境变量有变，更新 [`DEPLOY.md`](DEPLOY.md) 与 [`.env.example`](.env.example)

## liubai-runtime 要点

- 路由：`POST|GET /{functionName}`，与 Laf URL 约定一致
- 拦截器：复用 cloud-functions 内 [`__interceptor__.ts`](liubai-backends/liubai-laf/cloud-functions/__interceptor__.ts)
- 数据库：独立 Compose 服务 `db`（MongoDB），runtime 通过 `MONGODB_URI` 连接
- Shim：[`src/laf-shim/`](liubai-backends/liubai-runtime/src/laf-shim/) 提供 `cloud.database()`、`cloud.shared`、`cloud.mongo`
- 定时任务：`clock-per-min` / `clock-half-hr` / `clock-one-hr`（见 [`src/cron.ts`](liubai-backends/liubai-runtime/src/cron.ts)）

## 子项目

- Cloudflare Workers / push-proxy：见 [`liubai-backends/liubai-push-proxy/AGENTS.md`](liubai-backends/liubai-push-proxy/AGENTS.md)

## 部署

见 [`DEPLOY.md`](DEPLOY.md)。顺序：**先部署 push-proxy → 配置 `.env` → `docker compose up -d`**；前端可选 Cloudflare 或 `docker compose --profile with-web up -d`。
