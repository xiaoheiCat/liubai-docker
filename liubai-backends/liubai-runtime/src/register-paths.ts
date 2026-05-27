import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const runtimeDir = path.dirname(fileURLToPath(import.meta.url))
const runtimeRoot = path.resolve(runtimeDir, "..")
const INTERNAL_PREFIX = "./@cloud/"

function resolveCloudFunctionsDir(): string {
  const bundledDir = path.join(runtimeRoot, "cloud-functions")
  const devDir = path.join(runtimeRoot, "..", "liubai-laf", "cloud-functions")
  if (existsSync(path.join(bundledDir, "common-types.ts"))) {
    return bundledDir
  }
  return devDir
}

const cloudFunctionsDir = resolveCloudFunctionsDir()
const lafShimPath = path.resolve(runtimeDir, "./laf-shim/index.ts")
const lafShimUrl = pathToFileURL(lafShimPath).href

async function resolveCloudFunctionFile(subpath: string): Promise<string> {
  const normalized = subpath.startsWith("@/") ? subpath.slice(2) : subpath
  const candidates = [
    path.join(cloudFunctionsDir, normalized),
    path.join(cloudFunctionsDir, `${normalized}.ts`),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(`Cloud function module not found: ${subpath}`)
}

function rewriteCloudFunctionImports(source: string): string {
  const withAliases = source.replace(/(['"])@\/([^'"]+)\1/g, (_match, quote: string, subpath: string) => {
    const target = subpath.endsWith(".ts") ? subpath : `${subpath}.ts`
    return `${quote}${INTERNAL_PREFIX}${target}${quote}`
  })

  return withAliases.replace(/(['"])@lafjs\/cloud\1/g, `$1${lafShimUrl}$1`)
}

async function loadCloudFunctionSource(filePath: string): Promise<{ contents: string; loader: "ts"; path: string }> {
  const source = await Bun.file(filePath).text()
  return {
    contents: rewriteCloudFunctionImports(source),
    loader: "ts",
    path: filePath,
  }
}

Bun.plugin({
  name: "liubai-cloud-paths",
  setup(build) {
    build.onResolve({ filter: /\?liubai-runtime=1$/ }, (args) => ({
      path: args.path.replace(/\?liubai-runtime=1$/, "").replace(/^@\//, ""),
      namespace: "liubai-cloud",
    }))

    build.onResolve({ filter: /^\.\/@cloud\// }, (args) => ({
      path: args.path.slice(INTERNAL_PREFIX.length),
      namespace: "liubai-cloud",
    }))

    build.onLoad({ filter: /.*/, namespace: "liubai-cloud" }, async (args) => {
      const filePath = await resolveCloudFunctionFile(args.path)
      return loadCloudFunctionSource(filePath)
    })
  },
})
