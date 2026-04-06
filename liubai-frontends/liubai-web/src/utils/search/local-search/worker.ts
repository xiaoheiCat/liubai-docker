import { db } from "~/utils/db"
import type { ContentLocalTable } from "~/types/types-table";
import valTool from "~/utils/basic/val-tool";
import type {
  SearchIndexDoc,
  SearchSyncPayload,
  SearchWorkerAction,
  SearchWorkerRequest,
  SearchWorkerResponse,
  WorkerSearchParams,
  WorkerSearchResult,
} from "./types";

type FlexsearchModule = typeof import("flexsearch")
type FlexsearchDocument = import("flexsearch").Document<SearchIndexDoc>

interface FlexsearchEnrichedResult {
  id: string | number
  doc: SearchIndexDoc | null
}

const SEARCH_DB_NAME = "liubai-local-search-v3"
const SEARCH_LIMIT = 10
const FIELD_LIMIT = 24
const SEARCH_FIELDS = [
  { field: "title", weight: 140 },
  { field: "body", weight: 50 },
] as const
type SearchFieldName = typeof SEARCH_FIELDS[number]["field"]

let flexsearchMod: FlexsearchModule | undefined
let index: FlexsearchDocument | undefined
let initPromise: Promise<void> | undefined

function getWorkerLikeWindow() {
  return globalThis as any
}

async function ensureIndex() {
  if(index) return index
  if(initPromise) {
    await initPromise
    if(index) return index
  }

  initPromise = _initIndex()
  await initPromise
  if(!index) {
    throw new Error("search index failed to initialize")
  }
  return index
}

async function _initIndex() {
  console.time("[local-search/worker] init")
  await db.open()

  const workerWindow = getWorkerLikeWindow()
  if(!workerWindow.window) {
    workerWindow.window = workerWindow
  }

  const [{ Charset, Document }, { default: IndexedDB }] = await Promise.all([
    import("flexsearch"),
    import("flexsearch/db/indexeddb"),
  ])

  flexsearchMod = { Charset, Document } as FlexsearchModule

  const nextIndex = new Document<SearchIndexDoc>({
    document: {
      id: "id",
      index: [
        "title",
        "body",
      ],
      store: [
        "id",
        "title",
        "body",
        "spaceId",
        "infoType",
        "oState",
        "editedStamp",
      ],
    },
    encoder: Charset.CJK,
    tokenize: "forward",
    context: true,
    resolution: 9,
    cache: 64,
  })

  await nextIndex.mount(new IndexedDB(SEARCH_DB_NAME))
  index = nextIndex

  await rebuildAll()
  console.timeEnd("[local-search/worker] init")
}

function isIndexableContent(content: ContentLocalTable | SearchIndexDoc) {
  if(content.oState !== "OK") return false
  const title = "title" in content ? content.title : ""
  const body = "body" in content ? content.body : ""
  return Boolean(title || body)
}

function contentToSearchDoc(content: ContentLocalTable): SearchIndexDoc {
  return {
    id: content._id,
    title: content.search_title ?? "",
    body: content.search_other ?? "",
    spaceId: content.spaceId,
    infoType: content.infoType,
    oState: content.oState,
    editedStamp: content.editedStamp,
  }
}

async function rebuildAll() {
  console.time("[local-search/worker] rebuildAll")
  const target = await ensureIndexInstanceForRebuild()
  await target.clear()

  const allContents = await db.contents.toArray()
  let indexedCount = 0
  for(let i = 0; i < allContents.length; i++) {
    const doc = contentToSearchDoc(allContents[i])
    if(!isIndexableContent(doc)) continue
    await target.add(doc)
    indexedCount++
  }

  await target.commit()
  console.timeEnd("[local-search/worker] rebuildAll")
  console.log("[local-search/worker] rebuildAll result", {
    total: allContents.length,
    indexed: indexedCount,
  })
}

async function ensureIndexInstanceForRebuild() {
  if(index) return index
  if(initPromise) {
    await initPromise
  }
  if(index) return index
  throw new Error("search index is unavailable")
}

