import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { copyText, formatDateTime } from '../../lib/utils'
import { createRedeemItems, deleteRedeemItem, saveRedeemItem } from '../../services/adminApi'
import type { Product, RedeemItem, RedeemItemBulkInput, RedeemItemInput } from '../../types/content'
import { RichTextEditor } from '../rich-text/RichTextEditor'
import { RichTextViewer } from '../rich-text/RichTextViewer'

function createDefaultRedeemContent(): RedeemItemInput['contentJson'] {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '请填写这个兑换码专属的账号、密码、登录方式、步骤和注意事项。每个兑换码都应该维护自己的独立内容。',
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
                content: [{ type: 'text', text: '账号 / 密码 / 链接 / 登录方式' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '使用步骤 / 到期时间 / 备注 / 风险提示' }],
              },
            ],
          },
        ],
      },
    ],
  }
}

function createEmptyDraft(productId: string | null): RedeemItemInput {
  return {
    productId: productId ?? '',
    contentJson: createDefaultRedeemContent(),
  }
}

function sortRedeemItems(items: RedeemItem[]) {
  return [...items].sort((a, b) => {
    if (a.redeemedAt && !b.redeemedAt) {
      return 1
    }

    if (!a.redeemedAt && b.redeemedAt) {
      return -1
    }

    const updated = b.updatedAt.localeCompare(a.updatedAt)

    if (updated !== 0) {
      return updated
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function RedeemManager({
  items,
  products,
  onChange,
}: {
  items: RedeemItem[]
  products: Product[]
  onChange: (items: RedeemItem[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<RedeemItemInput>(() => createEmptyDraft(products[0]?.id ?? null))
  const [bulkInput, setBulkInput] = useState<RedeemItemBulkInput>({
    productId: products[0]?.id ?? '',
    count: 10,
  })
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const sortedItems = useMemo(() => sortRedeemItems(items), [items])
  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [selectedId, sortedItems],
  )

  useEffect(() => {
    if (selectedId && sortedItems.some((item) => item.id === selectedId)) {
      return
    }

    setSelectedId(sortedItems[0]?.id ?? null)
  }, [selectedId, sortedItems])

  useEffect(() => {
    if (products.length === 0) {
      setBulkInput((current) => ({ ...current, productId: '' }))
      return
    }

    setBulkInput((current) => {
      if (current.productId) {
        return current
      }

      return {
        ...current,
        productId: products[0].id,
      }
    })
  }, [products])

  useEffect(() => {
    if (selectedItem) {
      setDraft({
        id: selectedItem.id,
        productId: selectedItem.productId,
        contentJson: selectedItem.contentJson,
      })
      return
    }

    setDraft(createEmptyDraft(products[0]?.id ?? null))
  }, [products, selectedItem])

  const codeSummary = useMemo(() => {
    const redeemedCount = sortedItems.filter((item) => item.redeemedAt).length

    return {
      total: sortedItems.length,
      pending: sortedItems.length - redeemedCount,
      redeemed: redeemedCount,
    }
  }, [sortedItems])

  const handleCreate = async () => {
    if (products.length === 0) {
      window.alert('请先创建至少 1 个商品，再生成兑换码')
      return
    }

    if (!bulkInput.productId) {
      window.alert('请先选择商品')
      return
    }

    const count = Number(bulkInput.count)

    if (!Number.isInteger(count) || count < 1 || count > 200) {
      window.alert('单次生成数量必须在 1 到 200 之间')
      return
    }

    setCreating(true)

    try {
      const createdItems = await createRedeemItems({
        productId: bulkInput.productId,
        count,
      })
      const nextItems = sortRedeemItems([...createdItems, ...items])

      onChange(nextItems)
      setSelectedId(createdItems[0]?.id ?? nextItems[0]?.id ?? null)
      window.alert(`已生成 ${createdItems.length} 个兑换码`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换码生成失败'
      window.alert(message)
    } finally {
      setCreating(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedItem?.id || !draft.id) {
      window.alert('请先在左侧选择一个兑换码')
      return
    }

    if (selectedItem.redeemedAt) {
      window.alert('已使用的兑换码不能再修改')
      return
    }

    if (!draft.productId) {
      window.alert('请先选择关联商品')
      return
    }

    setSaving(true)

    try {
      const saved = await saveRedeemItem({
        id: draft.id,
        productId: draft.productId,
        contentJson: draft.contentJson,
      })

      const nextItems = sortRedeemItems(items.map((item) => (item.id === saved.id ? saved : item)))
      onChange(nextItems)
      window.alert('兑换码内容已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换码保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) {
      return
    }

    if (selectedItem.redeemedAt) {
      window.alert('已使用的兑换码不能删除')
      return
    }

    if (!window.confirm('确认删除这个未兑换的兑换码吗？')) {
      return
    }

    try {
      await deleteRedeemItem(selectedItem.id)
      const nextItems = sortRedeemItems(items.filter((item) => item.id !== selectedItem.id))

      onChange(nextItems)
      setSelectedId(nextItems[0]?.id ?? null)
      window.alert('兑换码已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换码删除失败'
      window.alert(message)
    }
  }

  const handleCopyCode = async (code: string, itemId: string) => {
    try {
      await copyText(code)
      setCopiedCodeId(itemId)
      window.setTimeout(() => {
        setCopiedCodeId((current) => (current === itemId ? null : current))
      }, 1800)
    } catch {
      window.alert('复制失败，请手动复制兑换码')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">按商品批量生成空白码</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">先选择商品并生成独立兑换码，生成后再逐条补充对应账号内容。</p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">关联商品</span>
              <select
                value={bulkInput.productId}
                onChange={(event) =>
                  setBulkInput((current) => ({
                    ...current,
                    productId: event.target.value,
                  }))
                }
                disabled={products.length === 0}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400 disabled:bg-slate-100"
              >
                {products.length === 0 ? <option value="">请先创建商品</option> : null}
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">本次生成数量</span>
              <input
                type="number"
                min={1}
                max={200}
                value={bulkInput.count}
                onChange={(event) =>
                  setBulkInput((current) => ({
                    ...current,
                    count: Number(event.target.value || 0),
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || products.length === 0}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating ? '生成中...' : '批量生成兑换码'}
            </button>

            <p className="text-xs leading-6 text-slate-500">单次最多生成 200 个码；每个码都会单独保存内容并在兑换后自动失效。</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">兑换码列表</p>
              <p className="text-xs text-slate-500">共 {codeSummary.total} 个兑换码</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
              待兑换 {codeSummary.pending}
            </span>
          </div>

          <div className="space-y-3">
            {sortedItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                还没有兑换码，建议先按商品批量生成一批空白码。
              </p>
            ) : null}

            {sortedItems.map((item) => (
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
                    <p className="break-all font-mono text-sm font-semibold text-slate-900">{item.code}</p>
                    <p className="mt-1 text-xs text-slate-500">商品：{item.productTitle}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.redeemedAt ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.redeemedAt ? '已使用' : '待兑换'}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-400">创建于 {formatDateTime(item.createdAt)}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-slate-500">总数</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{codeSummary.total}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-slate-500">待兑换</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{codeSummary.pending}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs text-slate-500">已使用</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{codeSummary.redeemed}</p>
          </article>
        </div>

        {!selectedItem ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
            请先在左侧选择一个兑换码；如果还没有兑换码，请先按商品批量生成。
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">当前兑换码</p>
                  <p className="mt-2 break-all font-mono text-lg font-semibold text-slate-950">{selectedItem.code}</p>
                  <p className="mt-2 text-xs text-slate-500">创建于 {formatDateTime(selectedItem.createdAt)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedItem.redeemedAt
                      ? `使用于 ${formatDateTime(selectedItem.redeemedAt)}`
                      : '尚未被买家兑换'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyCode(selectedItem.code, selectedItem.id)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {copiedCodeId === selectedItem.id ? '已复制' : '复制兑换码'}
                  </button>
                  {!selectedItem.redeemedAt ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      删除作废
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400">
                      已使用不可删除
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">关联商品</span>
                <select
                  value={draft.productId}
                  onChange={(event) => setDraft((current) => ({ ...current, productId: event.target.value }))}
                  disabled={Boolean(selectedItem.redeemedAt) || products.length === 0}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400 disabled:bg-slate-100"
                >
                  <option value="">请选择商品</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <p className="text-sm font-medium text-slate-900">兑换后展示内容</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  这里填写这个兑换码专属的账号、密码、步骤和备注。已使用的记录只展示，不允许再修改。
                </p>
              </div>

              {selectedItem.redeemedAt ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <RichTextViewer content={selectedItem.contentJson} />
                </div>
              ) : (
                <RichTextEditor value={draft.contentJson} onChange={(contentJson) => setDraft((current) => ({ ...current, contentJson }))} />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || Boolean(selectedItem.redeemedAt)}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {saving ? '保存中...' : '保存兑换内容'}
                </button>
                {selectedItem.redeemedAt ? (
                  <span className="text-sm text-slate-500">该兑换码已标记为已使用，当前内容仅供查看。</span>
                ) : (
                  <span className="text-sm text-slate-500">保存后，该兑换码将使用自己的独立内容，不再共享其它兑换码数据。</span>
                )}
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  )
}
