// 用侧边栏打开链接的工具 store

import { ref } from "vue";
import { defineStore } from "pinia";
import type { RouteLocationNormalizedLoaded } from "vue-router"
import valTool from "~/utils/basic/val-tool"
import { domainAllowed } from "~/config/domain-list"
import { getEmbedData } from "./tools/embed-origin"
import { isSpecialLink } from "./tools/handle-special-link"

interface VvLinkAtom {
  id: string
  url: string
}

interface VvCodeAtom {
  id: string
  srcdoc: string
}

export const useVvLinkStore = defineStore("vvlink", () => {

  const list = ref<VvLinkAtom[]>([])
  const codeList = ref<VvCodeAtom[]>([])

  // 获取当前路由下所对应的链接
  const getCurrentLink = (
    route: RouteLocationNormalizedLoaded
  ) => {
    const { vlink } = route.query
    if(!valTool.isStringWithVal(vlink)) return
    const data = list.value.find(v => v.id === vlink)
    if(!data) return
    return data.url
  }

  // get the srcdoc under the current route
  const getCurrentSrcDoc = (
    route: RouteLocationNormalizedLoaded
  ) => {
    const { vcode } = route.query
    if(!valTool.isStringWithVal(vcode)) return
    const data = codeList.value.find(v => v.id === vcode)
    if(!data) return
    return data.srcdoc
  }

  const getUrlById = (id: string) => {
    const data = list.value.find(v => v.id === id)
    if(!data) return
    return data.url
  }

  const getSrcDocById = (id: string) => {
    const data = codeList.value.find(v => v.id === id)
    if(!data) return
    return data.srcdoc
  }

  // 添加链接至对队列里，并返回其 id
  const addLink = (url: string) => {
    const tmp = list.value
    const data = tmp.find(v => v.url === url)
    if(data) return data.id
    const num = tmp.length + 1
    const id = valTool.format0(num)
    tmp.push({ id, url })
    return id
  }

  const addCode = (srcdoc: string) => {
    const tmp = codeList.value
    const data = tmp.find(v => v.srcdoc === srcdoc)
    if(data) return data.id
    const num = tmp.length + 1
    const id = valTool.format0(num)
    tmp.push({ id, srcdoc })
    return id
  }


  return {
    getCurrentLink,
    getCurrentSrcDoc,
    getUrlById,
    getSrcDocById,
    addLink,
    addCode,
    canAdd,
    isInAllowedList,
    getEmbedData,
    isSpecialLink,
  }
})

// 检查该链接是否允许在侧边栏打开
function canAdd(url: string) {
  const p0 = location.protocol
  const u = new URL(url)
  const p = u.protocol
  if(p !== "http:" && p !== "https:") return false
  if(p === "http:" && p0 === "https:") return false

  const h = u.hostname
  const embedData = getEmbedData(url)
  if(embedData) return true

  const res1 = isSpecialLink(url)
  if(res1) return true

  const data1 = isInAllowedList(url)
  if(data1) return true

  return false
}

// 检查该链接是否可直接打开，而无需代理
function isInAllowedList(url: string) {
  const u = new URL(url)
  const h = u.hostname
  const p = u.pathname

  const data = domainAllowed.find(v => valTool.isInDomain(h, v))

  // special for quaily.com
  if(data === "quaily.com") {
    // https://quaily.com/zh cannot be opened in iframe
    if(p.length < 5) return false
  }


  return Boolean(data)
}

