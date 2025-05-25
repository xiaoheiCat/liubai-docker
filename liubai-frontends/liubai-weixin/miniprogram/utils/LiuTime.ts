

export class LiuTime {

  static diff = 0
  static SECOND = 1000
  static MINUTE = 60 * this.SECOND
  static HOUR = 60 * this.MINUTE

  static getLocalTime() {
    return new Date().getTime()
  }

  static getTime() {
    return new Date().getTime() + this.diff
  }

  static getTimezone() {
    const d = new Date()
    const t = d.getTimezoneOffset()
    const t2 = -t / 60
    return t2
  }

  static setDiff(val: number) {
    this.diff = val
  }

  static isWithinMillis(
    stamp: number,
    ms: number,
    onlyLocal = false,
  ) {
    const now = onlyLocal ? LiuTime.getLocalTime() : LiuTime.getTime()
    const diff = now - stamp
    if (diff < ms) return true
    return false
  }

}