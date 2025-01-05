import type { CetProps, CetEmit } from "./types"
import { useInputElement } from "~/hooks/elements/useInputElement"

export function useCetInputElement(
  props: CetProps, 
  emit: CetEmit
) {
  const { chooseFile } = useInputElement()
  const onTapChooseImage = async () => {
    console.log("onTapChooseImage...............")
    const filePickerAcceptType: FilePickerAcceptType = {
      description: "Images",
      accept: {
        "image/*": [".png", ".gif", ".jpeg", ".jpg"]
      },
    }
    const files = await chooseFile({ 
      id: "for_image",
      multiple: true, 
      types: [filePickerAcceptType],
    })
    if(!files || files.length < 1) return
    emit("imagechange", files)
  }

  return {
    onTapChooseImage,
  }
}