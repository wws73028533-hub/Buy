import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { RichTextViewer } from '../components/rich-text/RichTextViewer'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatDate } from '../lib/utils'
import { getPublishedProductBySlug } from '../services/publicApi'
import type { Product } from '../types/content'

const helpSteps = [
  '先看商品介绍，确认这款商品是否符合你的需求。',
  '想进一步了解使用方式，可以继续查看使用指南。',
  '下单前后有问题，都可以通过咨询售后页面联系商家。',
]

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageMeta({
    title: product?.title ?? '商品详情',
    description: product ? `${product.title} 的商品详情页。` : '商品详情页',
  })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await getPublishedProductBySlug(slug)

        if (!active) {
          return
        }

        setProduct(result)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '商品详情加载失败')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return <LoadingView message="正在加载商品详情..." />
  }

  if (error) {
    return <EmptyState title="商品详情加载失败" description={error} />
  }

  if (!product) {
    return (
      <EmptyState
        title="暂时没有找到这款商品"
        description="你访问的链接可能已失效，或该商品当前未对外展示。"
        action={
          <Link to="/products" className="text-sm font-medium text-brand-600 underline underline-offset-4">
            返回全部商品
          </Link>
        }
      />
    )
  }

  return (
    <article className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link to="/products" className="font-medium text-brand-600 underline underline-offset-4">
          ← 返回全部商品
        </Link>
        <span className="text-slate-300">/</span>
        <span>商品详情</span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-stretch">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
          <div className="aspect-[16/10] bg-slate-100 sm:aspect-[16/8]">
            {product.coverImageUrl ? (
              <img src={product.coverImageUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">暂无封面图片</div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-7">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            商品详情
          </span>
          <p className="mt-4 text-sm text-slate-400">最近更新于 {formatDate(product.updatedAt)}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{product.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            这里会集中展示这款商品的核心亮点、适合人群、使用说明与注意事项，方便你在继续了解前先做判断。
          </p>
          <div className="mt-6 grid gap-3">
            <Link
              to="/tutorials"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              查看使用指南
            </Link>
            <Link
              to="/support"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              咨询售后支持
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-soft sm:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">商品介绍</span>
            <span className="text-sm text-slate-400">建议结合自己的需求和使用场景阅读</span>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-6 sm:px-8">
            <RichTextViewer content={product.contentJson} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">了解这款商品的建议顺序</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-500">
              {helpSteps.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">温馨提示</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              如果你想确认细节、补充资料或售后政策，建议直接前往咨询售后页面，会比在商品介绍里来回翻找更高效。
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
