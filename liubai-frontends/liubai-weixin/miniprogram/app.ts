// app.ts
import { cfg } from "./config/index"

App({
  
  globalData: {
    appName: "liubai",
  },

  onLaunch() {

    console.warn("let me see cfg: ")
    console.log(cfg)
    
  },
})