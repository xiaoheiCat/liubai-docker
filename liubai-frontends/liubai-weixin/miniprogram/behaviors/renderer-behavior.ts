

export const rendererBehavior = Behavior({

  data: {
    renderer: "webview",
  },

  lifetimes: {
    attached() {
      this.setData({ renderer: this.renderer })
    }
  },

})