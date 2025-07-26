import { LiuApi } from "../utils/LiuApi"
import valTool from "../utils/val-tool"
import type { BoundingClientRectResolver } from "../types"
import type { NbData } from "./tools/types"
import { defaultData } from "../config/default-data"

const defaultHeight3 = 600

export function navibarBehavior() {

  const behavior = Behavior({

    data: {
      height1: 0,      // 通常指状态栏的高度
      height2: 33,     // 通常指胶囊的高度
      height3: defaultHeight3,    // 通常指 页面高度 - 状态栏高度 - 胶囊高度
      lastResizeTimeout: 0,
      visible: true,
      alwaysArrowBack: false,
    },
  
    lifetimes: {
      attached() {
        this.calculateHeight()
      },
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
      },

      async routeDone() {
        await valTool.waitMilli(defaultData.frame_duration)
        this.calculateHeight()
      },
    },
  
    methods: {
    
      async calculateHeight() {

        // 1. get window and screen info
        const sizeInfo = LiuApi.getWindowInfo()
        // console.log("sizeInfo: ", sizeInfo)

        // 2. get menu button info
        const menuButtonInfo = LiuApi.getMenuButtonBoundingClientRect()
        // console.log("menuButtonInfo: ", menuButtonInfo)

        // 3. get enter options & api category
        const enterData = LiuApi.getEnterOptionsSync()
        const apiCategory = LiuApi.getApiCategory()
        const mode = enterData.mode
        // console.log("apiCategory: ", apiCategory)

        // 4. get scroll view info
        const pageInfo = await this.getSvBoundingClientRect()
        // console.log("pageInfo: ", pageInfo)

        // 5. get default heigh1 & height2
        const statusBarHeight = sizeInfo?.statusBarHeight ?? 0
        const safeArea = sizeInfo?.safeArea
        const safeTop = safeArea?.top ?? 0
        const mbTop = menuButtonInfo?.top ?? 0
        const mbHeight = menuButtonInfo.height ?? 0
        let height1 = Math.max(safeTop, mbTop)
        let height2 = mbHeight
        let height3 = pageInfo?.height ?? defaultHeight3


        // 6. check if we need to consider status bar
        let alwaysArrowBack = false
        const windowHeight = sizeInfo?.windowHeight ?? defaultData.windowHeight
        const screenHeight = sizeInfo?.screenHeight ?? defaultData.screenHeight
        const scrollViewHeight = pageInfo?.height ?? windowHeight
        let considerStatusBar = Boolean(statusBarHeight)
        if (apiCategory !== "browseOnly") {
          if (scrollViewHeight + 48 < windowHeight) {
            considerStatusBar = false
          }
          if (windowHeight + 88 < screenHeight) {
            considerStatusBar = false
          }
        }

        // console.log("considerStatusBar: ", considerStatusBar)


        // 7.1 consider status bar or not
        if (considerStatusBar) {
          alwaysArrowBack = true
          if (height1 > 10) {
            height1 -= 6
            height2 += 12
          }
        }
        else {
          // console.log(height2, mbTop, mbHeight)
          height2 = mbTop + mbHeight
          height2 = Math.max(height1, height2)
          if (mbTop <= 12) height2 += mbTop
          height2 = Math.min(52, height2)
          height1 = 9
        }

        // 7.2 consider visibility
        const newData: Partial<NbData> = {}
        if (apiCategory === "browseOnly") {
          newData.visible = false
        }
        if (apiCategory === "nativeFunctionalized" && mode === "halfPage") {
          newData.visible = false
        }
        if (alwaysArrowBack !== this.data.alwaysArrowBack) {
          newData.alwaysArrowBack = alwaysArrowBack
        }

        // 8. get to set data
        if (height1 >= 0) {
          newData.height1 = height1
          height3 -= height1
        }
        if (height2 >= 0) {
          newData.height2 = height2
          height3 -= height2
        }
        height3 = Math.max(0, height3)
        newData.height3 = height3

        // console.log("see new data: ", newData)

        if (valTool.objHasAnyKey(newData)) {
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
        if (pages.length > 1) {
          LiuApi.navigateBack()
          return
        }
        LiuApi.reLaunch({ url: defaultData.homePath })
      },
    },
  })

  return behavior
}