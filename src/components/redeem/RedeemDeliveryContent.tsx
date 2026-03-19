import { useMemo, useState } from 'react'

import { getRedeemContentDocument, readStructuredRedeemContent } from '../../lib/redeemContent'
import { copyText } from '../../lib/utils'
import type { RichTextJson } from '../../types/content'
import { RichTextViewer } from '../rich-text/RichTextViewer'

type CopyState = {
  fieldId: string
  status: 'copied' | 'error'
} | null

export function RedeemDeliveryContent({
  content,
  enableCopy = true,
  emptyMessage = '商家暂未填写可展示的兑换内容，请联系商家处理。',
}: {
  content: RichTextJson
  enableCopy?: boolean
  emptyMessage?: string
}) {
  const [copyState, setCopyState] = useState<CopyState>(null)
  const structuredContent = useMemo(() => readStructuredRedeemContent(content), [content])

  if (!structuredContent) {
    return <RichTextViewer content={getRedeemContentDocument(content)} />
  }

  const visibleFields = structuredContent.deliveryFields.filter((field) => field.label && field.value)
  const hasNotes = Boolean(structuredContent.otherContent)

  const handleCopy = async (fieldId: string, value: string) => {
    try {
      await copyText(value)
      setCopyState({ fieldId, status: 'copied' })
      window.setTimeout(() => {
        setCopyState((current) => (current?.fieldId === fieldId ? null : current))
      }, 1800)
    } catch {
      setCopyState({ fieldId, status: 'error' })
    }
  }

  if (visibleFields.length === 0 && !hasNotes) {
    return <p className="text-sm leading-6 text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="space-y-4">
      {visibleFields.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleFields.map((field) => {
            const fieldCopyState = copyState?.fieldId === field.id ? copyState.status : 'idle'

            return (
              <article key={field.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{field.label}</p>
                    <p className="mt-3 whitespace-pre-wrap break-all font-mono text-sm leading-6 text-slate-900">{field.value}</p>
                  </div>
                  {enableCopy ? (
                    <button
                      type="button"
                      aria-label={`复制 ${field.label}`}
                      onClick={() => void handleCopy(field.id, field.value)}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {fieldCopyState === 'copied' ? '已复制' : '复制'}
                    </button>
                  ) : null}
                </div>
                {fieldCopyState === 'error' ? <p className="mt-3 text-xs text-rose-600">复制失败，请手动复制。</p> : null}
              </article>
            )
          })}
        </div>
      ) : null}

      {hasNotes ? (
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-900">其他说明</p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{structuredContent.otherContent}</p>
        </article>
      ) : null}
    </div>
  )
}
