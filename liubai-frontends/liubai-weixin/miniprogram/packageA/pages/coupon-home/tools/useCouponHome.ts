import { LiuApi } from "~/utils/LiuApi";
import { LiuTunnel } from "~/utils/LiuTunnel";

export async function handleImageSearch() {
  LiuApi.vibrateShort({ type: "medium" })

  // 1. choose image
  const res1 = await LiuApi.chooseMedia({ 
    mediaType: ["image"], 
    count: 1, 
    sourceType: ["album"],
    sizeType: ["original"]
  })
  if(!res1) return
  const file = res1.tempFiles[0]
  if(!file) return

  // 2. set tunnel
  LiuTunnel.setStuff("coupon-search-image", file)

  // 3. navigate to coupon search
  LiuApi.navigateTo({ url: "/packageA/pages/coupon-search/coupon-search" })
}