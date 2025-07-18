import { getImagePath } from "../images/index";
import { getThemeBehavior } from "../utils/theme-util";

export function themeBehavior() {
  const res = getThemeBehavior(getImagePath)
  return res
}