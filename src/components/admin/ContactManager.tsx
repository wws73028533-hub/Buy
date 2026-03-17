import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { deleteContact, saveContact, uploadPublicFile } from '../../services/adminApi'
import type { ContactInput, ContactItem } from '../../types/content'
import { fileToDataUrl, formatDate } from '../../lib/utils'

function createEmptyContact(): ContactInput {
  return {
    label: '',
    value: '',
    linkUrl: '',
    qrImageUrl: null,
    sortOrder: 0,
    isPublished: false,
  }
}

function sortContacts(items: ContactItem[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function ContactManager({
  items,
  onChange,
}: {
  items: ContactItem[]
  onChange: (items: ContactItem[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string>('new')
  const [draft, setDraft] = useState<ContactInput>(createEmptyContact())
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    if (selectedItem) {
      setDraft({
        id: selectedItem.id,
        label: selectedItem.label,
        value: selectedItem.value,
        linkUrl: selectedItem.linkUrl,
        qrImageUrl: selectedItem.qrImageUrl,
        sortOrder: selectedItem.sortOrder,
        isPublished: selectedItem.isPublished,
      })
      setQrFile(null)
      setQrPreview(selectedItem.qrImageUrl)
      return
    }

    if (selectedId === 'new') {
      setDraft(createEmptyContact())
      setQrFile(null)
      setQrPreview(null)
    }
  }, [selectedId, selectedItem])

  const handleQrChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setQrFile(file)
    setQrPreview(await fileToDataUrl(file))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.label.trim() || !draft.value.trim()) {
      window.alert('请填写联系方式标题与内容')
      return
    }

    setSaving(true)

    try {
      const qrImageUrl = qrFile
        ? await uploadPublicFile('contact-qrcodes', 'images', qrFile)
        : draft.qrImageUrl

      const saved = await saveContact({
        ...draft,
        linkUrl: draft.linkUrl?.trim() || null,
        qrImageUrl,
      })

      const nextItems = sortContacts(
        items.some((item) => item.id === saved.id)
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items],
      )

      onChange(nextItems)
      setSelectedId(saved.id)
      setQrFile(null)
      setQrPreview(saved.qrImageUrl)
      window.alert('联系方式已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '联系方式保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!draft.id) {
      setDraft(createEmptyContact())
      setQrFile(null)
      setQrPreview(null)
      return
    }

    if (!window.confirm('确认删除这个联系方式吗？')) {
      return
    }

    setSaving(true)

    try {
      await deleteContact(draft.id)
      const nextItems = items.filter((item) => item.id !== draft.id)
      onChange(nextItems)
      setSelectedId('new')
      window.alert('联系方式已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '联系方式删除失败'
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
            <p className="text-sm font-medium text-slate-900">联系方式</p>
            <p className="text-xs text-slate-500">共 {items.length} 条售后信息</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建联系项
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              还没有售后联系方式。
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
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.value}</p>
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
            <span className="text-sm font-medium text-slate-700">联系方式标题</span>
            <input
              value={draft.label}
              onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：微信售后"
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
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">展示内容</span>
          <textarea
            value={draft.value}
            onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
            placeholder="例如：添加微信请备注订单号，工作日 10:00-18:00 回复。"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">跳转链接（可选）</span>
          <input
            value={draft.linkUrl ?? ''}
            onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
            placeholder="例如：https://weixin.qq.com/... 或 mailto:..."
          />
        </label>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div>
            <p className="text-sm font-medium text-slate-900">二维码（可选）</p>
            <p className="mt-1 text-xs text-slate-500">可上传微信或社媒二维码，首页将直接展示。</p>
          </div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            {qrPreview ? (
              <img src={qrPreview} alt="二维码预览" className="h-52 w-52 rounded-2xl object-cover" />
            ) : (
              <>
                <span className="text-sm font-medium text-slate-700">点击上传二维码</span>
                <span className="mt-1 text-xs text-slate-400">未上传时，首页只显示文字和链接</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleQrChange} />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={(event) =>
              setDraft((current) => ({ ...current, isPublished: event.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-slate-700">显示到首页售后联系方式区</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {saving ? '保存中...' : draft.id ? '保存联系项' : '创建联系项'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {draft.id ? '删除联系项' : '清空表单'}
          </button>
        </div>
      </form>
    </div>
  )
}
