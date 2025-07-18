
const waitMilli = (milli = 0): Promise<true> => {
  const _t = (a: (a1: true) => void) => {
    setTimeout(() => {
      a(true)
    }, milli)
  }

  return new Promise(_t)
}


// 不要使用 js runtime 的 structuredClone() 进行复制
// 因为 reactive（Proxy）“响应性” 复制后依然存在，但理应不该存在
const copyObject = <T = any>(obj: T): T => {
  const type = typeof obj
  if(type !== "object") return obj

  let obj2: T;
  try {
    obj2 = JSON.parse(JSON.stringify(obj))
  }
  catch(err) {
    return obj
  }
  return obj2
}

// 将字符串 转为 object
const strToObj = <T = any>(str: string): T => {
  let res = {}
  try {
    res = JSON.parse(str)
  }
  catch(err) {}
  return res as T
}

/**
 * 将对象转为 object
 * 若转换失败，返回空字符
 */
const objToStr = <T = any>(obj: T): string => {
  let str = ``
  try {
    str = JSON.stringify(obj)
  }
  catch(err) {}
  return str
}

// 快速把入参 val 包裹在 Promise 里返回
const getPromise = <T = any>(val: T): Promise<T> => {
  return new Promise(a => a(val)) 
}


const numToFix = (num: number, fix: number): number => {
  const str = num.toFixed(fix)
  return Number(str)
}

const isStringAsNumber = (str: string) => {
  str = str.trim()
  if(!str) return false
  const num = Number(str)
  if(isNaN(num)) return false
  return true
}

const format0 = (val: string | number): string => {
  if(typeof val === "number") {
    if(val < 10) return "0" + val
    return "" + val  
  }
  if(val.length < 2) return "0" + val
  return val
}

const getChineseCharNum = (val: string) => {
  if(!val) return 0
  let num = 0
  for(let i=0; i<val.length; i++) {
    if(val.charCodeAt(i) >= 10000) num++
  }
  return num
}

const isAllEnglishChar = (val: string) => {
  const regex = /^[a-zA-Z]+$/
  return regex.test(val)
}

const getTextCharNum = (val: string) => {
  let num = 0
  for(let i=0; i<val.length; i++) {
    const v = val[i]
    if(getChineseCharNum(v) > 0) num += 2
    else num += 1
  }
  return num
}

const getLowerCaseNum = (text: string): number => {
  if(!text || text.length < 1) return 0
  const list = text.split("")
  let num = 0
  list.forEach(v => {
    if(v >= "a" && v <= "z") num++
  })
  return num
}

const getValInMinAndMax = (val: number, min: number, max: number): number => {
  if(val < min) return min
  if(val > max) return max
  return val
}

const isAIncludedInB = (a: Record<string, any>, b: Record<string, any>): boolean => {
  for(const key in a) {
    if(a[key] !== b[key]) return false
  }
  return true
}

const getSuffix = (name: string): string => {
  const arr = /\.([\w]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  return format
}

const isInDomain = (
  hostname: string,
  domain: string
) => {
  if(hostname === domain) return true

  // 把 www. 去掉
  const dList = domain.split(".")
  if(dList.length === 3) {
    if(dList[0] === "www") {
      domain = dList[1] + "." + dList[2]
    }
  }

  const firChar = domain[0]
  domain = firChar === "." ? domain : (`.${domain}`)
  hostname = `.${hostname}`

  if(hostname === domain) return true

  const hLen = hostname.length
  const dLen = domain.length
  if(hLen < dLen) return false
  const lastOfHostname = hostname.substring(hLen - dLen)
  return lastOfHostname === domain
}

const minusAndMinimumZero = (
  oldVal: number | undefined,
  subtrahend = 1,
) => {
  if(!oldVal) return 0
  const newVal = oldVal - subtrahend
  if(newVal < 0) return 0
  return newVal
}

const compareVersion = (v1: string, v2: string) => {
  const list1 = v1.split('.')
  const list2 = v2.split('.')
  const len = Math.max(list1.length, list2.length)
  while (list1.length < len) {
    list1.push('0')
  }
  while (list2.length < len) {
    list2.push('0')
  }
  for (let i = 0; i < len; i++) {
    const num1 = Number.parseInt(list1[i])
    const num2 = Number.parseInt(list2[i])
    
    if(num1 > num2) return 1
    if(num1 < num2) return -1
  }

  return 0
}

const uniqueArray = (arr: string[]) => {
  const uniqueSet = new Set(arr)
  const uniqueArr = [...uniqueSet]
  return uniqueArr
}

const hasValue = <T>(
  val: any, 
  type: string,
  checkLength = true,
): val is T => {
  if(val && typeof val === type) {
    if(checkLength && Array.isArray(val)) {
      if(val.length < 1) return false
    }

    if(type === "string") {
      return Boolean(val.trim())
    }

    return true
  }
  return false
}

const isStringWithVal = (val: any): val is string => {
  return hasValue<string>(val, "string")
}

const objHasAnyKey = (obj: Record<string, any>) => {
  return Object.keys(obj).length > 0
}

const getValFromObj = (
  obj: Record<string, any>, 
  key: string,
) => {
  if(!obj) return ""
  return obj[key]
}

function isChinesePunctuation(char: string) {
  if (char.length !== 1) return false;
  
  // 匹配中文标点符号的正则表达式
  const chinesePunctuationRegex = /[\u3000-\u303F\uFF00-\uFFEF\uFE30-\uFE4F\u2E80-\u2EFF\u31C0-\u31EF]/;
  
  return chinesePunctuationRegex.test(char);
}

export default {
  waitMilli,
  copyObject,
  strToObj,
  objToStr,
  getPromise,
  numToFix,
  isStringAsNumber,
  format0,
  getChineseCharNum,
  isAllEnglishChar,
  getLowerCaseNum,
  getTextCharNum,
  getValInMinAndMax,
  isAIncludedInB,
  getSuffix,
  isInDomain,
  minusAndMinimumZero,
  compareVersion,
  uniqueArray,
  hasValue,
  isStringWithVal,
  objHasAnyKey,
  getValFromObj,
  isChinesePunctuation,
}