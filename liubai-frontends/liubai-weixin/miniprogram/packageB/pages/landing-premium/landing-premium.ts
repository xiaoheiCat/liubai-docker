import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior"
import { themeBehavior } from "~/packageA/behaviors/theme-behavior"

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("landing-premium"),
    navibarBehavior(),
    themeBehavior(),
  ],
  
  data: {
    pageName: "landing-premium",
  },

  methods: {


  },


})