import { setNaviForNewTheme } from "../utils/theme-util"
import valTool from "../utils/val-tool"

async function waitAndUpdateNavibarColor() {
  await valTool.waitMilli(600)
  setNaviForNewTheme()
}

export function pageBehavior() {
  const behavior = Behavior({
    pageLifetimes: {
      show() {
        waitAndUpdateNavibarColor()
      }
    },
  })

  return behavior
}