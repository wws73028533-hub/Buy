import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { copyText, formatDateTime } from '../../lib/utils'
import { deleteRedeemCode, generateRedeemCodes, saveRedeemBatch } from '../../services/adminApi'
import type { RedeemBatch, RedeemBatchInput, RedeemCode } from '../../types/content'
import { RichTextEditor } from '../rich-text/RichTextEditor'

function createDefaultRedeemContent(): RedeemBatchInput['contentJson'] {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '请在这里填写买家兑换成功后要看到的完整内容，例如账号、密码、登录方式、领取步骤或注意事项。',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '建议包含' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '文案标题：买家兑换后先看到的说明' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '账号 / 密码 / 链接 / 使用步骤 / 注意事项' }],
              },
            ],
          },
        ],
      },
    ],
  }
}

function createEmptyBatch(): RedeemBatchInput {
  return {
    title: '',
    contentJson: createDefaultRedeemContent(),
  }
}

function sortRedeemCodes(items: RedeemCode[]) {
  return [...items].sort((a, b) => {
    if (a.redeemedAt && !b.redeemedAt) {
      return 1
    }

    if (!a.redeemedAt && b.redeemedAt) {
      return -1
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

function sortRedeemBatches(items: RedeemBatch[]) {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function normalizeBatch(item: RedeemBatch) {
  return {
    ...item,
    codes: sortRedeemCodes(item.codes),
  }
}

export function RedeemManager({
  items,
  onChange,
}: {
  items: RedeemBatch[]
  onChange: (items: RedeemBatch[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string>('new')
  const [draft, setDraft] = useState<RedeemBatchInput>(createEmptyBatch())
  const [generationCount, setGenerationCount] = useState(10)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    if (selectedItem) {
      setDraft({
        id: selectedItem.id,
        title: selectedItem.title,
        contentJson: selectedItem.contentJson,
      })
      return
    }

    if (selectedId === 'new') {
      setDraft(createEmptyBatch())
    }
  }, [selectedId, selectedItem])

  const codeSummary = useMemo(() => {
    const codes = selectedItem?.codes ?? []
    const redeemedCount = codes.filter((item) => item.redeemedAt).length

    return {
      total: codes.length,
      pending: codes.length - redeemedCount,
      redeemed: redeemedCount,
    }
  }, [selectedItem])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.title.trim()) {
      window.alert('请先填写兑换内容标题')
      return
    }

    setSaving(true)

    try {
      const saved = normalizeBatch(
        await saveRedeemBatch({
          ...draft,
          title: draft.title.trim(),
        }),
      )

      const nextItems = sortRedeemBatches(
        items.some((item) => item.id === saved.id)
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items],
      )

      onChange(nextItems)
      setSelectedId(saved.id)
      window.alert('兑换模板已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换模板保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateCodes = async () => {
    if (!selectedItem?.id) {
      window.alert('请先保存兑换模板，再生成兑换码')
      return
    }

    const count = Number(generationCount)

    if (!Number.isInteger(count) || count < 1 || count > 200) {
      window.alert('单次生成数量必须在 1 到 200 之间')
      return
    }

    setGenerating(true)

    try {
      const codes = await generateRedeemCodes(selectedItem.id, count)
      const nextItems = sortRedeemBatches(
        items.map((item) =>
          item.id === selectedItem.id
            ? normalizeBatch({
                ...item,
                codes: [...codes, ...item.codes],
              })
            : item,
        ),
      )

      onChange(nextItems)
      window.alert(`已生成 ${codes.length} 个兑换码`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换码生成失败'
      window.alert(message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteCode = async (codeId: string) => {
    if (!selectedItem) {
      return
    }

    if (!window.confirm('确认删除这个未兑换的兑换码吗？')) {
      return
    }

    try {
      await deleteRedeemCode(codeId)
      const nextItems = items.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              codes: item.codes.filter((code) => code.id !== codeId),
            }
          : item,
      )

      onChange(sortRedeemBatches(nextItems.map((item) => normalizeBatch(item))))
      window.alert('兑换码已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换码删除失败'
      window.alert(message)
    }
  }

  const handleCopyCode = async (code: RedeemCode) => {
    try {
      await copyText(code.code)
      setCopiedCodeId(code.id)
      window.setTimeout(() => {
        setCopiedCodeId((current) => (current === code.id ? null : current))
      }, 1800)
    } catch {
      window.alert('复制失败，请手动复制兑换码')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">兑换模板</p>
            <p className="text-xs text-slate-500">共 {items.length} 组兑换内容模板</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建模板
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              还没有兑换模板，建议先创建 1 组可直接交付给买家的内容。
            </p>
          ) : null}
          {items.map((item) => {
            const redeemedCount = item.codes.filter((code) => code.redeemedAt).length

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedId === item.id
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 line-clamp-2">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      共 {item.codes.length} 个码 · 已兑换 {redeemedCount} 个
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    模板
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">更新于 {formatDateTime(item.updatedAt)}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">兑换内容标题</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：ChatGPT Plus 账号兑换内容"
            />
          </label>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">兑换后展示内容</p>
              <p className="mt-1 text-xs text-slate-500">建议直接写清账号、密码、步骤、备注和注意事项，买家兑换后会立即看到。</p>
            </div>
            <RichTextEditor value={draft.contentJson} onChange={(contentJson) => setDraft((current) => ({ ...current, contentJson }))} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {saving ? '保存中...' : draft.id ? '保存兑换模板' : '创建兑换模板'}
            </button>
            <span className="text-sm text-slate-500">先保存模板，再按同一内容批量生成随机兑换码。</span>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">批量生成兑换码</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">同一模板可一次生成多条随机兑换码，适合给不同买家发不同的码。</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">总数</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{codeSummary.total}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">待兑换</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{codeSummary.pending}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">已兑换</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{codeSummary.redeemed}</p>
              </article>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">本次生成数量</span>
              <input
                type="number"
                min={1}
                max={200}
                value={generationCount}
                onChange={(event) => setGenerationCount(Number(event.target.value || 0))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleGenerateCodes()}
              disabled={generating || !selectedItem?.id}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {generating ? '生成中...' : '批量生成随机兑换码'}
            </button>

            {!selectedItem?.id ? (
              <p className="text-xs leading-6 text-amber-600">请先保存当前模板，保存后才能生成兑换码。</p>
            ) : (
              <p className="text-xs leading-6 text-slate-500">单次最多生成 200 个码；兑换成功后会自动失效，不能重新启用。</p>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">兑换码列表</p>
                <p className="mt-1 text-xs text-slate-500">可复制发给买家；仅未兑换的码可以删除作废。</p>
              </div>
              {selectedItem ? (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  当前模板：{selectedItem.title}
                </span>
              ) : null}
            </div>

            {!selectedItem ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                请先在左侧选择一个模板，或先创建并保存模板。
              </p>
            ) : selectedItem.codes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                这个模板下还没有兑换码，点击左侧“批量生成随机兑换码”即可创建。
              </p>
            ) : (
              <div className="space-y-3">
                {selectedItem.codes.map((code) => (
                  <article key={code.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all font-mono text-sm font-semibold text-slate-900">{code.code}</p>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              code.redeemedAt
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {code.redeemedAt ? '已兑换' : '待兑换'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">创建于 {formatDateTime(code.createdAt)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {code.redeemedAt ? `兑换于 ${formatDateTime(code.redeemedAt)}` : '尚未被买家兑换'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopyCode(code)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {copiedCodeId === code.id ? '已复制' : '复制兑换码'}
                        </button>
                        {!code.redeemedAt ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteCode(code.id)}
                            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                          >
                            删除作废
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400">
                            已兑换不可删除
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
