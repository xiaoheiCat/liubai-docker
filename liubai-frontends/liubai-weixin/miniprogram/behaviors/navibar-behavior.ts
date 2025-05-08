import { LiuApi } from "../utils/LiuApi"
import valTool from "../utils/val-tool"
import type { BoundingClientRectResolver } from "../types"
import type { NbData } from "./tools/types"
import { LiuUtil } from "../utils/liu-util/index"

export const navibarBehavior = Behavior({

  data: {
    height1: 0,     // 通常指状态栏的高度
    height2: 33,     // 通常指胶囊的高度
    lastResizeTimeout: 0,
    showTitle: true,
  },

  lifetimes: {
    attached() {
      this.calculateHeight()
    }
  },

  pageLifetimes: {

    resize() {
      const _this = this
      if(this.data.lastResizeTimeout) {
        clearTimeout(this.data.lastResizeTimeout)
      }
      this.data.lastResizeTimeout = setTimeout(() => {
        _this.data.lastResizeTimeout = 0
        _this.calculateHeight()
      }, 450)
    }
  },

  methods: {
  
      async calculateHeight() {
  
        // 1. get window and screen info
        const sizeInfo = LiuApi.getWindowInfo()
        console.log("sizeInfo: ", sizeInfo)
  
        // 2. get menu button info
        const menuButtonInfo = LiuApi.getMenuButtonBoundingClientRect()
        console.log("menuButtonInfo: ", menuButtonInfo)

        // 3.1 get enter options
        const enterData = LiuApi.getEnterOptionsSync()
        const apiCategory = enterData.apiCategory
        const mode = enterData.mode
        console.log("enterData: ", enterData)

        // 3.2 get our characteristic
        const cha = LiuUtil.getCharacteristic()
        console.log("cha: ", cha)

        // 4. get scroll view info
        const pageInfo = await this.getSvBoundingClientRect()
        
        console.log("pageInfo: ", pageInfo)

        // 5. get default heigh1 & height2
        const safeArea = sizeInfo.safeArea ?? {}
        const safeTop = safeArea?.top ?? 0
        const mbTop = menuButtonInfo?.top ?? 0
        const mbHeight = menuButtonInfo.height ?? 0
        let height1 = Math.max(safeTop, mbTop)
        let height2 = mbHeight

        // 6. check if we need to consider status bar
        const windowHeight = sizeInfo.windowHeight
        const screenHeight = sizeInfo.screenHeight
        const scrollViewHeight = pageInfo?.height ?? windowHeight
        let considerStatusBar = Boolean(cha.isMobile)
        if(apiCategory !== "browseOnly") {
          if(scrollViewHeight + 60 < windowHeight) {
            considerStatusBar = false
          }
          if(windowHeight + 100 < screenHeight) {
            considerStatusBar = false
          }
        }

        console.log("considerStatusBar: ", considerStatusBar)
        

        // 7.1 consider status bar or not
        if(considerStatusBar) {
          if(height1 > 10) {
            height1 -= 5
            height2 += 10
          }
        }
        else {
          height2 = Math.max(height1, height2)
          height1 = 0
        }
  
        // 8. get to set data
        const newData: Partial<NbData> = {}
        if(height1 >= 0) newData.height1 = height1
        if(height2 >= 0) newData.height2 = height2
        if(apiCategory === "browseOnly") {
          newData.showTitle = false
        }
        if(apiCategory === "nativeFunctionalized" && mode === "halfPage") {
          newData.showTitle = false
        }

        if(valTool.objHasAnyKey(newData)) {
          this.setData(newData)
        }
      },
  
  
      getSvBoundingClientRect() {
        const nodesRef = this.createSelectorQuery().select(".liu-scroll-view")
        const _wait = (a: BoundingClientRectResolver) => {
          nodesRef.boundingClientRect((res) => {
            a(res)
          }).exec()
        }
        return new Promise(_wait)
      },


      onTapBack() {
        const pages = LiuApi.getPages()
        if(pages.length > 1) {
          LiuApi.navigateBack()
          return
        }
        LiuApi.reLaunch({ url: "/pages/index/index" })
      },
  
    },
  
})