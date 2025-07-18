import { LiuApi } from "./LiuApi"
import valTool from "./val-tool"


export class LiuTunnel {

  private static _key = ""
  private static _val: any

  static async setStuff<T>(
    key: string,
    val: T,
  ) {
    this._key = key
    this._val = val
    const res = await LiuApi.setStorage({ 
      key: "tunnel", 
      data: { val, key },
    })
    return res
  }
  
  static async takeStuff<T>(
    key: string,
  ): Promise<T | undefined> {
    if(this._key === key && this._val) {
      const val1 = valTool.copyObject(this._val)
      // console.log("LiuTunnel get val 111: ", valTool.copyObject(val1))
      this.clear()
      return val1 as T
    }

    const res = await LiuApi.getStorage({ key: "tunnel" })
    if(!res || !res.data) return

    const theKey = res.data.key
    const theVal = res.data.val
    if(theKey !== key) return

    const val2 = valTool.copyObject(theVal)
    console.log("LiuTunnel get val 222: ", val2)
    this.clear()
    return val2 as T
  }

  static clear() {
    this._key = ""
    this._val = null
    LiuApi.removeStorage({ key: "tunnel" })
  }

}