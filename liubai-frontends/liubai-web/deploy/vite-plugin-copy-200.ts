import type { Plugin } from 'vite'
import { promises as fs } from 'fs'
import path from 'path'

// we have to copy index.html to 200.html, because surge.sh
// https://surge.sh/help/adding-a-200-page-for-client-side-routing

export default function copy200Html(): Plugin {
  return {
    name: 'copy-200-html',
    closeBundle: async () => {
      const distDir = path.resolve(__dirname, '../dist')
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
