import { navibarBehavior } from "~/behaviors/navibar-behavior";
import { i18nBehavior } from "~/packageA/behaviors/i18n-behavior";

Component({

  behaviors: [
    i18nBehavior("watch-video"),
    navibarBehavior,
  ],


})