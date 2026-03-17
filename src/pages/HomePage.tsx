import { Link } from 'react-router-dom'

import { SectionCard } from '../components/SectionCard'
import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { ProductCard } from '../components/ProductCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

const journeyCards = [
  {
    title: '先逛主推商品',
    description: '先从热推商品开始了解，快速判断风格、亮点和是否适合自己。',
    action: '浏览全部商品 →',
    href: '/products',
    icon: '🛍️',
  },
  {
    title: '再看使用指南',
    description: '下单前先了解使用方式、资料入口和常见问题，选择更放心。',
    action: '查看使用指南 →',
    href: '/tutorials',
    icon: '📘',
  },
  {
    title: '有疑问就咨询',
    description: '售前想确认细节，或购买后需要帮助，都能快速找到咨询与售后入口。',
    action: '联系咨询售后 →',
    href: '/support',
    icon: '💬',
  },
]

const confidenceCards = [
  {
    title: '信息更好懂',
    description: '商品亮点、使用说明、咨询售后分开展示，浏览路径更清晰。',
  },
  {
    title: '决策更省心',
    description: '先看你最关心的内容，再决定是否继续了解或咨询，减少无效翻找。',
  },
  {
    title: '购买后也方便',
    description: '需要使用指南、补充资料或售后支持时，不用回头翻聊天记录。',
  },
]

const serviceTags = ['热推商品优先看', '使用指南集中找', '咨询售后更好联系']

export function HomePage() {
  usePageMeta({
    title: '首页',
    description: '面向消费者的商品首页，帮助用户快速浏览热推商品、使用指南与咨询售后入口。',
  })

  const { products, tutorials, contacts, loading, error } = useSiteContent()
  const featuredProduct = products[0] ?? null

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-slate-950 px-6 py-12 text-white shadow-[0_30px_120px_rgba(15,23,42,0.26)] sm:px-10 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(129,140,248,0.30),transparent_22%),radial-gradient(circle_at_10%_15%,rgba(45,212,191,0.16),transparent_20%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))]" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
              精选商品 · 使用指南 · 咨询售后
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              先了解商品亮点，再决定哪一款更适合你。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              这里把热推商品、使用说明和咨询售后入口整理在一起，帮助你在选购前看得更清楚，购买后也能快速找到支持。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                浏览全部商品
              </Link>
              <Link
                to="/tutorials"
                className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                先看使用指南
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              {serviceTags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <article className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-sm text-slate-300">已上架商品</p>
              <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{products.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">从主推款开始逛，再挑更适合你的选择。</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-sm text-slate-300">使用指南</p>
              <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{tutorials.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">购买前能先了解，购买后也方便回看。</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-sm text-slate-300">服务入口</p>
              <p className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{contacts.length}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">售前咨询、售后支持都能更快找到。</p>
            </article>
          </div>
        </div>
      </section>

      {loading ? <LoadingView message="正在加载首页内容..." /> : null}
      {error ? <EmptyState title="首页内容加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          <SectionCard
            title="第一次来这里，建议这样逛"
            description="电商首页最重要的不是堆满信息，而是帮你快速进入最合适的下一步。"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {journeyCards.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-soft"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                    {item.icon}
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
                  <div className="mt-6 text-sm font-semibold text-brand-600 transition group-hover:translate-x-1">
                    {item.action}
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="为什么这样排布更适合消费者"
            description="参考电商首页常见做法：先给清晰入口，再给信任感和后续支持。"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {confidenceCards.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">•</div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          {featuredProduct ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-stretch">
              <ProductCard product={featuredProduct} featured />
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
                <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  热推商品
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">先从这款商品开始了解，更容易做判断</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-500">
                  <li>• 先看核心亮点，快速判断这款商品是否符合你的需求。</li>
                  <li>• 想继续深入时，可以直接查看使用指南和常见资料。</li>
                  <li>• 若还想确认细节，再去咨询售后页面联系商家会更高效。</li>
                </ul>
                <div className="mt-6 grid gap-3">
                  <Link
                    to={`/products/${featuredProduct.slug}`}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    查看热推商品详情
                  </Link>
                  <Link
                    to="/products"
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    浏览全部商品
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <SectionCard title="商品正在陆续上新" description="当前还没有公开展示的商品，欢迎稍后再来看。">
              <EmptyState
                title="精选商品即将上线"
                description="商家正在整理展示内容，后续会上架更多适合浏览与比较的商品。"
              />
            </SectionCard>
          )}
        </>
      ) : null}
    </div>
  )
}
