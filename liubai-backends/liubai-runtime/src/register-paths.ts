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
      const filePath = path.join(cloudFunctionsDir, args.path.slice(2))
      return {
        contents: await Bun.file(filePath).text(),
        loader: "ts",
      }
    })
  },
})
