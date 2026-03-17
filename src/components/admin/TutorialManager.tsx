import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { deleteTutorial, saveTutorial, uploadPublicFile } from '../../services/adminApi'
import type { TutorialInput, TutorialItem } from '../../types/content'
import { formatDate } from '../../lib/utils'

function createEmptyTutorial(): TutorialInput {
  return {
    title: '',
    type: 'link',
    url: '',
    fileUrl: null,
    sortOrder: 0,
    isPublished: false,
  }
}

function sortTutorials(items: TutorialItem[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }

    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function TutorialManager({
  items,
  onChange,
}: {
  items: TutorialItem[]
  onChange: (items: TutorialItem[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string>('new')
  const [draft, setDraft] = useState<TutorialInput>(createEmptyTutorial())
  const [uploadFile, setUploadFile] = useState<File | null>(null)
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
        type: selectedItem.type,
        url: selectedItem.url,
        fileUrl: selectedItem.fileUrl,
        sortOrder: selectedItem.sortOrder,
        isPublished: selectedItem.isPublished,
      })
      setUploadFile(null)
      return
    }

    if (selectedId === 'new') {
      setDraft(createEmptyTutorial())
      setUploadFile(null)
    }
  }, [selectedId, selectedItem])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadFile(event.target.files?.[0] ?? null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.title.trim()) {
      window.alert('请先填写指南标题')
      return
    }

    if (draft.type === 'link' && !draft.url?.trim()) {
      window.alert('在线指南必须填写链接地址')
      return
    }

    if (draft.type === 'file' && !draft.fileUrl && !uploadFile) {
      window.alert('资料下载必须上传文件')
      return
    }

    setSaving(true)

    try {
      const fileUrl =
        draft.type === 'file'
          ? uploadFile
            ? await uploadPublicFile('tutorial-files', 'files', uploadFile)
            : draft.fileUrl
          : null

      const saved = await saveTutorial({
        ...draft,
        url: draft.type === 'link' ? draft.url?.trim() || null : null,
        fileUrl,
      })

      const nextItems = sortTutorials(
        items.some((item) => item.id === saved.id)
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items],
      )

      onChange(nextItems)
      setSelectedId(saved.id)
      setUploadFile(null)
      window.alert('指南内容已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '指南保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!draft.id) {
      setDraft(createEmptyTutorial())
      setUploadFile(null)
      return
    }

    if (!window.confirm('确认删除这条指南内容吗？')) {
      return
    }

    setSaving(true)

    try {
      await deleteTutorial(draft.id)
      const nextItems = items.filter((item) => item.id !== draft.id)
      onChange(nextItems)
      setSelectedId('new')
      window.alert('指南已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : '指南删除失败'
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
            <p className="text-sm font-medium text-slate-900">使用指南</p>
            <p className="text-xs text-slate-500">共 {items.length} 个指南或资料入口</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建指南
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              还没有使用指南，建议先补充 1 份新手上手内容。
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
                  <p className="mt-1 text-xs text-slate-500">
                    {item.type === 'link' ? '外部链接' : '文件下载'}
                  </p>
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
            <span className="text-sm font-medium text-slate-700">教程标题</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：新手上手指南"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">内容类型</span>
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as TutorialInput['type'],
                  url: event.target.value === 'link' ? current.url : null,
                  fileUrl: event.target.value === 'file' ? current.fileUrl : null,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
            >
              <option value="link">在线指南</option>
              <option value="file">资料下载</option>
            </select>
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
            <span className="text-sm font-medium text-slate-700">对外展示到使用指南页</span>
          </label>
        </div>

        {draft.type === 'link' ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">链接地址</span>
            <input
              value={draft.url ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
              placeholder="例如：https://your-brand.com/start-here"
            />
          </label>
        ) : (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-medium text-slate-900">上传教程文件</p>
              <p className="mt-1 text-xs text-slate-500">支持 PDF、DOCX、ZIP 等常见格式，适合放说明书、资料包或模板。</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <span className="text-sm font-medium text-slate-700">
                {uploadFile ? uploadFile.name : '点击选择资料文件'}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                {draft.fileUrl ? '已存在文件，可重新上传覆盖' : '还未上传文件'}
              </span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            {draft.fileUrl ? (
              <a
                href={draft.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand-600 underline underline-offset-4"
              >
                查看当前文件
              </a>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {saving ? '保存中...' : draft.id ? '保存指南' : '创建指南'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {draft.id ? '删除指南' : '清空表单'}
          </button>
        </div>
      </form>
    </div>
  )
}
