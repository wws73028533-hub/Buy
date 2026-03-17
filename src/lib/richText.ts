import Image from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'

import type { RichTextJson } from '../types/content'

export const EMPTY_RICH_TEXT: RichTextJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
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
