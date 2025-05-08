// app.ts
import { useApp } from "./utils/useApp"

App({
  
  globalData: {
    appName: "liubai",
  },

  onLaunch() {
    useApp()
  },
})