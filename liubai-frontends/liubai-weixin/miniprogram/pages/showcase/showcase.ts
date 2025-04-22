// showcase.ts

import { navibarBehavior } from "../../behaviors/navibar-behavior"
import { rendererBehavior } from "../../behaviors/renderer-behavior"

Component({

  behaviors: [rendererBehavior, navibarBehavior],

  data: {},

  lifetimes: {

    async attached() {
    }

  },

  methods: {},
})
