import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { RichTextViewer } from '../components/rich-text/RichTextViewer'
import { usePageMeta } from '../hooks/usePageMeta'
import { getRichTextTextBlocks } from '../lib/richText'
import { copyText, formatDate } from '../lib/utils'
import { getPublishedProductBySlug } from '../services/publicApi'
import type { Product } from '../types/content'

const fallbackHighlights = [
  '先看商品介绍，确认它是否适合你的需求和使用场景。',
  '想进一步了解使用方式，可以继续查看使用指南。',
  '下单前后有问题，都可以通过咨询售后页面联系商家。',
]

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

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

  const textBlocks = useMemo(
    () => (product ? getRichTextTextBlocks(product.contentJson).filter(Boolean) : []),
    [product],
  )
  const summary = textBlocks[0] ?? '这里集中展示商品亮点、使用说明和购买前需要知道的信息。'
  const highlights = textBlocks.slice(1, 4)
  const concernItems = highlights.length > 0 ? highlights : fallbackHighlights

  const handleCopyCode = async () => {
    if (!product?.purchaseCode) {
      return
    }

    try {
      await copyText(product.purchaseCode)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
    }
  }

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
    <article className="space-y-6 lg:space-y-8">
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
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              在售商品
            </span>
            <span className="text-sm text-slate-400">最近更新于 {formatDate(product.updatedAt)}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{product.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">{summary}</p>
          <p className="mt-2 text-xs leading-6 text-slate-400">本网站仅做商品展示，购买需跳转到其它平台完成。</p>

          {highlights.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {product.purchaseLinkUrl ? (
              <a
                href={product.purchaseLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                链接直达购买
              </a>
            ) : null}
            {product.purchaseCode ? (
              <button
                type="button"
                onClick={() => void handleCopyCode()}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                复制购买口令
              </button>
            ) : null}
            {!product.purchaseLinkUrl && !product.purchaseCode ? (
              <Link
                to="/support"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                先联系客服购买
              </Link>
            ) : null}
          </div>
          {copyStatus === 'copied' ? (
            <p className="mt-3 text-xs text-emerald-600">购买口令已复制，可以前往外部平台粘贴搜索。</p>
          ) : null}
          {copyStatus === 'error' ? (
            <p className="mt-3 text-xs text-rose-600">复制失败，请手动复制下方口令内容。</p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-7 shadow-soft sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">商品介绍</span>
            <span className="text-sm text-slate-400">按你的需求阅读亮点、说明和注意事项</span>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 px-5 py-6 sm:px-6">
            <RichTextViewer content={product.contentJson} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">购买方式</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">本站不支持直接支付，可通过商家提供的外部链接或购买口令完成下单。</p>
            {product.purchaseLinkUrl || product.purchaseCode ? (
              <div className="mt-4 space-y-4">
                {product.purchaseLinkUrl ? (
                  <a
                    href={product.purchaseLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    链接直达购买
                  </a>
                ) : null}
                {product.purchaseCode ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">复制口令</p>
                      <button
                        type="button"
                        onClick={() => void handleCopyCode()}
                        className="text-sm font-semibold text-brand-600"
                      >
                        一键复制
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-all text-sm leading-6 text-slate-600">
                      {product.purchaseCode}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                当前商品暂未配置站外购买链接或口令，建议先联系客服确认购买方式。
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">你可能最关心</h2>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-500">
              {concernItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">继续了解与售后支持</h2>
            <div className="mt-4 grid gap-3">
              <Link
                to="/tutorials"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                去看使用指南
              </Link>
              <Link
                to="/support"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                联系咨询售后
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              如果你想确认细节、补充资料或售后政策，直接前往咨询售后页面会更高效。
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
