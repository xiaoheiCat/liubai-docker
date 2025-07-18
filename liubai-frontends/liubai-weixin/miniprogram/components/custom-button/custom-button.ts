import { sharedBehavior } from "~/behaviors/shared-behavior";

Component({

  behaviors: [
    sharedBehavior(),
  ],

  properties: {
    btnType: {
      type: String,
      value: "main",  // main, normal, transparent
    },
    disabled: {
      type: Boolean,
      value: false,
    }
  },


})