import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { PublicPageHeader } from '../components/PublicPageHeader'
import { SectionCard } from '../components/SectionCard'
import { RichTextViewer } from '../components/rich-text/RichTextViewer'
import { usePageMeta } from '../hooks/usePageMeta'
import { getRedeemContentDocument } from '../lib/redeemContent'
import { formatDateTime } from '../lib/utils'
import { redeemByCode } from '../services/publicApi'
import type { RedeemResult } from '../types/content'

const redeemTips = [
  '请输入卖家单独发给你的兑换码。',
  '首次兑换后，该兑换码会标记为已使用。',
  '如果后续忘记内容，可再次输入同一兑换码查看兑换记录。',
]

export function RedeemPage() {
  usePageMeta({
    title: '兑换码',
    description: '输入卖家提供的兑换码，直接查看对应的交付内容。',
  })

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redemption, setRedemption] = useState<RedeemResult | null>(null)

  const isHistoryView = redemption?.accessMode === 'history'

  const resultDescription = useMemo(() => {
    if (!redemption) {
      return ''
    }

    return isHistoryView
      ? `兑换记录查看，首次使用时间：${formatDateTime(redemption.redeemedAt)}`
      : `首次兑换成功，使用时间：${formatDateTime(redemption.redeemedAt)}`
  }, [isHistoryView, redemption])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!code.trim()) {
      setError('请输入兑换码')
      setRedemption(null)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await redeemByCode(code)
      setRedemption(result)
      setCode('')
    } catch (submitError) {
      setRedemption(null)
      setError(submitError instanceof Error ? submitError.message : '兑换失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <PublicPageHeader
        badge="兑换码"
        title="拿到兑换码后，在这里直接兑换或查看交付记录。"
        description="有些商品会通过兑换码发货。请输入卖家提供的兑换码，系统会直接展示对应的账号、密码、步骤或备注说明。"
        aside={
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            首次使用后会标记为 <span className="font-semibold text-slate-900">已使用</span>，后续仍可查看记录
          </div>
        }
        actions={
          <>
            <Link
              to="/products"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              查看商品页
            </Link>
            <Link
              to="/support"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              联系商家
            </Link>
          </>
        }
      />

      <SectionCard title="输入兑换码" description="请输入卖家提供的兑换码。支持大小写混输，带空格或连字符也可以识别。">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">兑换码</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base uppercase outline-none transition focus:border-brand-400"
              placeholder="例如：ABCD-EFGH-JKLM"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {submitting ? '查询中...' : '立即查看'}
            </button>
            <span className="text-sm text-slate-500">首次输入会记录使用时间；之后再次输入同一码，可直接查看兑换记录。</span>
          </div>
        </form>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-900">兑换前请注意</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
            {redeemTips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      </SectionCard>

      {redemption ? (
        <SectionCard title={redemption.title} description={resultDescription}>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-6 sm:px-6">
            <RichTextViewer content={getRedeemContentDocument(redemption.contentJson)} />
          </div>
          <div
            className={`mt-5 rounded-3xl px-5 py-4 text-sm leading-6 ${
              isHistoryView
                ? 'border border-sky-200 bg-sky-50 text-sky-800'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {isHistoryView
              ? '这是该兑换码的历史兑换记录。如需补发或变更，请联系商家处理。'
              : '当前兑换码已标记为已使用，请及时保存上方内容；后续忘记时可再次输入同一码查看记录。'}
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="兑换结果会显示在这里" description="输入正确兑换码并提交后，这里会展示对应的交付内容。">
          <EmptyState
            title="暂未兑换任何内容"
            description="如果你已经拿到兑换码，请直接在上方输入；如果还没有，请先联系商家获取。"
            action={
              <Link to="/support" className="text-sm font-medium text-brand-600 underline underline-offset-4">
                去咨询售后页联系商家
              </Link>
            }
          />
        </SectionCard>
      )}
    </div>
  )
}
