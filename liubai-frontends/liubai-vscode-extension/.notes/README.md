# notes about vscode extension

## 开发备注


### 快速运行

两种方式：

1. `Fn + F5`: 这时会在新的窗口打开 Extension Development Host
2. `Cmd + Shift +P`: 打开命令面板，输入 `Debug` 选择 `Debug: Start Debugging`

### 当 .env 环境变量有修改时

请重新编辑: `pnpm compile`，否则直接 `Fn + F5` 容易报错。

### 在当前 IDE 中启动一个 Chromium 进行调试

运行 `pnpm open-in-browser`

### 在 vscode.dev 中调试

如何启动一个服务，让在线的 vscode.dev Web IDE 加载当前正在开发的 extension？运行

```bash
npx serve --cors -l 5000 --ssl-cert $HOME/certs/localhost.pem --ssl-key $HOME/certs/localhost-key.pem

npx: installed 78 in 2.196s

   ┌────────────────────────────────────────────────────┐
   │                                                    │
   │   Serving!                                         │
   │                                                    │
   │   - Local:            https://localhost:5000       │
   │   - On Your Network:  https://172.19.255.26:5000   │
   │                                                    │
   │   Copied local address to clipboard!               │
   │                                                    │
   └────────────────────────────────────────────────────┘
```

把打印出来的 `https://localhost:5000` 填充进 `vscode.dev` 的 `Developer: Install Extension from Location...` 这个命令中。

前置条件，已安装过 [mkdir](https://github.com/FiloSottile/mkcert#installation)，并且曾经运行过：

```bash
mkdir -p $HOME/certs
cd $HOME/certs
mkcert -install
mkcert localhost
```

详情见 [Test your web extension in vscode.dev](https://code.visualstudio.com/api/extension-guides/web-extensions#test-your-web-extension-in-vscode.dev)

这个方法不适用于 `github.dev` 因为它有 CORS 的限制。

### 在 VSCodium 中调试

打开 VSCodium 后，`Cmd + Shift + P` 打开命令弹窗，选择 `Developer: Install Extension from Location...` 然后定位到本插件根目录 `liubai-vscode-extension` 这样即可完成本地安装！

这样安装好的插件，在 `VSCodium` 的顶部导航栏中选择 `Help / Toggle Developer Tools` 即可看到插件打印的日志。

### 打包

全局安装 `pnpm i -g vsce` 之后，在 `liubai-vscode-extension` 目录下运行：

```shell
vsce package --no-dependencies
```

这个命令会检测 `package.json` 的 `scripts` 字段，找到 `vscode:prepublish` 命令，然后执行它。





