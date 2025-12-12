# liubai-web

这里是留白记事前端根目录。

## 开箱即用

留白记事支持完全离线使用。

你只需要以下 4 行命令：

```bash
git clone git@github.com:yenche123/liubai.git
cd liubai/liubai-frontends/liubai-web/

# 使用 pnpm
pnpm i
pnpm run dev

# 或者使用 bun
bun i
bun run dev
```

> ⚠️ 注意：请不要混用 `pnpm` 和 `bun`，请择一使用，否则可能会出现重复安装依赖，进而导致 typescript 静态编译时不知道使用哪一个依赖的情况。

无需配置任何环境变量，即可拥有一个完全本地版的留白。