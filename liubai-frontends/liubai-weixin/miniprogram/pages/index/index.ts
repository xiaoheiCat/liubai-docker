// index.ts

import { i18nBehavior } from "../../behaviors/i18n-behavior"
import { navibarBehavior } from "../../behaviors/navibar-behavior"
import { sharedBehavior } from "../../behaviors/shared-behavior"

Component({

  data: {},

  behaviors: [
    i18nBehavior("index"),
    navibarBehavior,
    sharedBehavior(),
  ],

  lifetimes: {

    attached() {

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