async function handleSync(payload: SearchSyncPayload) {
  console.time("[local-search/worker] sync")
  const target = await ensureIndex()
  const { removals = [], upserts = [] } = payload

  for(let i = 0; i < removals.length; i++) {
    await target.remove(removals[i])
  }

  for(let i = 0; i < upserts.length; i++) {
    const doc = upserts[i]
    await target.remove(doc.id)
    if(!isIndexableContent(doc)) continue
    await target.add(doc)
  }

  await target.commit()
  console.timeEnd("[local-search/worker] sync")
  console.log("[local-search/worker] sync result", {
    upserts: upserts.length,
    removals: removals.length,
  })
}

async function handleSearch(params: WorkerSearchParams): Promise<WorkerSearchResult> {
  console.time("[local-search/worker] search")
  const target = await ensureIndex()
  const { text, mode, spaceId, excludeThreads } = params
  const query = text.trim().toLowerCase()
  if(!query) return { ids: [] }

  const excludeSet = new Set(excludeThreads)
  const onlyThread = mode === "select_thread"
  const keywords = splitKeywords(query)
  const scoreMap = new Map<string, number>()
  const stampMap = new Map<string, number>()
  const docMap = new Map<string, SearchIndexDoc>()
  const contributionMap = new Map<string, Record<SearchFieldName, number>>()

  for(let i = 0; i < SEARCH_FIELDS.length; i++) {
    const { field, weight } = SEARCH_FIELDS[i]
    const results = await target.search(query, {
      pluck: field,
      enrich: true,
      suggest: true,
      limit: FIELD_LIMIT,
    }) as FlexsearchEnrichedResult[]

    for(let j = 0; j < results.length; j++) {
      const item = results[j]
      const id = String(item.id)
      const doc = item.doc
      if(!doc) continue
      if(doc.spaceId !== spaceId) continue
      if(doc.oState !== "OK") continue
      if(onlyThread && doc.infoType !== "THREAD") continue
      if(excludeSet.has(id)) continue

      const rankScore = (FIELD_LIMIT - j) + weight
      const oldScore = scoreMap.get(id) ?? 0
      scoreMap.set(id, oldScore + rankScore)
      stampMap.set(id, doc.editedStamp)
      docMap.set(id, doc)

      let contributions = contributionMap.get(id)
      if(!contributions) {
        contributions = {
          title: 0,
          body: 0,
        }
        contributionMap.set(id, contributions)
      }
      contributions[field] += rankScore
    }
  }

  const ranked = Array.from(scoreMap.entries())
  const reranked = rerankSmallSample(ranked, docMap, keywords, stampMap)

  reranked.sort((a, b) => {
    if(a[1] !== b[1]) return b[1] - a[1]
    const stampA = stampMap.get(a[0]) ?? 0
    const stampB = stampMap.get(b[0]) ?? 0
    return stampB - stampA
  })

  const result = {
    ids: reranked.slice(0, SEARCH_LIMIT).map(v => v[0]),
  }
  const rankedDebug = reranked.slice(0, SEARCH_LIMIT).map(([id, score]) => {
    const doc = docMap.get(id)
    const contributions = contributionMap.get(id)
    return {
      id,
      score,
      editedStamp: stampMap.get(id) ?? 0,
      contributions,
      title: doc?.title ?? "",
      bodyPreview: doc?.body?.substring(0, 60) ?? "",
    }
  })
  console.timeEnd("[local-search/worker] search")
  console.log("[local-search/worker] search result", {
    text: query,
    mode,
    hits: result.ids.length,
    ranked: rankedDebug,
  })
  return result
}

async function handleClear() {
  console.log("[local-search/worker] clear")
  const target = await ensureIndex()
  await target.clear()
  await target.commit()
}

