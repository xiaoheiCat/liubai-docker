FROM oven/bun:1.3-alpine AS runtime

WORKDIR /app/liubai-backends/liubai-runtime

COPY liubai-backends/liubai-runtime/package.json liubai-backends/liubai-runtime/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY liubai-backends/liubai-laf/cloud-functions ./cloud-functions
COPY liubai-backends/liubai-laf/types /app/liubai-backends/liubai-laf/types
COPY liubai-backends/liubai-runtime/defaults/secret-config.ts ./cloud-functions/secret-config.ts
COPY liubai-backends/liubai-runtime/src ./src
COPY liubai-backends/liubai-runtime/tsconfig.json liubai-backends/liubai-runtime/bunfig.toml ./

EXPOSE 9000

CMD ["bun", "--preload", "./src/register-paths.ts", "src/server.ts"]
