import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { deleteProduct, saveProduct, uploadPublicFile } from '../../services/adminApi'
import { createEmptyPurchaseLink, getProductPurchaseLinks, sanitizePurchaseLinks } from '../../lib/purchaseLinks'
import type { Product, ProductInput } from '../../types/content'
import { fileToDataUrl, formatDate, slugify } from '../../lib/utils'
import { PurchaseLinkListEditor } from './PurchaseLinkListEditor'
import { RichTextEditor } from '../rich-text/RichTextEditor'

function createDefaultProductContent(): ProductInput['contentJson'] {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '先用 1 段话说明这款商品最大的亮点，以及消费者为什么值得先看它。',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '适合谁' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '例如：第一次了解这类商品、想先快速上手的人' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '例如：更在意省心服务与售后支持的人' }],
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '你会得到什么' }],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '例如：核心权益、使用说明、配套资料等' }],
              },
            ],
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '例如：售前咨询、售后答疑或补充资料支持' }],
              },
            ],
          },
        ],
      },
    ],
  }
}

function createEmptyProduct(): ProductInput {
  return {
    title: '',
    slug: '',
    coverImageUrl: null,
    purchaseLinkUrl: '',
    purchaseLinks: [],
    purchaseCode: '',
    contentJson: createDefaultProductContent(),
    sortOrder: 0,
    isPublished: false,
  }
}

function sortProducts(items: Product[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function ProductManager({
  items,
  onChange,
}: {
  items: Product[]
  onChange: (items: Product[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string>('new')
  const [draft, setDraft] = useState<ProductInput>(createEmptyProduct())
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    if (selectedItem) {
      setDraft({
        id: selectedItem.id,
        title: selectedItem.title,
        slug: selectedItem.slug,
        coverImageUrl: selectedItem.coverImageUrl,
        purchaseLinkUrl: selectedItem.purchaseLinkUrl,
        purchaseLinks: getProductPurchaseLinks(selectedItem),
        purchaseCode: selectedItem.purchaseCode,
        contentJson: selectedItem.contentJson,
        sortOrder: selectedItem.sortOrder,
        isPublished: selectedItem.isPublished,
      })
      setCoverFile(null)
      setCoverPreview(selectedItem.coverImageUrl)
      return
    }

    if (selectedId === 'new') {
      setDraft(createEmptyProduct())
      setCoverFile(null)
      setCoverPreview(null)
    }
  }, [selectedId, selectedItem])

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setCoverFile(file)
    setCoverPreview(await fileToDataUrl(file))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.title.trim()) {
      window.alert('请先填写商品标题')
      return
    }

    const slug = slugify(draft.slug || draft.title)

    if (!slug) {
      window.alert('请填写有效的页面链接')
      return
    }

    let purchaseLinks = draft.purchaseLinks

    try {
      purchaseLinks = sanitizePurchaseLinks(draft.purchaseLinks)
    } catch (error) {
      const message = error instanceof Error ? error.message : '购买入口格式不正确'
      window.alert(message)
      return
    }

    setSaving(true)

    try {
      const coverImageUrl = coverFile
        ? await uploadPublicFile('product-images', 'covers', coverFile)
        : draft.coverImageUrl

      const saved = await saveProduct({
        ...draft,
        slug,
        coverImageUrl,
        purchaseLinkUrl: purchaseLinks[0]?.url ?? null,
        purchaseLinks,
        purchaseCode: draft.purchaseCode?.trim() || null,
      })

      const nextItems = sortProducts(
        items.some((item) => item.id === saved.id)
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items],
      )

      onChange(nextItems)
      setSelectedId(saved.id)
      setCoverFile(null)
      setCoverPreview(saved.coverImageUrl)
      window.alert('商品内容已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '商品保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPurchaseLink = () => {
    setDraft((current) => ({
      ...current,
      purchaseLinks: [...current.purchaseLinks, createEmptyPurchaseLink()],
    }))
  }

  const handlePurchaseLinkChange = (index: number, key: 'label' | 'url', value: string) => {
    setDraft((current) => ({
      ...current,
      purchaseLinks: current.purchaseLinks.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    }))
  }

  const handleRemovePurchaseLink = (index: number) => {
    setDraft((current) => ({
      ...current,
      purchaseLinks: current.purchaseLinks.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleDelete = async () => {
    if (!draft.id) {
      setDraft(createEmptyProduct())
      setCoverFile(null)
      setCoverPreview(null)
      return
    }

    if (!window.confirm('确认删除这款商品吗？')) {
      return
    }

    setSaving(true)

    try {
      await deleteProduct(draft.id)
      const nextItems = items.filter((item) => item.id !== draft.id)
      onChange(nextItems)
      setSelectedId('new')
      window.alert('商品已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '商品删除失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">商品列表</p>
            <p className="text-xs text-slate-500">共 {items.length} 个前台商品</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建商品
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              还没有商品内容，建议先创建 1 款主推商品。
            </p>
          ) : null}
          {items.map((item) => (
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
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.isPublished
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.isPublished ? '对外展示' : '草稿'}
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">更新于 {formatDate(item.updatedAt)}</p>
            </button>
          ))}
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">商品标题</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：AI 协作尊享权益"
            />
          </label>
          <label className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">页面 slug</span>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, slug: slugify(current.title) }))}
                className="text-xs font-medium text-brand-600"
              >
                根据标题生成
              </button>
            </div>
            <input
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="ai-collaboration-membership"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">排序值</span>
            <input
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value || 0),
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(event) =>
                setDraft((current) => ({ ...current, isPublished: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">对外展示到商品页</span>
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PurchaseLinkListEditor
            title="商品专属购买入口（可选）"
            description="这里只对当前商品生效。若同时配置了全局购买入口，详情页会把两者一起展示。"
            emptyMessage="暂未添加商品专属入口。若这款商品没有特殊购买页，可以只使用上方的全局购买入口。"
            helperText="未填写入口名称时，系统会自动补成“默认入口 / 入口 2 / 入口 3”。"
            links={draft.purchaseLinks}
            onAdd={handleAddPurchaseLink}
            onChange={handlePurchaseLinkChange}
            onRemove={handleRemovePurchaseLink}
          />

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">购买口令（可选）</span>
            <textarea
              value={draft.purchaseCode ?? ''}
              onChange={(event) =>
                setDraft((current) => ({ ...current, purchaseCode: event.target.value }))
              }
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：复制口令后打开对应平台搜索：AI 协作尊享权益"
            />
            <p className="text-xs leading-6 text-slate-400">填写后，详情页会提供“一键复制口令”，方便用户去其它平台搜索下单。</p>
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">封面图片</p>
              <p className="mt-1 text-xs text-slate-500">商品卡片和详情页头图会共用这张图片，建议优先突出商品主体。</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="block h-48 w-full rounded-2xl bg-white object-contain" />
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">点击上传封面</span>
                  <span className="mt-1 text-xs text-slate-400">建议横向图片，首屏就能看清商品氛围和重点</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">商品详情</p>
              <p className="mt-1 text-xs text-slate-500">建议写清核心亮点、适合人群、服务说明和常见问题，帮助消费者更快做判断。</p>
            </div>
            <RichTextEditor
              value={draft.contentJson}
              onChange={(contentJson) => setDraft((current) => ({ ...current, contentJson }))}
              onUploadImage={(file) => uploadPublicFile('product-images', 'content', file)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {saving ? '保存中...' : draft.id ? '保存商品内容' : '创建商品'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {draft.id ? '删除商品' : '清空表单'}
          </button>
        </div>
      </form>
    </div>
  )
}
