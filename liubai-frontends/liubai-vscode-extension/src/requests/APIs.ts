import liuEnv from "~/utils/liu-env"

const customEnv = liuEnv.getEnv()
const d = customEnv.apiDomain ?? ""

export default {
  TIME: d + `hello-world`,
  LOGIN: d + `user-login`,
  LOGOUT: d + `user-settings`,
  USER_ENTER: d + `user-settings`,
  SYNC_SET: d + 'sync-set',
}