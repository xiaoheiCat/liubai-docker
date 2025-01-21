import type { LiuContent } from "~/types/types-atom"

export interface ListToMdOpt {
  title?: string
}

export function listToMarkdown(
  list: LiuContent[],
  opt?: ListToMdOpt,
): string {
  let str = ""
  if(opt?.title) {
    str += `# ${opt.title}\n\n`
  }
  str += liuDescToMd(list)
  return str
}


interface DescToMdOpt {
  plainText?: string
  inBlockquote?: boolean
  orderNum?: number
  inBulletList?: boolean
}


function liuDescToMd(
  list: LiuContent[],
  opt?: DescToMdOpt,
) {
  let plainText = opt?.plainText ?? ""

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    const { text, type, marks = [], content = [], attrs } = v

    if(type === "text" && text) {
      let hasBold = false
      let hasItalic = false
      let inlineCode = false
      let link = ""
      marks.forEach(v2 => {
        if(v2.type === "bold") hasBold = true
        if(v2.type === "italic") hasItalic = true
        if(v2.type === "code") inlineCode = true
        if(v2.type === "link") {
          link = v2.attrs?.href ?? ""
        }
      })

      let slice = text
      if(hasBold) {
        slice = `**${slice}**`
      }
      if(hasItalic) {
        slice = `*${slice}*`
      }
      if(inlineCode) {
        slice = `\`${slice}\``
      }
      if(link) {
        slice = `[${slice}](${link})`
      }
      plainText += slice
    }
    else if(type === "paragraph") {
      const slice = liuDescToMd(content)
      if(opt?.inBlockquote) {
        plainText += `> `
      }
      plainText += (slice + `\n`)
    }
    else if(type === "blockquote") {
      const slice = liuDescToMd(content, { inBlockquote: true })
      plainText += slice
    }
    else if(type === "horizontalRule") {
      plainText += `---\n`
    }
    else if(type === "codeBlock") {
      let slice = `\`\`\``
      if(attrs?.language) slice += attrs.language 
      slice += `\n`
      slice += liuDescToMd(content)
      slice += `\n\`\`\`\n`
      plainText += slice
    }
    else if(type === "listItem") {
      const slice = liuDescToMd(content)
      if(opt?.orderNum) {
        plainText += `${opt.orderNum}. `
        opt.orderNum++
      }
      else if(opt?.inBulletList) {
        plainText += `- `
      }
      plainText += slice
    }
    else if(type === "orderedList") {
      const slice = liuDescToMd(content, { orderNum: attrs?.start ?? 1 })
      plainText += slice
    }
    else if(type === "bulletList") {
      const slice = liuDescToMd(content, { inBulletList: true })
      plainText += slice
    }
    else if(type === "taskItem") {
      let slice = attrs?.checked ? `- [x] ` : `- [ ] `
      slice += liuDescToMd(content)
      plainText += slice
    }
    else if(type === "taskList") {
      const slice = liuDescToMd(content)
      plainText += slice
    }
  }

  return plainText
}