# liubai-runtime

基于 [Bun](https://bun.sh/) 的 Liubai 自托管后端运行时，加载 [`../liubai-laf/cloud-functions/`](../liubai-laf/cloud-functions/) 中的 Laf 云函数。

## 本地开发

```bash
# 需要 MongoDB（本地或 Docker）
export MONGODB_URI=mongodb://127.0.0.1:27017/liubai

# secret-config.ts 见 liubai-laf/README.md
cd liubai-backends/liubai-runtime
bun install
bun run dev
```

默认监听 `http://0.0.0.0:9000`。

## Docker

见仓库根目录 [DEPLOY.md](../../DEPLOY.md) 与 [docker-compose.yml](../../docker-compose.yml)。
