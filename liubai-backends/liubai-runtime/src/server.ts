import { initCloudShim } from "./laf-shim/index.ts"
import { createFunctionContext, buildHttpResponse } from "./context.ts"
import { runWithInterceptor, runInit } from "./router.ts"
import { startCronScheduler, getRuntimeBind } from "./cron.ts"
import { closeMongoClient } from "./laf-shim/mongo-client.ts"
import { corsPreflightResponse, withCors } from "./cors.ts"

const RESERVED = new Set(["health", "favicon.ico"])

async function bootstrap(): Promise<void> {
  console.log("[runtime] connecting to MongoDB...")
  await initCloudShim()
  console.log("[runtime] MongoDB ready")

  const initCtx = {
    method: "POST",
    headers: {},
    body: {},
    query: {},
    request: { path: "/__init__", body: {}, method: "POST" },
    __function_name: "__init__",
  }
  try {
    await runInit(initCtx)
    console.log("[runtime] __init__ completed")
  } catch (err) {
    console.error("[runtime] __init__ failed:", err)
  }

  startCronScheduler()

  const { hostname, port } = getRuntimeBind()

  Bun.serve({
    hostname,
    port,
    async fetch(req) {
      const preflight = corsPreflightResponse(req)
      if (preflight) {
        return preflight
      }

      const url = new URL(req.url)

      if (url.pathname === "/health") {
        return withCors(Response.json({ ok: true, service: "liubai-runtime" }), req)
      }

      const funcName = url.pathname.replace(/^\//, "").split("/")[0]
      if (!funcName || RESERVED.has(funcName)) {
        return withCors(
          Response.json({ code: "E4040", errMsg: "Not found" }, { status: 404 }),
          req,
        )
      }

      try {
        const { ctx, getResult } = await createFunctionContext(req, funcName)
        const result = await runWithInterceptor(funcName, ctx)
        const handlerResult = getResult()
        return withCors(buildHttpResponse(result, handlerResult), req)
      } catch (err) {
        console.error(`[runtime] error handling /${funcName}:`, err)
        return withCors(
          Response.json({ code: "E5002", errMsg: "Internal server error" }, { status: 500 }),
          req,
        )
      }
    },
  })

  console.log(`[runtime] listening on http://${hostname}:${port}`)
}

bootstrap().catch((err) => {
  console.error("[runtime] fatal:", err)
  process.exit(1)
})

process.on("SIGTERM", async () => {
  await closeMongoClient()
  process.exit(0)
})
