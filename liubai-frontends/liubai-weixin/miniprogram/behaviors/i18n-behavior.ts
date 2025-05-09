import { LiuApi } from "../utils/LiuApi"
import { getLocale, FALLBACK_LANGUAGE } from "../locales/index"
import valTool from "../utils/val-tool"

function getFileJson(
  fs: WechatMiniprogram.FileSystemManager,
  filePath: string,
) {
  let obj: Record<string, any> | undefined
  try {
    const content1 = fs.readFileSync(filePath, "utf-8")
    if(!content1) return
    if(typeof content1 !== "string") return
    obj = valTool.strToObj(content1) as Record<string, any>
  }
  catch(err) {
    console.warn("read file error")
    console.log(err)
  }
  return obj
}


export const i18nBehavior = (
  key: string,
  dirPath = "/locales/messages/",
) => {
  const fs = LiuApi.getFileSystemManager()
  let the_t: Record<string, string> | undefined

  let locale = getLocale()
  let filePath = `${dirPath}${locale}.json`

  // 1. read file
  const obj1 = getFileJson(fs, filePath)
  if(obj1 && obj1[key]) {
    the_t = obj1[key]
  }

  // 2. read fallback file
  if(!the_t && locale !== FALLBACK_LANGUAGE) {
    locale = FALLBACK_LANGUAGE
    filePath = `${dirPath}${locale}.json`
    const obj2 = getFileJson(fs, filePath)
    if(obj2 && obj2[key]) {
      the_t = obj2[key]
    }
  }

  // 3. return behavior
  const behavior = Behavior({
    data: {
      locale,
      t: the_t ?? {},
    },
    pageLifetimes: {
      show() {
        const currentLocale = getLocale()
        if(currentLocale === this.data.locale) return

        locale = currentLocale
        filePath = `${dirPath}${locale}.json`
        
        const obj3 = getFileJson(fs, filePath)
        if(obj3 && obj3[key]) {
          this.setData({ t: obj3[key], locale })
        }
      }
    }
  })

  return behavior
}