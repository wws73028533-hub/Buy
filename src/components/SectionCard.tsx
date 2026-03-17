import type { PropsWithChildren, ReactNode } from 'react'

export function SectionCard({
  title,
  description,
  action,
  children,
}: PropsWithChildren<{
  title: string
  description?: string
  action?: ReactNode
}>) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h2>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}
