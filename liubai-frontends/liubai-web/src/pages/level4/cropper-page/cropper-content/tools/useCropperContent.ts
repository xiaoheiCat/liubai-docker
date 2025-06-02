import { onActivated } from "vue";
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import { useRouteAndLiuRouter } from "~/routes/liu-router";

export function useCropperContent() {
  const rr = useRouteAndLiuRouter()
  const tempStore = useTemporaryStore()

  onActivated(() => {
    const url = tempStore.imageUrlForCropper
    if(url) return
    rr.router.goHome()
  })

  return {
    tempStore,
  }
}