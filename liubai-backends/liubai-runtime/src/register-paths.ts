import path from "node:path"
import { fileURLToPath } from "node:url"

const runtimeDir = path.dirname(fileURLToPath(import.meta.url))
const cloudFunctionsDir = path.resolve(runtimeDir, "../../liubai-laf/cloud-functions")
const lafShimPath = path.resolve(runtimeDir, "./laf-shim/index.ts")

Bun.plugin({
  name: "liubai-cloud-paths",
  setup(build) {
    build.onResolve({ filter: /^@lafjs\/cloud$/ }, () => ({
      path: lafShimPath,
    }))

    build.onResolve({ filter: /^@\// }, (args) => ({
      path: args.path,
      namespace: "liubai-cloud",
    }))

    build.onLoad({ filter: /.*/, namespace: "liubai-cloud" }, async (args) => {
      const subpath = args.path.slice(2)
      const candidates = [
        path.join(cloudFunctionsDir, subpath),
        path.join(cloudFunctionsDir, `${subpath}.ts`),
      ]
      let filePath = candidates[0]
      for (const candidate of candidates) {
        if (await Bun.file(candidate).exists()) {
          filePath = candidate
          break
        }
      }
      return {
        contents: await Bun.file(filePath).text(),
        loader: "ts",
      }
    })
  },
})
