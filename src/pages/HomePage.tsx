import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { ProductCard } from '../components/ProductCard'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

const serviceTags = ['热推商品优先看', '使用指南集中找', '咨询售后更好联系']

export function HomePage() {
  usePageMeta({
    title: '首页',
    description: '面向消费者的商品首页，帮助用户快速浏览热推商品、使用指南与咨询售后入口。',
  })

  const { products, tutorials, contacts, loading, error } = useSiteContent()
  const featuredProduct = products[0] ?? null
  const otherProducts = featuredProduct ? products.slice(1) : products
  const featuredTutorials = tutorials.slice(0, 2)
  const featuredContacts = contacts.slice(0, 2)

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.26)] sm:px-8 sm:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(129,140,248,0.28),transparent_22%),radial-gradient(circle_at_10%_15%,rgba(45,212,191,0.16),transparent_20%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-slate-100 backdrop-blur">
              精选商品 · 使用指南 · 咨询售后
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              先看核心内容，再决定下一步。
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              这次首页把引导区缩小，把商品、指南和服务入口往前提，让你更快进入真正有用的内容。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                浏览全部商品
              </Link>
              <Link
                to="/tutorials"
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                查看使用指南
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300 sm:text-sm">
              {serviceTags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs text-slate-300">商品</p>
              <p className="mt-1 text-2xl font-semibold text-white">{products.length}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs text-slate-300">指南</p>
              <p className="mt-1 text-2xl font-semibold text-white">{tutorials.length}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs text-slate-300">服务</p>
              <p className="mt-1 text-2xl font-semibold text-white">{contacts.length}</p>
            </article>
          </div>
        </div>
      </section>

      {loading ? <LoadingView message="正在加载首页内容..." /> : null}
      {error ? <EmptyState title="首页内容加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          {featuredProduct ? (
            <SectionCard title="热推商品" description="首页直接展示当前优先推荐的商品。">
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_320px] xl:items-stretch">
                <ProductCard product={featuredProduct} featured />
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    快速入口
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">需要继续了解？直接进入对应内容</h3>
                  <div className="mt-5 grid gap-3">
                    <Link
                      to={`/products/${featuredProduct.slug}`}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      查看热推详情
                    </Link>
                    <Link
                      to="/tutorials"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      配套使用指南
                    </Link>
                    <Link
                      to="/support"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      咨询售后支持
                    </Link>
                  </div>
                </div>
              </section>
            </SectionCard>
          ) : null}

          {otherProducts.length > 0 ? (
            <SectionCard title="更多在售商品" description="除了热推款，其它商品也可以直接继续浏览。">
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {otherProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="使用指南"
              description="购买前先了解，购买后也方便随时回看。"
              action={
                <Link to="/tutorials" className="text-sm font-semibold text-brand-600">
                  查看全部 →
                </Link>
              }
            >
              {featuredTutorials.length > 0 ? (
                <div className="space-y-4">
                  {featuredTutorials.map((tutorial, index) => {
                    const href = tutorial.type === 'link' ? tutorial.url : tutorial.fileUrl

                    return (
                      <a
                        key={tutorial.id}
                        href={href ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                          {tutorial.type === 'link' ? '↗' : '⇩'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              第 {index + 1} 项
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {tutorial.type === 'link' ? '图文说明 / 外部页面' : '资料下载 / 文件领取'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-1">打开 →</span>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <EmptyState title="使用指南正在整理中" description="当前还没有公开展示的指南内容。" />
              )}
            </SectionCard>

            <SectionCard
              title="咨询售后"
              description="售前问题和购买后支持都能更快找到。"
              action={
                <Link to="/support" className="text-sm font-semibold text-brand-600">
                  查看全部 →
                </Link>
              }
            >
              {featuredContacts.length > 0 ? (
                <div className="space-y-4">
                  {featuredContacts.map((contact) => (
                    <article key={contact.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{contact.label}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">{contact.value}</p>
                        </div>
                        {contact.qrImageUrl ? (
                          <img src={contact.qrImageUrl} alt={`${contact.label} 二维码`} className="h-20 w-20 rounded-2xl object-cover" />
                        ) : null}
                      </div>
                      {contact.linkUrl ? (
                        <a
                          href={contact.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold text-brand-600"
                        >
                          立即联系 →
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="咨询入口正在整理中" description="当前还没有公开展示的服务入口。" />
              )}
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  )
}
