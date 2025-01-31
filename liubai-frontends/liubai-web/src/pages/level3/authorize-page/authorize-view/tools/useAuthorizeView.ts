import { ref, toRef, watch } from "vue";
import type { AuthorizeViewProps } from "./types";
import type { LiuTimeout } from "~/utils/basic/type-tool";


export function useAuthorizeView(
  props: AuthorizeViewProps,
) {
  const showCode = ref(false)
  const code = toRef(props, "code")
  let timeout: LiuTimeout


  const _stopCountdown = () => {
    if(timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  const _startToCountdown = () => {
    _stopCountdown()
    timeout = setTimeout(() => {
      showCode.value = true
    }, 5000)
  }
  
  watch(code, (newV) => {
    if(newV?.length) _startToCountdown()
    else _stopCountdown()
  })

  return {
    showCode,
  }
}