import imgHelper from "~/utils/files/img-helper";
import { useInputElement } from "../elements/useInputElement";
import liuUtil from "~/utils/liu-util";
import { useTemporaryStore } from "../stores/useTemporaryStore";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import cui from "~/components/custom-ui";

export function chooseAvatar() {
  const tempStore = useTemporaryStore()
  const { chooseFile } = useInputElement()
  const rr = useRouteAndLiuRouter()

  const onTapAvatar = async () => {
    const filePickerAcceptType: FilePickerAcceptType = {
      description: "Images",
      accept: {
        "image/*": [".png", ".jpeg", ".jpg"]
      },
    }
    const files = await chooseFile({ 
      id: "for_image",
      multiple: false, 
      types: [filePickerAcceptType],
    })
    if(!files || files.length < 1) return
    const firstFile = files[0]
    const passed = checkFileType(firstFile)
    if(!passed) {
      cui.showModal({
        title_key: "tip.choose_image_1",
        content_key: "tip.choose_image_2",
        showCancel: false,
      })
      return
    }
    const res0 = await imgHelper.extractExif(files)
    const res1 = await imgHelper.compress(files)
    const res2 = await imgHelper.getMetaDataFromFiles(res1, res0)
    const res3 = liuUtil.createURLsFromStore(res2)
    const imageUrl = res3?.[0]
    if(!imageUrl) return

    tempStore.imageUrlForCropper = imageUrl
    rr.router.push({ name: "cropper" })
  }

  return { onTapAvatar }
}

function checkFileType(f: File) {
  const name = f.name.toLowerCase()
  const validExtensions = [".png", ".jpeg", ".jpg"]
  return validExtensions.some(ext => name.endsWith(ext))
}