
import type { ThreadShow } from "~/types/types-content";
import threadOperate from "~/hooks/thread/thread-operate";
import time from "~/utils/basic/time";
import typeCheck from "~/utils/basic/type-check";

export function whenThreadListUpdated(
  stateId: string,
  threads: ThreadShow[],
) {
  const now = time.getTime()
  const total = threads.length

  const _getNewStateStamp = (i: number, threads: ThreadShow[]) => {
    const v = threads[i]
    const theStamp = v.stateStamp ?? now
    const nextOne = threads[i + 1]
    const nextStamp = nextOne?.stateStamp ?? now
    const prevOne = i > 0 ? threads[i - 1] : undefined
    const prevStamp = prevOne?.stateStamp ?? now

    if(!typeCheck.isNumber(theStamp)) {
      return now
    }
    if(total <= 1) {
      return theStamp
    }

    // 1. check out first one
    if(i === 0 && nextOne) {
      if(theStamp <= nextStamp) return now
      return theStamp
    }

    // 2. check out last one
    if(i === total - 1 && prevOne) {
      if(theStamp >= prevStamp) return prevStamp - time.MINUTE
      return theStamp
    }

    // 3. check out the one in the middle
    if(prevStamp > nextStamp) {
      if(prevStamp <= theStamp && nextStamp <= theStamp) {
        console.warn("当前 stamp 特别突出！")
        const newStamp1 = Math.round((nextStamp + prevStamp) / 2)
        return newStamp1
      }
      if(prevStamp >= theStamp && nextStamp >= theStamp) {
        console.warn("当前 stamp 特别凹陷！")
        const newStamp2 = Math.round((nextStamp + prevStamp) / 2)
        return newStamp2
      }
    }
    
    return theStamp
  }

  for(let i=0; i<total; i++) {
    const v = threads[i]
    let newStamp = _getNewStateStamp(i, threads)
    if(isNaN(newStamp)) {
      newStamp = now
    }
    if(v.stateId !== stateId || v.stateStamp !== newStamp) {
      console.warn("old stateId: ", v.stateId)
      console.log("new stateId: ", stateId)
      console.log("old stamp: ", v.stateStamp)
      console.log("new stamp: ", newStamp)
      console.log("see desc: ", v.desc)
      console.log(" ")
      threadOperate.updateStateForThread(v, stateId, newStamp)
      v.stateId = stateId
      v.stateStamp = newStamp
    }
  }
}

