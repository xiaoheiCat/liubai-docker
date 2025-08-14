import { i18nBehavior } from "~/packageB/behaviors/i18n-behavior";
import { navibarBehavior } from "~/packageB/behaviors/navibar-behavior";
import { pageBehavior } from "~/packageB/behaviors/page-behavior";
import { themeBehavior } from "~/packageB/behaviors/theme-behavior";


Component({

  behaviors: [
    i18nBehavior("task-add-note"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],


  data: {

  },

  methods: {

  },

})