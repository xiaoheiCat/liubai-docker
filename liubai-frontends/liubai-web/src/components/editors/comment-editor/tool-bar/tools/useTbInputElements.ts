import type { ToolBarProps, ToolBarEmits } from "./types"
import { useInputElement } from "~/hooks/elements/useInputElement"

export function useTbInputElements(
  props: ToolBarProps,
  emit: ToolBarEmits,
) {

  const onNewImage = (files: File[]) => {
    emit("imagechange", files)
  }

  const onNewFile = (files: File[], el: HTMLInputElement) => {
    emit("filechange", files)
    el.blur()
  }

  const {
    inputEl: selectImagesEl,
    onFileChange: onImageChange,
    chooseFile: chooseFile1,
  } = useInputElement(onNewImage)

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
    if(!images) return
    emit("imagechange", images)
  }


  const {
    inputEl: selectFileEl,
    onFileChange: onFileChange,
    chooseFile: chooseFile2,
  } = useInputElement(onNewFile)
  const onTapFile = async () => {
    const files = await chooseFile2({ id: "for_file" })
    if(!files) return
    emit("filechange", files)
  }

  return {
    selectImagesEl,
    onImageChange,
    onTapImage,
    selectFileEl,
    onFileChange,
    onTapFile,
  }

}