# 留小白的抽屉

> 留小白的抽屉，让你在微信上做任务管理！

<img src="./images/minicode.png" width="200" />

我们使用了微信小程序 [聊天工具 API](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/chatTool.html)，让你可以直接选择微信上的联络人（包含群聊），即使在对方没有使用过小程序的情况下，也可将任务分派给他/她！

## 隐私

根据聊天工具 API，开发者只会获取到三种 id 信息：

- `opengid`: 微信群的唯一标识
- `open_single_roomid`: 单聊的唯一标识
- `group_openid`: 微信用户在此聊天室下的唯一标识，同一个用户在不同的聊天室下 id 不同

其他隐私信息，诸如用户昵称、头像和群聊名，开发者皆无法获取，而是交由微信小程序的 [open-data-list](https://developers.weixin.qq.com/miniprogram/dev/component/open-data-list.html)、[open-data-item
](https://developers.weixin.qq.com/miniprogram/dev/component/open-data-item.html) 和 [open-data](https://developers.weixin.qq.com/miniprogram/dev/component/open-data.html) 组件渲染而成。


## 自行安装和部署

请确保你的电脑已安装了 `Node.JS`, `TypeScript`, 以及 `bun` 

### 前端（微信小程序）

定位到当前目录 `liubai-weixin`，然后执行

```shell
bun install
bun run pre-build
```

其中 `bun run pre-build` 命令会运行脚本 `build/pre-build.ts`。

该脚本的主要作用为读取环境变量后，写入至 **运行时** 会用到的文件 `miniprogram/config/pre_config.ts`。

### 后端

参见 [liubai-laf](https://github.com/yenche123/liubai/tree/cool/liubai-backends/liubai-laf)。

## 开源协议

AGPLv3