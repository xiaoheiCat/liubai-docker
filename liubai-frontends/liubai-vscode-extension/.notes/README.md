# notes about vscode extension

## 开发备注


### 快速运行

两种方式：

1. `Fn + F5`: 这时会在新的窗口打开 Extension Development Host
2. `Cmd + Shift +P`: 打开命令面板，输入 `Debug` 选择 `Debug: Start Debugging`

### 当 .env 环境变量有修改时

请重新编辑: `bun run compile`，否则直接 `Fn + F5` 容易报错。

### 在当前 IDE 中启动一个 Chromium 进行调试

运行 `bun run open-in-browser`

### 在 vscode.dev 中调试

#### 前置条件

安装 [mkdir](https://github.com/FiloSottile/mkcert#installation)，并且运行

```bash
mkdir -p $HOME/certs
cd $HOME/certs
mkcert -install
mkcert localhost
```

详情见 [Test your web extension in vscode.dev](https://code.visualstudio.com/api/extension-guides/web-extensions#test-your-web-extension-in-vscode.dev)

这个方法不适用于 `github.dev` 因为它有 CORS 的限制。

#### 开始

如何启动一个服务，让在线的 vscode.dev Web IDE 加载当前正在开发的 extension？运行

```bash
bunx serve --cors -l 5000 --ssl-cert $HOME/certs/localhost.pem --ssl-key $HOME/certs/localhost-key.pem

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


### 在 VSCodium 中调试

打开 VSCodium 后，`Cmd + Shift + P` 打开命令弹窗，选择 `Developer: Install Extension from Location...` 然后定位到本插件根目录 `liubai-vscode-extension` 这样即可完成本地安装！

这样安装好的插件，在 `VSCodium` 的顶部导航栏中选择 `Help / Toggle Developer Tools` 即可看到插件打印的日志。

### 打包

在 `liubai-vscode-extension` 目录下运行：

```shell
bunx @vscode/vsce package --no-dependencies
```

这个命令会检测 `package.json` 的 `scripts` 字段，找到 `vscode:prepublish` 命令，然后执行它。


## 小知识

在 `package.json` 中，有一行脚本命令是

```json
{
   "scripts": {
      "test": "vscode-test"
   }
}
```

全局搜索 `vscode-test` 是找不到该命令的，那是因为它是由 `@vscode/test-cli` 在其 `package.json` 中用 `bin` 字段注册的：

```json
{
   "bin": {
    "vscode-test": "./out/bin.mjs"
  }
}
```

这会导致我们运行 `bun run test` 时，实际执行流程为：

1. bun 开始查找当前目录 `package.json` 中的 "test" 脚本
2. 发现脚本内容是 "vscode-test"
3. bun 会自动在以下位置按顺序查找可执行文件:
   - 项目的 node_modules/.bin 目录
   - 全局安装的 node_modules/.bin 目录
   - 系统 PATH 环境变量
4. 在项目的 `node_modules/.bin` 文件夹中找到可执行文件 `vscode-test`
5. 进而得知是 `@vscode/test-cli` 注册的
6. 再进而得知要运行 `@vscode/test-cli` 的 `./out/bin.mjs` 文件

从而开始运行 `@vscode/test-cli` 所定义的 `./out/bin.mjs` 文件
