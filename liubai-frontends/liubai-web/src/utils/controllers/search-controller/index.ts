import { searchInner } from "./search-inner"
import { searchRecent, addKeywordToRecent, deleteKeyword } from "./search-recent"
import { searchSuggest } from "./search-suggest"
import { searchThird } from "./search-third"
import localWorkerSearchProvider from "~/utils/search/local-search/provider";

export default {
  init() {
    localWorkerSearchProvider.init()
  },
  clear() {
    return localWorkerSearchProvider.clear()
  },
  searchSuggest,
  searchRecent,
  addKeywordToRecent,
  deleteKeyword,
  searchInner,
  searchThird,
}
