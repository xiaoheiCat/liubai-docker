// showcase.ts

import { navibarBehavior } from "../../behaviors/navibar-behavior"
import { rendererBehavior } from "../../behaviors/renderer-behavior"
import { pageStates } from "../../utils/atom-util"

Component({

  behaviors: [rendererBehavior, navibarBehavior],

  data: {
    pState: pageStates.LOADING,
  },

  lifetimes: {

    async attached() {
      setTimeout(() => {
        this.setData({ pState: pageStates.OK })
      }, 2000)
    }

  },

  methods: {},
})
