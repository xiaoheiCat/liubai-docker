import { reactive, toRef, watch } from "vue";
import type { 
  AuthorizeViewProps,
  AuthorizeViewEmit, 
  AuthorizeViewData,
} from "./types";
import type { LiuTimeout } from "~/utils/basic/type-tool";
import { useMyProfile } from "~/hooks/useCommon";
import { useRouteAndLiuRouter } from "~/routes/liu-router";


export function useAuthorizeView(
  props: AuthorizeViewProps,
  emit: AuthorizeViewEmit,
) {
  const rr = useRouteAndLiuRouter()
  const { myProfile } = useMyProfile()
  const avData = reactive<AuthorizeViewData>({
    showCode: false,
    fetchingAgree: false,
  })

  const code = toRef(props, "code")
  let timeout1: LiuTimeout

  const _stopCountdown = () => {
    if(timeout1) {
      clearTimeout(timeout1)
      timeout1 = undefined
    }
  }

  const _startToCountdown = () => {
    _stopCountdown()
    timeout1 = setTimeout(() => {
      avData.showCode = true
    }, 5000)
  }
  
  watch(code, (newV) => {
    if(newV?.length) _startToCountdown()
    else _stopCountdown()
  })


  const onTapAgree = async () => {
    if(avData.fetchingAgree) return
    avData.fetchingAgree = true
    emit("agree")
    setTimeout(() => {
      avData.fetchingAgree = false
    }, 6000)
  }

  const onTapCancel = () => {
    rr.router.goHome()
  }

  return {
    avData,
    myProfile,
    onTapAgree,
    onTapCancel,
  }
}