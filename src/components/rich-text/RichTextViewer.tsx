import { EditorContent, useEditor } from '@tiptap/react'

import { createRichTextExtensions, EMPTY_RICH_TEXT } from '../../lib/richText'
import type { RichTextJson } from '../../types/content'

export function RichTextViewer({ content }: { content: RichTextJson }) {
  const editor = useEditor({
    extensions: createRichTextExtensions(),
    content: content ?? EMPTY_RICH_TEXT,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-lg prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700',
      },
    },
  })

  return <EditorContent editor={editor} />
}
