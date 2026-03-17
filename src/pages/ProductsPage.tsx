import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { ProductCard } from '../components/ProductCard'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

const browseNotes = [
  {
    title: '先看热推推荐',
    description: '第一次逛时，先看热推商品，通常更容易快速理解整体风格和核心亮点。',
  },
  {
    title: '再横向比较',
    description: '继续浏览其它商品时，可以对比亮点、适合人群和使用方式。',
  },
  {
    title: '需要时再咨询',
    description: '如果下单前还有疑问，可先查看使用指南或直接联系咨询售后。',
  },
]

export function ProductsPage() {
  usePageMeta({
    title: '全部商品',
    description: '集中展示所有商品的页面，方便消费者浏览、比较并进入详情页。',
  })

  const { products, loading, error } = useSiteContent()
  const featuredProduct = products[0] ?? null
  const remainingProducts = featuredProduct ? products.slice(1) : products

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-[2.25rem] border border-slate-200 bg-white/90 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 sm:py-12">
        <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          全部商品
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          挑一款更适合你的商品，先看亮点，再决定是否继续了解。
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-500 sm:text-lg">
          这里集中展示所有已上架商品。每张卡片都能继续进入详情页，查看商品介绍、使用说明和购买前需要知道的信息。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/tutorials"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            先看使用指南
          </Link>
          <Link
            to="/support"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            咨询售后支持
          </Link>
        </div>
      </section>

      {loading ? <LoadingView message="正在加载商品内容..." /> : null}
      {error ? <EmptyState title="商品页加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          <SectionCard title="这样逛商品会更省心" description="按电商常见浏览节奏，把选择路径尽量做得简单直观。">
            <div className="grid gap-4 md:grid-cols-3">
              {browseNotes.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">✦</div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          {featuredProduct ? (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-stretch">
              <ProductCard product={featuredProduct} featured />
              <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
                <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  热推推荐
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">第一次来，建议优先看看这款</h2>
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  热推商品更适合帮助你快速建立印象。先看清它的亮点与使用方式，再决定是否继续比较其它商品，会更高效。
                </p>
                <div className="mt-6 grid gap-3">
                  <Link
                    to={`/products/${featuredProduct.slug}`}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    查看热推商品
                  </Link>
                  <Link
                    to="/tutorials"
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    配套使用指南
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <SectionCard title="继续逛逛其它商品" description="点击卡片即可查看商品介绍、使用方式和购买前须知。">
            {products.length === 0 ? (
              <EmptyState
                title="商品正在陆续上新"
                description="当前还没有公开展示的商品，欢迎稍后再回来看看。"
              />
            ) : remainingProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {remainingProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="当前主推这 1 款商品"
                description="你可以先查看上方热推商品详情，后续更多商品会持续补充。"
              />
            )}
          </SectionCard>
        </>
      ) : null}
    </div>
  )
}
