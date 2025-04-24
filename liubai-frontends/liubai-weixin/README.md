# 留白记事微信小程序

> [!NOTE]
> 小程序没有记事功能。

## 提前准备

请确保你的电脑已安装了 `Node.JS`, `TypeScript`, 以及 `pnpm` 

## 安装

```shell
pnpm i
pnpm pre-build
```

其中 `pnpm pre-build` 命令会运行脚本 `build/pre-build.ts`。

该脚本的主要作用为读取环境变量后，写入至 **运行时** 会用到的文件 `miniprogram/config/pre_config.ts`。
