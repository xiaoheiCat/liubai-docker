import { navibarBehavior } from "~/behaviors/navibar-behavior";
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior";
import { themeBehavior } from "~/packageA/behaviors/theme-behavior";
import { useCsOnLoad } from "./tools/useCouponSearch";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("watch-video"),
    navibarBehavior(),
    themeBehavior(),
  ],

  methods: {

    onLoad() {
      useCsOnLoad()
    }


  },


})