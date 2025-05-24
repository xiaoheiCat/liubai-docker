import type { GetImagePath } from "~/types/index";
import { LiuUtil } from "~/utils/liu-util/index";


export function getThemeBehavior(
  getImagePath: GetImagePath,
) {
  const theme = LiuUtil.getCurrentTheme()
  const imagePath = getImagePath()

  const behavior = Behavior({
    data: {
      theme,
      imagePath,
    },

    pageLifetimes: {
      show() {
        this.calculateTheme()
      }
    },

    lifetimes: {
      attached() {
        this.calculateTheme()
      }
    },


    methods: {
      calculateTheme() {
        const newTheme = LiuUtil.getCurrentTheme()
        if(newTheme === this.data.theme) return
        const newImagePath = getImagePath()
        this.setData({ theme: newTheme, imagePath: newImagePath })
      }
    },

  })

  return behavior
}