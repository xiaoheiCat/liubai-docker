import type { ShallowRef } from "vue";
import type { TipTapEditor } from "~/types/types-editor"
import type { EditorCoreProps, EditorCoreEmits } from "./types"
import cui from '~/components/custom-ui'
import time from "~/utils/basic/time";
import { useKeyboard } from "~/hooks/useKeyboard";

// 监听 # 被点击
export function useEcHashtag(
  editorRef: ShallowRef<TipTapEditor | undefined>,
  props: EditorCoreProps, 
  emits: EditorCoreEmits,
) {

  let lastTriggerStamp = 0
  let lastProcessStamp = 0   // 注音鍵盤會出現 Process 這個 e.key
  let lastThreeStamp = 0
  let lastHashStamp = 0
  let lastShiftStamp = 0

  const _canTriggerThenGetEditor = () => {
    const editor = editorRef.value
    if(!editor) return

    const isFocused = editor.isFocused
    if(!isFocused) return

    const isPara = editor.isActive("paragraph")
    if(!isPara) return

    if(time.isWithinMillis(lastTriggerStamp, 500)) return
    
    return editor
  }

  // 注音鍵盤 用 whenKeyDown 會監聽不到 # 事件
  // 故這裡使用 whenKeyUp 輔助判斷
  const whenKeyUp = (e: KeyboardEvent) => {
    if(!props.hashTrigger) return
    const editor = _canTriggerThenGetEditor()
    if(!editor) return

    const now = time.getTime()
    const key = e.key
    if(key === "Process") {
      // console.log("this is process")
      lastProcessStamp = now
      return
    }
    if(key === "3") {
      // console.log("this is three")
      lastThreeStamp = now
    }
    else if(key === "#") {
      // console.log("this is hash")
      lastHashStamp = now
    }
    else if(key === "Shift") {
      // console.log("this is shift")
      lastShiftStamp = now
    }
    else {
      return
    }
    const diff1 = Math.abs(lastShiftStamp - lastProcessStamp)
    const diff2 = Math.abs(lastThreeStamp - lastProcessStamp)

    // console.log("diff1: ", diff1)
    // console.log("diff2: ", diff2)

    if(diff1 < 250 && diff2 < 250) {
      lastTriggerStamp = now
      triggerHashTagEditor(editor, emits)
      return
    }

    const diff3 = Math.abs(now - lastHashStamp)
    // console.log("diff3: ", diff3)
    if(diff3 < 250) {
      lastTriggerStamp = now
      triggerHashTagEditor(editor, emits)
      return
    }

  }

  const whenKeyDown = (e: KeyboardEvent) => {
    if(!props.hashTrigger) return

    const key = e.key
    if(key === "#" || key === "＃") {
      // console.warn("we found # when key down")
      lastHashStamp = time.getTime() 
    }
    else if(key === "Shift") {
      // console.warn("we found Shift when key down")
      lastShiftStamp = time.getTime()
    }
    else if(key === "Process") {
      // console.warn("we found Process when key down")
      lastProcessStamp = time.getTime()
    }

  }

  useKeyboard({ whenKeyDown, whenKeyUp })
}

async function triggerHashTagEditor(
  editor: TipTapEditor,
  emits: EditorCoreEmits,
) {
  const res = await cui.showHashtagEditor({ mode: "search" })
  if(!res.confirm) {
    editor.commands.focus()
    return
  }

  if(res.text) emits("addhashtag", res)

  // check if the textarea is empty or not
  const { state } = editor
  const { selection } = state
  const { $from, empty } = selection
  if(!empty) return

  // Check if the previous character is '#'"
  const pos = $from.pos
  const prevChar = state.doc.textBetween(pos - 1, pos)
  if(prevChar !== "#" && prevChar !== "＃") return
  
  editor.chain()
    .focus()
    .command(({ tr }) => {
      tr.delete(pos - 1, pos)
      return true
    })
    .run()
}