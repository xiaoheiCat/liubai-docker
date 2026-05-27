import type { FunctionContext } from "./types/function-context.ts"

type CloudFunctionModule = {
  main: (ctx: FunctionContext, next?: unknown) => Promise<unknown>
}

const moduleCache = new Map<string, CloudFunctionModule>()

export async function loadCloudFunction(funcName: string): Promise<CloudFunctionModule | null> {
  if (moduleCache.has(funcName)) {
    return moduleCache.get(funcName)!
  }

  try {
    const mod = (await import(`@/${funcName}.ts`)) as CloudFunctionModule
    if (typeof mod.main !== "function") {
      return null
    }
    moduleCache.set(funcName, mod)
    return mod
  } catch (err) {
    console.warn(`Failed to load cloud function "${funcName}":`, err)
    return null
  }
}

export async function loadInterceptor(): Promise<CloudFunctionModule | null> {
  return loadCloudFunction("__interceptor__")
}

export async function runWithInterceptor(
  funcName: string,
  ctx: FunctionContext,
): Promise<unknown> {
  const interceptor = await loadInterceptor()
  const handler = await loadCloudFunction(funcName)

  if (!handler) {
    return { code: "E4040", errMsg: `Function "${funcName}" not found` }
  }

  const runHandler = async (innerCtx: FunctionContext) => {
    return handler.main(innerCtx)
  }

  if (!interceptor) {
    return runHandler(ctx)
  }

  const next = async (innerCtx: FunctionContext) => runHandler(innerCtx)
  return interceptor.main(ctx, next)
}

export async function runInit(ctx: FunctionContext): Promise<unknown> {
  const initMod = await loadCloudFunction("__init__")
  if (!initMod) {
    throw new Error("__init__ cloud function not found")
  }
  return initMod.main(ctx)
}
