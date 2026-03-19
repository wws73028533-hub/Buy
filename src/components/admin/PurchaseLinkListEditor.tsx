import type { PurchaseLink } from '../../types/content'

export function PurchaseLinkListEditor({
  title,
  description,
  emptyMessage,
  helperText,
  links,
  addButtonLabel = '新增入口',
  onAdd,
  onChange,
  onRemove,
}: {
  title: string
  description: string
  emptyMessage: string
  helperText: string
  links: PurchaseLink[]
  addButtonLabel?: string
  onAdd: () => void
  onChange: (index: number, key: 'label' | 'url', value: string) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-slate-700">{title}</span>
          <p className="mt-1 text-xs leading-6 text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900"
        >
          {addButtonLabel}
        </button>
      </div>

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((item, index) => (
            <div key={`purchase-link-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">入口名称</span>
                  <input
                    value={item.label}
                    onChange={(event) => onChange(index, 'label', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                    placeholder={index === 0 ? '例如：淘宝店铺' : '例如：备用店铺'}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">链接地址</span>
                  <input
                    value={item.url}
                    onChange={(event) => onChange(index, 'url', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                    placeholder="例如：https://your-platform.com/item/123"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  删除该入口
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}

      <p className="text-xs leading-6 text-slate-400">{helperText}</p>
    </div>
  )
}
