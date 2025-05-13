// showcase.ts

import { navibarBehavior } from "~/behaviors/navibar-behavior"
import { sharedBehavior } from "~/behaviors/shared-behavior"
import { pageStates } from "~/utils/atom-util"
import type { HappySystemAPI } from "~/requests/req-types"

Component({

  behaviors: [
    sharedBehavior(), 
    navibarBehavior
  ],

  data: {
    pState: pageStates.LOADING,
    pageName: "showcase",
    showcase: {
      operateType:"get-showcase",
      title: "留白记事作者",
      imageUrl: "/images/shared/my-wecom.jpg",
      footer: "添加时请备注 {公司+怎么称呼你} 若添加的人稍多，还需要您耐心等待，感谢理解！",
    } as HappySystemAPI.Res_GetShowcase | undefined,
  },

  lifetimes: {

    async attached() {
      setTimeout(() => {
        this.setData({ pState: pageStates.OK })
      }, 500)
    }

  },

  methods: {},
})
