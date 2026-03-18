import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { PublicPageHeader } from '../components/PublicPageHeader'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

export function SupportPage() {
  usePageMeta({
    title: '咨询售后',
    description: '集中展示咨询与售后入口的页面，方便消费者快速联系商家。',
  })

  const { contacts, loading, error } = useSiteContent()

  return (
    <div className="space-y-6 lg:space-y-8">
      <PublicPageHeader
        badge="咨询售后"
        title="需要联系商家时，这里直接给你入口。"
        description="顶部只保留必要说明，真正的咨询和售后联系方式直接往前放，方便你尽快联系到人。"
        aside={
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            当前可联系 <span className="font-semibold text-slate-900">{contacts.length}</span> 个入口
          </div>
        }
        actions={
          <>
            <Link
              to="/products"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              回到商品页
            </Link>
            <Link
              to="/tutorials"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              先看使用指南
            </Link>
          </>
        }
      />

      {loading ? <LoadingView message="正在加载咨询与售后信息..." /> : null}
      {error ? <EmptyState title="咨询售后页面加载失败" description={error} /> : null}

      {!loading && !error ? (
        <SectionCard title="咨询与售后入口" description="选择你最方便的方式，售前咨询和售后支持都可以从这里开始。">
          {contacts.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {contacts.map((contact) => (
                <article
                  key={contact.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-lg">
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        咨询 / 售后入口
                      </div>
                      <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{contact.label}</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{contact.value}</p>
                      {contact.linkUrl ? (
                        <a
                          href={contact.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          立即联系
                        </a>
                      ) : null}
                    </div>
                    {contact.qrImageUrl ? (
                      <div className="shrink-0 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <img
                          src={contact.qrImageUrl}
                          alt={`${contact.label} 二维码`}
                          className="block h-32 w-32 rounded-2xl bg-white object-contain"
                        />
                        <p className="mt-2 text-center text-xs text-slate-500">扫码即可联系</p>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="咨询入口正在整理中"
              description="当前还没有公开展示的联系方式，欢迎稍后再来查看。"
            />
          )}
        </SectionCard>
      ) : null}
    </div>
  )
}
