import { LiuUtil } from "~/utils/liu-util/index";

export function getImagePath() {
  const theme = LiuUtil.getCurrentTheme()
  let imagePath = "/images"
  if(theme === "dark") imagePath += "/dark-theme/"
  else imagePath += "/light-theme/"
  return imagePath
}