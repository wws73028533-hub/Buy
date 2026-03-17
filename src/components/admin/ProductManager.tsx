import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { deleteProduct, saveProduct, uploadPublicFile } from '../../services/adminApi'
import type { Product, ProductInput } from '../../types/content'
import { fileToDataUrl, formatDate, slugify } from '../../lib/utils'
import { RichTextEditor } from '../rich-text/RichTextEditor'

function createEmptyProduct(): ProductInput {
  return {
    title: '',
    slug: '',
    coverImageUrl: null,
    contentJson: { type: 'doc', content: [{ type: 'paragraph' }] },
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
      window.alert('请填写有效的 slug')
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
      window.alert('商品已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '商品保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!draft.id) {
      setDraft(createEmptyProduct())
      setCoverFile(null)
      setCoverPreview(null)
      return
    }

    if (!window.confirm('确认删除这个商品吗？')) {
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
            <p className="text-xs text-slate-500">共 {items.length} 个商品</p>
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
              还没有商品，先创建一个吧。
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
                  {item.isPublished ? '已发布' : '草稿'}
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
              placeholder="例如：摄影课程礼包"
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
              placeholder="photo-course"
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
            <span className="text-sm font-medium text-slate-700">发布到前台首页</span>
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">封面图片</p>
              <p className="mt-1 text-xs text-slate-500">首页卡片与详情页头图使用同一张封面。</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="h-48 w-full rounded-2xl object-cover" />
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">点击上传封面</span>
                  <span className="mt-1 text-xs text-slate-400">建议横向图片，清晰展示商品主体</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">商品详情</p>
              <p className="mt-1 text-xs text-slate-500">支持标题、列表、引用、链接和图片上传。</p>
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
            {saving ? '保存中...' : draft.id ? '保存商品' : '创建商品'}
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
