import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { RedeemFieldListEditor } from './RedeemFieldListEditor'
import { RedeemDeliveryContent } from '../redeem/RedeemDeliveryContent'
import {
  createDefaultRedeemContentFields,
  createRedeemContent,
  readRedeemContentFields,
} from '../../lib/redeemContent'
import type { RedeemContentFields } from '../../lib/redeemContent'
import { copyText, formatDateTime } from '../../lib/utils'
import { createRedeemItems, deleteRedeemItem, saveRedeemItem } from '../../services/adminApi'
import type { Product, RedeemItem, RedeemItemBulkInput, RedeemItemInput } from '../../types/content'

function createDefaultRedeemContent(): RedeemItemInput['contentJson'] {
  return createRedeemContent()
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

type TemplateMode = 'blank' | 'custom'

function updateContentJson(
  contentJson: RedeemItemInput['contentJson'],
  updater: (fields: RedeemContentFields) => RedeemContentFields,
) {
  return createRedeemContent(updater(readRedeemContentFields(contentJson)))
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
  const [bulkInput, setBulkInput] = useState<Omit<RedeemItemBulkInput, 'contentJson'>>({
    productId: products[0]?.id ?? '',
    count: 10,
  })
  const [bulkTemplateMode, setBulkTemplateMode] = useState<TemplateMode>('blank')
  const [bulkTemplateFields, setBulkTemplateFields] = useState<RedeemContentFields>(() => createDefaultRedeemContentFields())
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const sortedItems = useMemo(() => sortRedeemItems(items), [items])
  const selectedItem = useMemo(
    () => sortedItems.find((item) => item.id === selectedId) ?? null,
    [selectedId, sortedItems],
  )
  const draftFields = useMemo(() => readRedeemContentFields(draft.contentJson), [draft.contentJson])

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

  const updateDraftFields = (updater: (fields: RedeemContentFields) => RedeemContentFields) => {
    setDraft((current) => ({
      ...current,
      contentJson: updateContentJson(current.contentJson, updater),
    }))
  }

  const updateBulkTemplateFields = (updater: (fields: RedeemContentFields) => RedeemContentFields) => {
    setBulkTemplateFields((current) => updater(current))
  }

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
        contentJson: bulkTemplateMode === 'custom' ? createRedeemContent(bulkTemplateFields) : createDefaultRedeemContent(),
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

    const confirmMessage = selectedItem.redeemedAt
      ? '确认删除这个已兑换的兑换码吗？删除后买家将无法再查看历史记录。'
      : '确认删除这个兑换码吗？'

    if (!window.confirm(confirmMessage)) {
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
      <div data-testid="redeem-sidebar" className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">按商品批量生成兑换码</p>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              支持把账号、密码、2FA 做成独立字段，也可以自由新增、重命名或删除这些展示框。
            </p>
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

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">生成模板</span>
              <select
                value={bulkTemplateMode}
                onChange={(event) => setBulkTemplateMode(event.target.value as TemplateMode)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              >
                <option value="blank">空白模板（后续逐个填写）</option>
                <option value="custom">自定义模板（批量写入下方内容）</option>
              </select>
            </label>

            {bulkTemplateMode === 'custom' ? (
              <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/70 p-4">
                <p className="text-sm font-medium text-slate-900">自定义模板改到右侧编辑</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  为了避免编辑区过挤，账号、密码、2FA 等模板字段已放到右侧主页面，可在更宽的位置统一配置。
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || products.length === 0}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating ? '生成中...' : '批量生成兑换码'}
            </button>

            <p className="text-xs leading-6 text-slate-500">单次最多生成 200 个码；即使已兑换，后续也支持继续修改内容或直接删除。</p>
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

      <div data-testid="redeem-main-column" className="space-y-6">
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

        {bulkTemplateMode === 'custom' ? (
          <section data-testid="bulk-template-editor" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">批量生成模板内容</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                当前选择的是“自定义模板”，右侧这里配置的账号、密码、2FA 和补充说明会写入本次生成的每个兑换码。
              </p>
            </div>

            <RedeemFieldListEditor
              fields={bulkTemplateFields.deliveryFields}
              onChange={(deliveryFields) =>
                updateBulkTemplateFields((current) => ({
                  ...current,
                  deliveryFields,
                }))
              }
              addButtonLabel="新增模板字段"
            />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">模板其他内容</span>
              <textarea
                aria-label="模板其他内容"
                value={bulkTemplateFields.otherContent}
                onChange={(event) =>
                  updateBulkTemplateFields((current) => ({
                    ...current,
                    otherContent: event.target.value,
                  }))
                }
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                placeholder="填写统一的登录步骤、注意事项或补充说明"
              />
            </label>

            <p className="text-xs leading-6 text-slate-500">确认无误后，直接点击左侧的“批量生成兑换码”即可按当前模板批量创建。</p>
          </section>
        ) : null}

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
                      ? `使用于 ${formatDateTime(selectedItem.redeemedAt)}，现在也允许继续修改或删除`
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
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                  >
                    删除兑换码
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">关联商品</span>
                <select
                  value={draft.productId}
                  onChange={(event) => setDraft((current) => ({ ...current, productId: event.target.value }))}
                  disabled={products.length === 0}
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
                  这些字段会在前台独立成卡片展示，并支持一键复制；你可以自由新增、删除或改名。
                </p>
              </div>

              <RedeemFieldListEditor
                fields={draftFields.deliveryFields}
                onChange={(deliveryFields) =>
                  updateDraftFields((current) => ({
                    ...current,
                    deliveryFields,
                  }))
                }
              />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">其他内容</span>
                <textarea
                  aria-label="其他内容"
                  value={draftFields.otherContent}
                  onChange={(event) =>
                    updateDraftFields((current) => ({
                      ...current,
                      otherContent: event.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                  placeholder="填写登录步骤、注意事项或补充说明"
                />
              </label>

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-900">买家看到的内容预览</p>
                <RedeemDeliveryContent content={draft.contentJson} enableCopy={false} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {saving ? '保存中...' : '保存兑换内容'}
                </button>
                <span className="text-sm text-slate-500">
                  {selectedItem.redeemedAt
                    ? '这个码已兑换过，保存后会同步更新历史查看内容。'
                    : '保存后，这个兑换码将使用自己的独立内容。'}
                </span>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  )
}
