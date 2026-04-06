import localWorkerSearchProvider from "~/utils/search/local-search/provider";
import type { SearchOpt } from "./types"
import { resToAtoms } from "./util";
import { searchInnerLegacy } from "./search-inner-legacy";

export async function searchInner(param: SearchOpt) {
  const { text } = param
  if(!text) return []

  try {
    console.time("[search-inner] provider")
    const res = await localWorkerSearchProvider.searchContents(param)
    console.timeEnd("[search-inner] provider")
    const list = resToAtoms("inner", res, text)
    console.log("[search-inner] provider result", {
      text,
      hits: list.length,
    })
    return list
  }
  catch(err) {
    console.warn("searchInner fallback to legacy search")
    console.log(err)
    return searchInnerLegacy(param)
  }
}
