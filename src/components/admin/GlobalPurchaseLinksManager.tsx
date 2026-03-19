import { useEffect, useState } from 'react'

import { createEmptyPurchaseLink, sanitizePurchaseLinks } from '../../lib/purchaseLinks'
import { saveGlobalPurchaseLinks } from '../../services/adminApi'
import type { PurchaseLink } from '../../types/content'
import { PurchaseLinkListEditor } from './PurchaseLinkListEditor'

export function GlobalPurchaseLinksManager({
  links,
  onChange,
}: {
  links: PurchaseLink[]
  onChange: (links: PurchaseLink[]) => void
}) {
  const [draftLinks, setDraftLinks] = useState<PurchaseLink[]>(links)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraftLinks(links)
  }, [links])

  const handleAdd = () => {
    setDraftLinks((current) => [...current, createEmptyPurchaseLink()])
  }

  const handleChange = (index: number, key: 'label' | 'url', value: string) => {
    setDraftLinks((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    )
  }

  const handleRemove = (index: number) => {
    setDraftLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleSave = async () => {
    let purchaseLinks = draftLinks

    try {
      purchaseLinks = sanitizePurchaseLinks(draftLinks)
    } catch (error) {
      const message = error instanceof Error ? error.message : '全局购买入口格式不正确'
      window.alert(message)
      return
    }

    setSaving(true)

    try {
      const savedLinks = await saveGlobalPurchaseLinks(purchaseLinks)
      onChange(savedLinks)
      window.alert('全局购买入口已保存')
    } catch (error) {
      const message = error instanceof Error ? error.message : '全局购买入口保存失败'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <PurchaseLinkListEditor
        title="全局购买入口"
        description="这里配置的入口会展示在所有商品详情页，无需再逐个商品重复填写。"
        emptyMessage="暂未添加全局购买入口。建议把所有商品都可购买的店铺链接放在这里统一维护。"
        helperText="若某个商品还配置了专属入口，前台会优先展示专属入口，再补充这里的全局入口。"
        links={draftLinks}
        onAdd={handleAdd}
        onChange={handleChange}
        onRemove={handleRemove}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? '保存中...' : '保存全局购买入口'}
        </button>
      </div>
    </section>
  )
}
