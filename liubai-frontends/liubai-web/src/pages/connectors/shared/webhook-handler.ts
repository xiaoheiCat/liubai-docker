

export class WebhookHandler {

  static wpsDomains = ["kdocs.cn", "wps.cn"]
  static dingtalkDomains = ["dingtalk.com"]

  private static _checkWebhookUrl(
    link: string,
    domains: string[],
  ) {
    try {
      const url1 = new URL(link)
      const origin = url1.origin
      const domain = domains.find(d => {
        const d1 = "." + d
        const res1 = origin.endsWith(d1)
        if(res1) return true
        const d2 = "/" + d
        const res2 = origin.endsWith(d2)
        return res2
      })
      return Boolean(domain)
    }
    catch(err) {
      console.warn("_checkWebhookUrl error: ", err)
    }
    return false

  }

  static isWpsWebhookUrl(link: string) {
    const list = this.wpsDomains
    const res = this._checkWebhookUrl(link, list)
    return res
  }

  static isDingTalkWebhookUrl(link: string) {
    const list = this.dingtalkDomains
    const res = this._checkWebhookUrl(link, list)
    return res
  }

}
