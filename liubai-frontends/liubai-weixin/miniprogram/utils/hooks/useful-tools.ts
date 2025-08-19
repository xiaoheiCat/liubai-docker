import { LiuTime } from "../LiuTime"


const _throttleStamps = {
  "index-scroll-to-lower": 0,
  "index-scroll-to-upper": 0,
}

function canIPassThrottle(
  key: keyof typeof _throttleStamps,
  duration = 1000,
) {
  const stamp = _throttleStamps[key]
  const isWithin = LiuTime.isWithinMillis(stamp, duration, true)
  if(isWithin) return false
  _throttleStamps[key] = LiuTime.getLocalTime()
  return true
}

export interface FdBase {
  id: string
  [otherKey: string]: any
}

/** 过滤掉 originals 里已有的 item 
 * 注意，该方法会直接返回原 newList 的引用
 * 所有修改都直接发生在 newList 上
*/
function filterDuplicated(
  orginals: FdBase[],
  newList: FdBase[],
) {
  if(orginals.length < 1 || newList.length < 1) return newList
  for(let i=0; i<newList.length; i++) {
    const v1 = newList[i]
    const v2 = orginals.find(v => v.id === v1.id)
    if(v2) {
      newList.splice(i, 1)
      i--
    }
  }
  return newList
} 

export default {
  canIPassThrottle,
  filterDuplicated,
  
}