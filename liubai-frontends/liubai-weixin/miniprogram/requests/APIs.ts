import { envData } from "../config/env-data"

const d = envData.API_DOMAIN ?? "/"

export default {
  TIME: d + "hello-world",
  SHOWCASE: d + "happy-system",
  WEIXIN_AD: d + "happy-system",
}