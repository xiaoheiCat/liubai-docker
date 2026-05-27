import type { Plugin } from "vite"
import { existsSync, promises as fs, readdirSync } from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const PUBLIC_PATH = "/vendor/vconsole.min.js"

function resolveVconsoleSourcePath(root: string): string {
  const require = createRequire(path.join(root, "package.json"))

  try {
    return require.resolve("vconsole/dist/vconsole.min.js")
  }
  catch {
    const bunStore = path.resolve(root, "../../node_modules/.bun")
    if (existsSync(bunStore)) {
      for (const name of readdirSync(bunStore)) {
        if (!name.startsWith("vconsole@")) continue

        const candidate = path.join(
          bunStore,
          name,
          "node_modules/vconsole/dist/vconsole.min.js",
        )
        if (existsSync(candidate)) return candidate
      }
    }

    throw new Error(
      "Cannot find vconsole.min.js; expected it in node_modules or the bun store",
    )
  }
}

export function vconsoleAsset(): Plugin {
  let sourcePath = ""

  return {
    name: "vconsole-asset",
    configResolved(config) {
      sourcePath = resolveVconsoleSourcePath(config.root)
    },
    configureServer(server) {
      server.middlewares.use(PUBLIC_PATH, async (_req, res, next) => {
        try {
          const source = await fs.readFile(sourcePath)
          res.setHeader("Content-Type", "application/javascript; charset=utf-8")
          res.end(source)
        }
        catch (err) {
          next(err as Error)
        }
      })
    },
    async generateBundle() {
      const source = await fs.readFile(sourcePath)
      this.emitFile({
        type: "asset",
        fileName: "vendor/vconsole.min.js",
        source,
      })
    },
  }
}
