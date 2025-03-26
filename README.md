
<div align="center">

  <img src="./assets/cover_for_github.jpeg" width="600">

  <h3>Liubai</h3>

  <p>你的笔记 + 日程 + 待办清单 + 任务 with AI</p>

  > *留白记事，放大你的能力*

</div>

<br>

## 黑板报 📢

👉 [直接使用](https://my.liubai.cc)

📥 [文档中心](https://docs.liubai.cc)

📲 [前往安装](https://docs.liubai.cc/guide/install)

🗞️ [最新功能: vscode 插件，现已上线](https://docs.liubai.cc/guide/ide/how-to-use-vscode-ext)


## 已实现 🥂

✅ 原子化附着: 文本、图片、多级标签、状态、文件

✅ 云端同步

✅ 响应式设计: 支持 300px ~ 1920px 宽度的屏幕，从 📱 到 💻

✅ AI 加持: 已连接 Baichuan / DeepSeek（包含 R1）/ Kimi / MiniMax / Stepfun / Zhipu / 01.ai 等大模型，它们被直接装在你的微信里。关于微信的部分使用官方[客服消息 API](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html)。

✅ 隐私: 支持原子化管理每张卡片，让你设置 “仅保存本地” 或 “拒绝 AI 读取”；你的数据，你的自由。

✅ 浅色/深色模式

✅ 本地优先: PWA 的 service-worker 让你断网也能使用

✅ 微信集成: 日程提醒，使用微信通知你

✅ i18n 中/英切换

✅ 富文本编辑器，支持轻量 Markdown

## 概览 📂

```
.
├─ liubai-backends
│  └─ liubai-laf
├─ liubai-docs
└─ liubai-frontends
   └─ liubai-web
   └─ liubai-vscode-extension
```

`liubai-laf` 为后端根目录，使用 [Laf](https://github.com/labring/laf) 构建；该目录下的 `cloud-functions/` 存放本项目的云函数。

`liubai-docs` 为文档根目录，使用 [VitePress](https://vitepress.dev/) 构建。

`liubai-web` 为前端根目录，主要基于 [Vue 3.x](https://vuejs.org/) + [Vite](https://vite.dev/) + [VueUse](https://vueuse.org/) + [TypeScript](https://www.typescriptlang.org/) + [Dexie.js](https://dexie.org/docs/) + [TipTap](https://tiptap.dev/) ...... 等一系列前端工具链构建，在该目录下运行 `pnpm i` 和 `pnpm dev` 即可启动留白前端。

`liubai-vscode-extension` 为 vscode 插件根目录，使用 typescript 编写，[esbuild](https://code.visualstudio.com/api/working-with-extensions/bundling-extension#using-esbuild) 打包，[vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce) 发布。该插件除了能在常见的 node 环境运行，还支持 [vscode for web](https://code.visualstudio.com/docs/editor/vscode-web)，让你在 github.dev / gitpod.io / codespaces 等浏览器 IDE 环境中也能使用。


## 保持联络 👋

<p>
  <a href="https://github.com/yenche123/liubai/discussions">
    <img src="./assets/github.png" width="320" alt="GitHub Discussions" />
  </a>
</p>

<p>
  <img src="./assets/weixin.png" width="320" alt="留白记事公众号"/>
</p>

<p>
  <a href="https://www.xiaohongshu.com/user/profile/5d1642d80000000011033c24" alt="xhs">
    <img src="./assets/xhs.png" width="320" alt="小红书 @your_liubai" />
  </a>
</p>

## 探索留白 🍭

<div align="center">

  <img src="./assets/explore/add_calendar.gif" width="380">
  <p>添加日程</p>

  <img src="./assets/explore/three_assistants.gif" width="380">
  <p>在微信里同时跟三个助手对话</p>

  <img src="./assets/explore/comment.gif" width="380">
  <p>在卡片下补充说明</p>

  <img src="./assets/explore/no_signal.gif" width="380">
  <p>离线时依然可用</p>

  <img src="./assets/explore/tap_more.gif" width="380">
  <p>原子化附着，需要时再展开</p>

  <img src="./assets/explore/calendar.gif" width="380">
  <p>自行浏览日程</p>

  <img src="./assets/explore/my_arrangement.gif" width="380">
  <p>问 AI 我的日程</p>

  <img src="./assets/explore/drawing.gif" width="380">
  <p>在微信里，直接让AI帮你作画</p>

  <img src="./assets/explore/multi_devices.gif" width="420">
  <p>多设备、全平台</p>

  <img src="./assets/explore/kanban.gif" width="420">
  <p>看板</p>

</div>

## 开源许可 📝

AGPLv3

