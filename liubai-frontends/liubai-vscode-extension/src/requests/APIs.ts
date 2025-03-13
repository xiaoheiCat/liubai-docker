
const d = LIU_ENV.API_DOMAIN ?? ""

export default {
  TIME: d + `hello-world`,
  LOGIN: d + `user-login`,
  LOGOUT: d + `user-settings`,
  SYNC_SET: d + 'sync-set',
}