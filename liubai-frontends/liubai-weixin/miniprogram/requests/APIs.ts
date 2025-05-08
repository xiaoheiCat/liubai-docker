import { cfg } from "../config/index"

const d = cfg.API_DOMAIN ?? "/"

export default {
  TIME: d + "hello-world",
  SHOWCASE: d + "happy-system",
}