import { envData } from "../config/env-data"

const d = envData.API_DOMAIN ?? "/"

export default {
  LOGIN: d + "user-login",
  TIME: d + "hello-world",
  SHOWCASE: d + "happy-system",
  WEIXIN_AD: d + "happy-system",
  UPLOAD_FILE: d + "file-set",
  USER_SETTINGS: d + "user-settings",
  HAPPY_SYSTEM: d + "happy-system",
  PPL_TASKS: d + "people-tasks",
}