import type { Plugin } from 'vite'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// we have to copy index.html to 200.html, because surge.sh
// https://surge.sh/help/adding-a-200-page-for-client-side-routing

export default function copy200Html(): Plugin {

  let distDir = ""

  return {
    name: 'copy-200-html',
    apply: "build",
    configResolved(resolved) {
      const root = resolved.root
      const outDir = resolved.build.outDir
      distDir = path.join(root, outDir)
    },
    closeBundle: async () => {
      const indexPath = path.join(distDir, 'index.html')
      const targetPath = path.join(distDir, '200.html')

      try {
        let content = await fs.readFile(indexPath, 'utf-8')
        content += `\n<!-- The file is for surge: https://surge.sh/help/adding-a-200-page-for-client-side-routing -->`
        await fs.writeFile(targetPath, content, 'utf-8')
      } catch (err) {
        console.warn('❌ Fail to create 200.html for Surge: ', err)
      }
    }
  }
}
