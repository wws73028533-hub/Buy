import { Link } from 'react-router-dom'

import type { Product } from '../types/content'

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className={`group relative overflow-hidden rounded-[1.75rem] border bg-white transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-2xl ${
        featured
          ? 'border-slate-900/10 shadow-[0_24px_80px_rgba(15,23,42,0.14)]'
          : 'border-slate-200 shadow-soft'
      }`}
    >
      <div className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow backdrop-blur">
        {featured ? '本周推荐' : '查看详情'}
      </div>

      <div className={`relative overflow-hidden bg-slate-100 ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.18))] opacity-80" />
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            暂无商品图片
          </div>
        )}
      </div>

      <div className={featured ? 'p-7 sm:p-8' : 'p-5'}>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-600/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
          Curated Picks
        </div>
        <h3
          className={`mt-3 line-clamp-2 font-semibold tracking-tight text-slate-900 ${featured ? 'text-2xl sm:text-[2rem]' : 'text-lg'}`}
        >
          {product.title}
        </h3>
        <p
          className={`mt-3 text-slate-500 ${featured ? 'max-w-2xl text-base leading-7' : 'line-clamp-2 text-sm leading-6'}`}
        >
          {featured
            ? '优先看看这款热推商品的亮点、适合人群和使用说明，能更快判断它是否适合你。'
            : '点开查看商品亮点、使用方式与购买前须知。'}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          查看商品亮点
          <span className="transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  )
}
