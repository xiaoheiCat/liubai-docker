import liuApi from "~/utils/liu-api"
import liuUtil from "~/utils/liu-util"
import { useThrottleFn } from "../useVueUse"

type ChooseFileResolver = (res: File[]) => void

export function useInputElement() {
  
  /**
   * Choose File
   * @param id https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showOpenFilePicker#id
   * @returns 
   */
  const chooseFile = async (
    opt?: ShowOpenFilePickerOptions
  ): Promise<File[]> => {
    const fsaAPI = liuApi.canIUse.fileSystemAccessAPI()
    if(fsaAPI) {
      const res = await tryToShowOpenFilePicker(opt)

      console.warn("files from showOpenFilePicker: ")
      console.log(res)

      return res
    }
    console.warn("Not supporting fileSystemAccessAPI")
    const _wait = (a: ChooseFileResolver) => {
      chooseFileViaInputEl(a, opt)
    }
    return new Promise(_wait)
  }

  return {
    chooseFile: useThrottleFn(chooseFile, 1000),
  }
}


function chooseFileViaInputEl(
  a: ChooseFileResolver,
  opt?: ShowOpenFilePickerOptions,
) {
  const el = document.createElement('input')
  el.style.display = "none"
  el.type = "file"
  if(opt?.multiple) {
    el.multiple = true
  }
  if(opt?.id === "for_image") {
    el.accept = liuUtil.getAcceptImgTypesString()
    console.log("see accept: ")
    console.log(el.accept)
  }
  
  document.body.appendChild(el)
  
  el.addEventListener("change", () => {
    el.remove()
    if(!el.files || !el.files.length) {
      a([])
      return
    }
    const files = liuUtil.getArrayFromFileList(el.files)
    a(files)
  })

  if("showPicker" in HTMLInputElement.prototype) {
    console.log("show picker!")
    el.showPicker()
  }
  else {
    console.log("click!")
    el.click()
  }
}


async function tryToShowOpenFilePicker(
  options?: ShowOpenFilePickerOptions
) {
  // 1. using showOpenFilePicker
  let handles: FileSystemFileHandle[]
  if(options) {
    if(!options.startIn) {
      options.startIn = "downloads"
    }
  }

  try {
    handles = await window.showOpenFilePicker(options)
  }
  catch(err) {
    console.warn("fail to call showOpenFilePicker")
    console.log(err)
    return []
  }

  // 2. handle handles
  const _getFileFromHandle = async (handle: FileSystemFileHandle) => {
    const file = await handle.getFile()
    file.handle = handle
    return file
  }
  const files = await Promise.all(handles.map(_getFileFromHandle))
  return files
}