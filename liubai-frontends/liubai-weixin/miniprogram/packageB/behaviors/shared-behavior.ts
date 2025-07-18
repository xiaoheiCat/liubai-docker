import { LiuApi } from "../utils/LiuApi"

export function sharedBehavior() {
  
  const behavior = Behavior({

    data: {
      renderer: "webview",
      pageLength: 1,
    },

    lifetimes: {
      attached() {
        const currentRenderer = this.renderer
        this.setData({ renderer: currentRenderer })
      }
    },

    pageLifetimes: {
      show() {
        const pages = LiuApi.getPages()
        const newPageLength = pages.length
        if(this.data.pageLength !== newPageLength) {
          this.setData({ pageLength: newPageLength })
        }
      }
    }

  })

  return behavior
}