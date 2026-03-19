import { createRedeemDeliveryField, getDefaultRedeemFieldLabel } from '../../lib/redeemContent'
import type { RedeemDeliveryField } from '../../lib/redeemContent'

export function RedeemFieldListEditor({
  fields,
  onChange,
  addButtonLabel = '新增展示字段',
}: {
  fields: RedeemDeliveryField[]
  onChange: (fields: RedeemDeliveryField[]) => void
  addButtonLabel?: string
}) {
  const handleFieldChange = (fieldId: string, partial: Partial<RedeemDeliveryField>) => {
    onChange(fields.map((field) => (field.id === fieldId ? { ...field, ...partial } : field)))
  }

  const handleFieldAdd = () => {
    onChange([...fields, createRedeemDeliveryField({ label: getDefaultRedeemFieldLabel(fields.length) }, fields.length)])
  }

  const handleFieldRemove = (fieldId: string) => {
    onChange(fields.filter((field) => field.id !== fieldId))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">独立展示字段</p>
          <p className="mt-1 text-xs leading-6 text-slate-500">前台会把这些字段逐个展示，并为每个字段提供一键复制按钮。</p>
        </div>
        <button
          type="button"
          onClick={handleFieldAdd}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          {addButtonLabel}
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          暂无展示字段，点击“{addButtonLabel}”后即可继续配置。
        </div>
      ) : null}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <section key={field.id} data-testid="redeem-field-editor-card" className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-900">字段 {index + 1}</p>
              <button
                type="button"
                onClick={() => handleFieldRemove(field.id)}
                className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
              >
                删除字段
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">字段标题</span>
                <input
                  aria-label="字段标题"
                  value={field.label}
                  onChange={(event) => handleFieldChange(field.id, { label: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400"
                  placeholder={getDefaultRedeemFieldLabel(index)}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">字段内容</span>
                <textarea
                  aria-label="字段内容"
                  value={field.value}
                  onChange={(event) => handleFieldChange(field.id, { value: event.target.value })}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400"
                  placeholder="填写买家兑换后会看到的内容"
                />
              </label>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
