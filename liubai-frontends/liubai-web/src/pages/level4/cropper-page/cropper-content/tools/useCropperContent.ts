import { onActivated, ref, toRef, watch } from "vue";
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import type { ComponentPublicInstance } from "vue"
import type { CcProps } from "./types";
import type { CropperResult } from "vue-advanced-cropper"
import cui from "~/components/custom-ui";
import imgHelper from "~/utils/files/img-helper";


let isLoading = false
export function useCropperContent(
  props: CcProps,
) {
  const rr = useRouteAndLiuRouter()
  const tempStore = useTemporaryStore()

  onActivated(() => {
    const url = tempStore.imageUrlForCropper
    if(url) return
    rr.router.goHome()
  })

  const cropperRef = ref<ComponentPublicInstance | null>(null)
  const confirmNum = toRef(props, "confirmNum")
  watch(confirmNum, async (newV) => {
    // 1. interrupt
    if(isLoading) return

    // 2. try to get canvas
    const cropper = cropperRef.value as any
    if(!cropper) return
    if(typeof cropper.getResult !== "function") return
    const res = cropper.getResult() as CropperResult
    if(!res) return
    const canvas = res.canvas
    if(!canvas) return

    // 3. show loading
    showCropperLoading()

    // 4. let canvas create blob
    canvas.toBlob(async (blob) => {
      if(!blob) return
      compressFile(blob)
    })
  })

  return {
    tempStore,
    cropperRef,
  }
}


function showCropperLoading() {
  cui.showLoading({ title_key: "tip.hold_on" })
}

function hideCropperLoading() {
  if(!isLoading) return
  isLoading = false
  cui.hideLoading()
}

async function compressFile(
  blob: Blob,
) {
  const files = await imgHelper.compress([blob as File], { 
    maxWidth: 256, 
    compressPoint: 33 * 1024,
    convertSize: 32 * 1024,
  })
  console.log("files: ", files)
}