function postOk<T extends SearchWorkerAction>(
  req: SearchWorkerRequest<T>,
  payload: SearchWorkerResponse<T>["payload"],
) {
  const res: SearchWorkerResponse<T> = {
    id: req.id,
    action: req.action,
    ok: true,
    payload,
  }
  postMessage(res)
}

function postErr<T extends SearchWorkerAction>(
  req: SearchWorkerRequest<T>,
  err: unknown,
) {
  const res: SearchWorkerResponse<T> = {
    id: req.id,
    action: req.action,
    ok: false,
    error: err instanceof Error ? err.message : "unknown search worker error",
  }
  postMessage(res)
}

onmessage = async (evt: MessageEvent<SearchWorkerRequest<SearchWorkerAction>>) => {
  const req = evt.data

  try {
    if(req.action === "init") {
      await ensureIndex()
      postOk(req, { ready: true })
      return
    }

    if(req.action === "search") {
      const data = await handleSearch(req.payload as WorkerSearchParams)
      postOk(req, data)
      return
    }

    if(req.action === "sync") {
      await handleSync(req.payload as SearchSyncPayload)
      postOk(req, { done: true })
      return
    }

    if(req.action === "clear") {
      await handleClear()
      postOk(req, { cleared: true })
      return
    }
  }
  catch(err) {
    console.warn("search worker error")
    console.log(err)
    postErr(req, err)
  }
}

function splitKeywords(text: string) {
  return text.split(" ").map(v => v.trim()).filter(Boolean)
}

function rerankSmallSample(
  ranked: Array<[string, number]>,
  docMap: Map<string, SearchIndexDoc>,
  keywords: string[],
  stampMap: Map<string, number>,
) {
  if(keywords.length < 1) return ranked

  const rescored: Array<[string, number]> = []
  for(let i = 0; i < ranked.length; i++) {
    const [id, baseScore] = ranked[i]
    const doc = docMap.get(id)
    if(!doc) continue
    const strictScore = getStrictSampleScore(doc, keywords)
    if(strictScore <= 0) continue
    stampMap.set(id, doc.editedStamp)
    rescored.push([id, baseScore + strictScore])
  }

  return rescored
}

function getStrictSampleScore(doc: SearchIndexDoc, keywords: string[]) {
  const title = doc.title ?? ""
  const body = doc.body ?? ""
  const firstLine = body.split("\n")[0] ?? ""
  let score = 0

  for(let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i]
    const reg = createStrictRegex(keyword)
    const titleMatched = reg.test(title)
    const bodyMatched = reg.test(body)

    if(!titleMatched && !bodyMatched) {
      return 0
    }

    score += getFieldScore(title, keyword, {
      hit: 160,
      prefix: 90,
      early: 40,
    })
    score += getFieldScore(firstLine, keyword, {
      hit: 80,
      prefix: 40,
      early: 30,
    })
    score += getFieldScore(body, keyword, {
      hit: 30,
      prefix: 0,
      early: 15,
    })
  }

  return score
}

function getFieldScore(
  text: string,
  keyword: string,
  weight: { hit: number, prefix: number, early: number },
) {
  if(!text) return 0

  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const index = lowerText.indexOf(lowerKeyword)
  if(index < 0) return 0

  let score = weight.hit
  if(index === 0 || isWordPrefixMatch(lowerText, lowerKeyword, index)) {
    score += weight.prefix
  }

  const earlyBoost = Math.max(0, 20 - index)
  score += Math.min(weight.early, earlyBoost)
  return score
}

function isWordPrefixMatch(text: string, keyword: string, index: number) {
  if(index < 0) return false
  if(index === 0) return true
  if(!valTool.isAllEnglishChar(keyword)) return false
  const prev = text[index - 1]
  return /[^a-z0-9]/i.test(prev)
}

function createStrictRegex(keyword: string) {
  const source = escapeRegex(keyword)
  if(keyword.length >= 4) {
    return new RegExp(source, "i")
  }
  if(valTool.isAllEnglishChar(keyword)) {
    return new RegExp(`\\b${source}`, "i")
  }
  return new RegExp(source, "i")
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
