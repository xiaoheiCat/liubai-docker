
export const defaultData = {
  language: "zh-CN",
  theme: "light",
  minSDKVersion: "3.0.1",
  windowHeight: 650,
  screenHeight: 650,
  homePath: "/pages/index/index",
  followArticleLink: "https://mp.weixin.qq.com/s/Nd3q4LKT_rJoMNo-AU-uuw",
  imageRatio: "150%",
  frame_duration: 12,
  duration_ms_1: 150,     // 一个常用的等待时间，目前用于刷新图片的间隔
  duration_ms_2: 500,     // 一个常用的等待时间，用于一些后台请求，去分散频繁调用网络所使用
  timeline_title: "直接在微信上，做任务管理！",

  // video
  max_conversation_count_from_ad: 10,
}

export const colorData = {
  light: {
    primary_color: "#2a6885",
    main_note: "#ababab",
  },
  dark: {
    primary_color: "#88d1ff",
    main_note: "#686868",
  }
}