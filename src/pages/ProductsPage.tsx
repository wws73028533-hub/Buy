import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { ProductCard } from '../components/ProductCard'
import { PublicPageHeader } from '../components/PublicPageHeader'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

export function ProductsPage() {
  usePageMeta({
    title: '全部商品',
    description: '集中展示所有商品的页面，方便消费者浏览、比较并进入详情页。',
  })

  const { products, loading, error } = useSiteContent()
  const featuredProduct = products[0] ?? null
  const remainingProducts = featuredProduct ? products.slice(1) : products

  return (
    <div className="space-y-6 lg:space-y-8">
      <PublicPageHeader
        badge="全部商品"
        title="先看在售商品，再决定继续了解哪一款。"
        description="页面头部只保留必要说明，商品内容会更早出现。你可以直接浏览热推商品和全部在售商品。"
        aside={
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            已上架 <span className="font-semibold text-slate-900">{products.length}</span> 款
          </div>
        }
        actions={
          <>
            <Link
              to="/tutorials"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              查看使用指南
            </Link>
            <Link
              to="/support"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              咨询售后支持
            </Link>
          </>
        }
      />

      {loading ? <LoadingView message="正在加载商品内容..." /> : null}
      {error ? <EmptyState title="商品页加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          {featuredProduct ? (
            <SectionCard title="热推商品" description="优先看看这款，快速了解当前主推内容。">
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-stretch">
                <ProductCard product={featuredProduct} featured />
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    优先浏览
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">想先快速判断，可以从这款开始</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    它会先帮你建立整体印象；如果还想继续比较，再往下浏览其它商品即可。
                  </p>
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
                  </div>
                </div>
              </section>
            </SectionCard>
          ) : null}

          <SectionCard title="全部商品" description="点击卡片即可查看商品介绍、使用方式和购买前须知。">
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
