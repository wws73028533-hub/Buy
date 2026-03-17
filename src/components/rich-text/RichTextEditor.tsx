import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'

import { createRichTextExtensions, EMPTY_RICH_TEXT } from '../../lib/richText'
import { cn } from '../../lib/utils'
import type { RichTextJson } from '../../types/content'

type ToolbarButtonProps = {
  label: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
}

function ToolbarButton({ label, onClick, isActive, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl border px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {label}
    </button>
  )
}

function setLink(editor: Editor) {
  const previousUrl = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('请输入链接地址', previousUrl ?? 'https://')

  if (url === null) {
    return
  }

  if (!url.trim()) {
    editor.chain().focus().unsetLink().run()
    return
  }

  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
}: {
  value: RichTextJson
  onChange: (value: RichTextJson) => void
  onUploadImage?: (file: File) => Promise<string>
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editor = useEditor({
    extensions: createRichTextExtensions(),
    content: value ?? EMPTY_RICH_TEXT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[260px] focus:outline-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON() as RichTextJson)
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const currentJson = JSON.stringify(editor.getJSON())
    const nextJson = JSON.stringify(value ?? EMPTY_RICH_TEXT)

    if (currentJson !== nextJson) {
      editor.commands.setContent(value ?? EMPTY_RICH_TEXT)
    }
  }, [editor, value])

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file || !editor || !onUploadImage) {
      return
    }

    try {
      const imageUrl = await onUploadImage(file)
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run()
      event.target.value = ''
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片上传失败'
      window.alert(message)
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
        <ToolbarButton
          label="正文"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          isActive={editor?.isActive('paragraph')}
          disabled={!editor}
        />
        <ToolbarButton
          label="标题"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor?.isActive('heading', { level: 2 })}
          disabled={!editor}
        />
        <ToolbarButton
          label="加粗"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold')}
          disabled={!editor}
        />
        <ToolbarButton
          label="下划线"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={editor?.isActive('underline')}
          disabled={!editor}
        />
        <ToolbarButton
          label="列表"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList')}
          disabled={!editor}
        />
        <ToolbarButton
          label="引用"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive('blockquote')}
          disabled={!editor}
        />
        <ToolbarButton
          label="链接"
          onClick={() => editor && setLink(editor)}
          isActive={editor?.isActive('link')}
          disabled={!editor}
        />
        <ToolbarButton
          label="清除样式"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={!editor}
        />
        <ToolbarButton
          label="插入图片"
          onClick={() => fileInputRef.current?.click()}
          disabled={!editor || !onUploadImage}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImagePick}
        />
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
