import { ref } from "vue"
import liuApi from "~/utils/liu-api"
import liuUtil from "~/utils/liu-util"
import { useThrottleFn } from "../useVueUse"

export type InputElementCallback = (
  files: File[],
  el: HTMLInputElement,
) => void

export function useInputElement(
  onNewFiles: InputElementCallback
) {
  
  const inputEl = ref<HTMLInputElement | null>(null)

  const onFileChange = () => {
    const el = inputEl.value
    if(!el) return
    if(!el.files || !el.files.length) return
    const files = liuUtil.getArrayFromFileList(el.files)
    onNewFiles(files, el)
  }

  /**
   * Choose File
   * @param id https://developer.mozilla.org/zh-CN/docs/Web/API/Window/showOpenFilePicker#id
   * @returns 
   */
  const chooseFile = async (
    opt?: ShowOpenFilePickerOptions
  ): Promise<File[] | undefined> => {
    const fsaAPI = liuApi.canIUse.fileSystemAccessAPI()
    if(fsaAPI) {
      const res = await tryToShowOpenFilePicker(opt)
      return res
    }
    console.warn("the environment is not supporting fileSystemAccessAPI")
    const el = inputEl.value
    if(!el) return

    if("showPicker" in HTMLInputElement.prototype) {
      console.log("show picker!")
      el.showPicker()
    }
    else {
      console.log("click!")
      el.click()
    }
  }

  return {
    inputEl,
    onFileChange,
    chooseFile: useThrottleFn(chooseFile, 1000),
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
    console.log("let me see handles: ")
    console.log(handles)
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