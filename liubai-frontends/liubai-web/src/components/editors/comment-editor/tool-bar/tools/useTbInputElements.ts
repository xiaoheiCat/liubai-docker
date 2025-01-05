import type { ToolBarProps, ToolBarEmits } from "./types"
import { useInputElement } from "~/hooks/elements/useInputElement"

export function useTbInputElements(
  props: ToolBarProps,
  emit: ToolBarEmits,
) {
  const {
    chooseFile: chooseFile1,
  } = useInputElement()

  const onTapImage = async () => {
    const filePickerAcceptType: FilePickerAcceptType = {
      description: "Images",
      accept: {
        "image/*": [".png", ".gif", ".jpeg", ".jpg"]
      },
    }
    const images = await chooseFile1({ 
      id: "for_image",
      types: [filePickerAcceptType],
    })
    if(!images || images.length < 1) return
    emit("imagechange", images)
  }

  const {
    chooseFile: chooseFile2,
  } = useInputElement()
  const onTapFile = async () => {
    const files = await chooseFile2({ id: "for_file" })
    if(!files || files.length < 1) return
    emit("filechange", files)
  }

  return {
    onTapImage,
    onTapFile,
  }

}