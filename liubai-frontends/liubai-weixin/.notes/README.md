# 开发记录

## appid

测试号: wx3dfa900a49a77d46

正式号: wx07b7b80fa022b132


## 路径中的参数含义

### index?key1=

`key1`: 表示打开 showcase

### index?key2=

`CREATE_TASK`: 拉起 wx.openChatTool 去创建任务

### watch-video?r=

`r`: 表示 room id

## 图标

用 96dp 的大小。

### 深色模式

图标轮廓色: #E7E9EA

### 浅色模式

图标轮廓色: #1F2429


## 注意事项

### hover-class 读取不到 app.wxss 里的声明

所以我们需要把全局的 `custom-styles.wxss` 文件，在每个页面或组件里引入，比如

```some-page.wxss
@import "../../styles/custom-styles.wxss";
```


### Skyline 暂不支持 setInitialRenderingCache

see https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/glass-easel/migration.html


