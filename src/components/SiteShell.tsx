import { Link, NavLink, Outlet } from 'react-router-dom'

import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/products', label: '全部商品' },
  { to: '/tutorials', label: '使用指南' },
  { to: '/support', label: '咨询售后' },
]

const serviceHighlights = ['售前咨询', '使用指南', '售后支持']

export function SiteShell() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_30%,#f8fafc_100%)] text-slate-700">
      <div className="fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.18),transparent_42%),radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.12),transparent_24%)]" />

      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="border-b border-slate-200/70 bg-white/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-xs text-slate-500 sm:px-6 lg:px-8">
            {serviceHighlights.map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 ? <span className="text-slate-300">•</span> : null}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
              甄选好物馆
            </Link>
            <p className="mt-1 text-xs text-slate-500">先看商品亮点，再看使用指南，需要帮助时也能快速找到人。</p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>

      <footer className="mt-10 border-t border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div>
            <p className="text-base font-semibold text-slate-900">甄选好物馆</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              把商品亮点、使用指南和咨询售后入口分开展示，让你在选购前看得更清楚，购买后也更省心。
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:items-end">
            <div className="flex flex-wrap gap-4">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} className="transition hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
            <Link to="/admin" className="text-xs transition hover:text-slate-900">
              商家入口
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
