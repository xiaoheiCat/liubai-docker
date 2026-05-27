import type { FunctionContext } from "./types/function-context.ts"
import { runWithInterceptor } from "./router.ts"

const RUNTIME_PORT = Number(process.env.RUNTIME_PORT ?? "9000")
const RUNTIME_HOST = process.env.RUNTIME_HOST ?? "0.0.0.0"

interface CronJob {
  name: string
  intervalMs: number
  lastRun: number
}

const cronJobs: CronJob[] = [
  { name: "clock-per-min", intervalMs: 60 * 1000, lastRun: 0 },
  { name: "clock-half-hr", intervalMs: 30 * 60 * 1000, lastRun: 0 },
  { name: "clock-one-hr", intervalMs: 60 * 60 * 1000, lastRun: 0 },
]

function buildCronContext(funcName: string): FunctionContext {
  const triggerToken = process.env.LIU_TRIGGER_TOKEN ?? "liubai-cron"
  return {
    method: "POST",
    headers: {
      "x-laf-trigger-token": triggerToken,
      "content-type": "application/json",
    },
    body: {},
    query: {},
    request: {
      path: `/${funcName}`,
      body: {},
      method: "POST",
      headers: { "x-laf-trigger-token": triggerToken },
    },
    __function_name: funcName,
  }
}

async function invokeCronFunction(funcName: string): Promise<void> {
  try {
    console.log(`[cron] invoking ${funcName}`)
    const ctx = buildCronContext(funcName)
    await runWithInterceptor(funcName, ctx)
  } catch (err) {
    console.error(`[cron] ${funcName} failed:`, err)
  }
}

export function startCronScheduler(): void {
  if (process.env.LIU_DISABLE_CRON === "01") {
    console.log("[cron] disabled via LIU_DISABLE_CRON=01")
    return
  }

  setInterval(() => {
    const now = Date.now()
    for (const job of cronJobs) {
      if (now - job.lastRun >= job.intervalMs) {
        job.lastRun = now
        void invokeCronFunction(job.name)
      }
    }
  }, 10_000)

  console.log("[cron] scheduler started")
}

export function getRuntimeBind(): { hostname: string; port: number } {
  return { hostname: RUNTIME_HOST, port: RUNTIME_PORT }
}
