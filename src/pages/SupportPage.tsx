import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

const servicePromises = [
  {
    title: '售前也能问',
    description: '下单前想确认商品细节、适合人群或使用方式，都可以先来这里咨询。',
  },
  {
    title: '售后更好找',
    description: '购买后需要答疑、补发资料或处理问题时，不用翻聊天记录也能找到入口。',
  },
  {
    title: '联系更高效',
    description: '把二维码、跳转链接和说明文案放在一起，能更快找到适合你的联系方式。',
  },
]

export function SupportPage() {
  usePageMeta({
    title: '咨询售后',
    description: '集中展示咨询与售后入口的页面，方便消费者快速联系商家。',
  })

  const { contacts, loading, error } = useSiteContent()

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-[2.25rem] border border-slate-200 bg-white/90 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 sm:py-12">
        <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          咨询售后
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          需要咨询、答疑或售后支持？这里都能快速找到入口。
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-500 sm:text-lg">
          无论你是下单前想确认细节，还是购买后需要帮助，我们都把常用联系方式整理在这里，方便你第一时间联系到人。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            回到商品页
          </Link>
          <Link
            to="/tutorials"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            先看使用指南
          </Link>
        </div>
      </section>

      {loading ? <LoadingView message="正在加载咨询与售后信息..." /> : null}
      {error ? <EmptyState title="咨询售后页面加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          <SectionCard title="联系客服前，你可能最关心这些" description="把消费者最常见的问题先说明清楚，联系时会更省心。">
            <div className="grid gap-4 md:grid-cols-3">
              {servicePromises.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">✦</div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="立即联系" description="选择你最方便的方式，售前咨询和售后支持都可以从这里开始。">
            {contacts.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {contacts.map((contact) => (
                  <article
                    key={contact.id}
                    className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-soft"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-lg">
                        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          咨询 / 售后入口
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{contact.label}</h3>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{contact.value}</p>
                        {contact.linkUrl ? (
                          <a
                            href={contact.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            立即联系
                          </a>
                        ) : null}
                      </div>
                      {contact.qrImageUrl ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                          <img
                            src={contact.qrImageUrl}
                            alt={`${contact.label} 二维码`}
                            className="h-36 w-36 rounded-2xl object-cover"
                          />
                          <p className="mt-3 text-center text-xs text-slate-500">扫码即可联系</p>
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
        </>
      ) : null}
    </div>
  )
}
