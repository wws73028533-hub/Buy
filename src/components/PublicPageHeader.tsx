import type { ReactNode } from 'react'

export function PublicPageHeader({
  badge,
  title,
  description,
  actions,
  aside,
}: {
  badge: string
  title: string
  description: string
  actions?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 px-5 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
            {badge}
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}
