import { navibarBehavior } from "../../behaviors/navibar-behavior";
import { i18nBehavior } from "../../behaviors/i18n-behavior";
import { themeBehavior } from "../../behaviors/theme-behavior";
import { pageBehavior } from "../../behaviors/page-behavior";

Component({

  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [
    i18nBehavior("task-date-time"),
    navibarBehavior(),
    themeBehavior(),
    pageBehavior(),
  ],

  data: {
    pageName: "task-date-time",
  },


})