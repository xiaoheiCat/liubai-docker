import { db } from "~/utils/db"
import type {
  SearchOpt,
} from "./types"
import type { ContentLocalTable } from "~/types/types-table";
import { getSpaceId, resToAtoms } from "./util";

export async function searchSuggest(param: SearchOpt) {
  const { excludeThreads = [], mode } = param
  const onlyThread = mode === "select_thread"
  const spaceId = getSpaceId()

  const filterFunc = (item: ContentLocalTable) => {
    if(onlyThread && item.infoType !== "THREAD") return false
    if(item.oState !== "OK") return false
    if(excludeThreads.includes(item._id)) return false
    if(spaceId !== item.spaceId) return false
    return true
  }

  let tmp = db.contents.orderBy("editedStamp").filter(filterFunc)
  tmp = tmp.reverse().limit(5)
  const res = await tmp.toArray()
  const list = resToAtoms("suggest", res)

  return list
}