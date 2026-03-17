import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'

import type { RichTextJson } from '../types/content'

export const EMPTY_RICH_TEXT: RichTextJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

function readNodeText(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return ''
  }

  if ('text' in node && typeof node.text === 'string') {
    return node.text
  }

  if (!('content' in node) || !Array.isArray(node.content)) {
    return ''
  }

  return node.content.map((child) => readNodeText(child)).join('')
}

function collectTextBlocks(node: unknown, blocks: string[]) {
  if (!node || typeof node !== 'object') {
    return
  }

  const type = 'type' in node && typeof node.type === 'string' ? node.type : null

  if (type === 'paragraph' || type === 'listItem') {
    const text = readNodeText(node).replace(/\s+/g, ' ').trim()

    if (text) {
      blocks.push(text)
    }

    return
  }

  if (!('content' in node) || !Array.isArray(node.content)) {
    return
  }

  node.content.forEach((child) => collectTextBlocks(child, blocks))
}

export function getRichTextTextBlocks(content: RichTextJson) {
  const blocks: string[] = []
  collectTextBlocks(content, blocks)
  return blocks
}

export function createRichTextExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
      link: {
        openOnClick: true,
        autolink: true,
        protocols: ['http', 'https'],
        HTMLAttributes: {
          class: 'text-brand-600 underline underline-offset-4',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      },
      underline: {},
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'my-6 w-full rounded-2xl border border-slate-200 object-cover shadow-soft',
      },
    }),
  ]
}
