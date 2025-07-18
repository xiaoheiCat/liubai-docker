import { LiuUtil } from "../utils/liu-util/index";

const prefix = "/packageB/images"

export function getImagePath() {
  const theme = LiuUtil.getCurrentTheme()
  let imagePath = prefix
  if(theme === "dark") imagePath += "/dark-theme/"
  else imagePath += "/light-theme/"
  return imagePath
}