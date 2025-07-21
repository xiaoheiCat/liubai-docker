
export const defaultData = {
  language: "zh-CN",
  theme: "light",
  minSDKVersion: "3.7.8",
  windowHeight: 650,
  screenHeight: 650,
  homePath: "/pages/index/index",
  imageRatio: "150%",
  frame_duration: 12,
  duration_ms_1: 150,     // 一个常用的等待时间，目前用于刷新图片的间隔
  duration_ms_2: 500,     // 一个常用的等待时间，用于一些后台请求，去分散频繁调用网络所使用

  task_tmpl_id: "4A68CBB88A92B0A9311848DBA1E94A199B166463",
  activity_tmpl_id: "2A84254B945674A2F88CE4970782C402795EB607",

  issue_1: "https://developers.weixin.qq.com/community/develop/doc/000c6c6fe4cb584cc093b65b06bc00",
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