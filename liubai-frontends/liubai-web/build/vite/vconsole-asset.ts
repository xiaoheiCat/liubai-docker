import type { Plugin } from "vite"
import { promises as fs } from "node:fs"
import path from "node:path"

const PUBLIC_PATH = "/vendor/vconsole.min.js"

export function vconsoleAsset(): Plugin {
  let root = ""
  let sourcePath = ""

  return {
    name: "vconsole-asset",
    configResolved(config) {
      root = config.root
      sourcePath = path.join(root, "node_modules/vconsole/dist/vconsole.min.js")
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
