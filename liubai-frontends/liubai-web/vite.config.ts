import { 
  defineConfig, 
  loadEnv,
  type PluginOption,
  type UserConfig,
} from 'vite'
import { resolve } from "node:path"
import vue from '@vitejs/plugin-vue'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import mkcert from 'vite-plugin-mkcert'
import { compression as viteCompression } from 'vite-plugin-compression2'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import Inspect from 'vite-plugin-inspect'
import { qrcode } from 'vite-plugin-qrcode';
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from "@sentry/vite-plugin"
import copy200Html from './deploy/vite-plugin-copy-200'

const { version, author } = require("./package.json")
const projectRoot = process.cwd()

const vitePlugins: UserConfig['plugins'] = [
  Inspect(),

  vue(),

  viteCompression({
    threshold: 2048,
  }),

  // vue-i18n 插件
  VueI18n({
    runtimeOnly: true,
    compositionOnly: true,
    include: [
      resolve(projectRoot, "src/locales/messages/**")
    ]
  }),

  // 使用 SSL
  // mkcert(),

  // PWA
  VitePWA({
    registerType: "prompt",
    manifest: false,
    strategies: "injectManifest",
    srcDir: "src",
    filename: "service-worker.ts",
    injectManifest: {
      minify: true,
      globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg}'],
    },

    // open it if you want to test service worker update on dev mode
    // devOptions: {
    //   enabled: true,
    //   type: 'module',
    //   navigateFallback: 'index.html',
    // },
  }),

  // 使用 svg 雪碧图
  createSvgIconsPlugin({
    iconDirs: [resolve(process.cwd(), 'src/assets/icons')],
    symbolId: 'icon-[dir]-[name]',
  }),

  // show qrcode in dev mode
  qrcode(),

  // visualize the result of building
  visualizer({
    filename: "analysis.html", // 文件名称
    title: "Liubai Frontend Analysis",
  }) as unknown as PluginOption,

  copy200Html(),

]

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const nodeVersion = process.version
  console.log("the current node version: ", nodeVersion)

  const _env = loadEnv(mode, projectRoot)
  const isProduction = mode === "production"
  if(command === "build" && isProduction) {
    // source maps for sentry
    const {
      VITE_SENTRY_SOURCEMAPS: ssmaps,
      VITE_SENTRY_ORG,
      VITE_SENTRY_PROJECT,
    } = _env

    if(ssmaps === "01" && VITE_SENTRY_ORG && VITE_SENTRY_PROJECT) {
      const _sentry = sentryVitePlugin({
        org: _env.VITE_SENTRY_ORG,
        project: _env.VITE_SENTRY_PROJECT,
        telemetry: false,
      })
      vitePlugins.push(_sentry)
    }
  }

  return {
    resolve: {
      alias: {
        '~/': `${resolve(projectRoot, 'src')}/`,
      },
      dedupe: [
        '@tiptap/core',
        '@tiptap/pm',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extensions',
        '@tiptap/extension-blockquote',
        '@tiptap/extension-bold',
        '@tiptap/extension-bullet-list',
        '@tiptap/extension-code',
        '@tiptap/extension-code-block',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-document',
        '@tiptap/extension-dropcursor',
        '@tiptap/extension-gapcursor',
        '@tiptap/extension-hard-break',
        '@tiptap/extension-heading',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-italic',
        '@tiptap/extension-link',
        '@tiptap/extension-list',
        '@tiptap/extension-list-item',
        '@tiptap/extension-list-keymap',
        '@tiptap/extension-ordered-list',
        '@tiptap/extension-paragraph',
        '@tiptap/extension-strike',
        '@tiptap/extension-text',
        '@tiptap/extension-underline',
      ],
    },
  
    plugins: vitePlugins,
  
    server: {
      host: true,
      port: 5175,
    },
  
    build: {
      sourcemap: true,
    },
  
    preview: {
      port: 4175,
    },

    css: {
      preprocessorOptions: {
        scss: {},
        sass: {}
      }
    },
    
    define: {
      "LIU_ENV": {
        version,
        author,
        "client": "web",
      }
    }
  }
})
