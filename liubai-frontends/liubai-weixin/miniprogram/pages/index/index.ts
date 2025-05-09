// index.ts

import { i18nBehavior } from "../../behaviors/i18n-behavior"

Component({

  data: {},

  behaviors: [
    i18nBehavior("hello")
  ],

  lifetimes: {

    attached() {

      const nodesRef = this.createSelectorQuery().select(".liu-scroll-view")
      nodesRef.boundingClientRect(res => {
        console.log("boundingClientRect res: ", res)
      }).exec()

    },

  },

  methods: {

    goToShowcase() {
      wx.navigateTo({
        url: '/pages/showcase/showcase',
        // wx://bottom-sheet  wx://modal  wx://cupertino-modal  wx://upwards
        routeType: "wx://cupertino-modal",        
        routeConfig: {
          barrierColor: "rgba(0, 0, 0, 0.5)",
          barrierDismissible: true,
          popGestureDirection: "multi",
          fullscreenDrag: false,
        },
        routeOptions: {
          round: true,
          height: 75,
        },
      })
    }

  },
})
