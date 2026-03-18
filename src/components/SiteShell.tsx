import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { cn } from '../lib/utils'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/products', label: '全部商品' },
  { to: '/tutorials', label: '使用指南' },
  { to: '/redeem', label: '兑换码' },
  { to: '/support', label: '咨询售后' },
]

function isNavItemActive(pathname: string, to: string) {
  if (to === '/') {
    return pathname === '/'
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}

export function SiteShell() {
  const { pathname } = useLocation()
  const [mobileNavState, setMobileNavState] = useState({ pathname, isOpen: false })

  const activeNavItem = navItems.find((item) => isNavItemActive(pathname, item.to)) ?? navItems[0]
  const isMobileNavOpen = mobileNavState.pathname === pathname && mobileNavState.isOpen

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_30%,#f8fafc_100%)] text-slate-700">
      <div className="fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.18),transparent_42%),radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.12),transparent_24%)]" />

      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
              甄选好物馆
            </Link>
            <p className="mt-1 text-xs text-slate-500">先看商品亮点、使用指南和兑换码入口，需要帮助时也能快速找到人。</p>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 rounded-[1.25rem] border border-slate-200/80 bg-white/90 p-1.5 shadow-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
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

          <div className="md:hidden">
            <button
              type="button"
              aria-controls="mobile-site-tabs"
              aria-expanded={isMobileNavOpen}
              className="flex w-full items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-2 shadow-sm"
              onClick={() =>
                setMobileNavState((currentValue) => ({
                  pathname,
                  isOpen: currentValue.pathname === pathname ? !currentValue.isOpen : true,
                }))
              }
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex shrink-0 rounded-[1.1rem] bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  {activeNavItem.label}
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">页面切换</p>
                  <p className="text-sm text-slate-500">{isMobileNavOpen ? '收起 Tab 抽屉' : '展开 Tab 抽屉'}</p>
                </div>
              </div>

              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition',
                  isMobileNavOpen ? 'rotate-180 text-slate-900' : '',
                )}
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isMobileNavOpen ? (
              <div id="mobile-site-tabs" className="mt-3">
                <nav className="rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-2 shadow-sm">
                  <div className="grid gap-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => setMobileNavState({ pathname, isOpen: false })}
                        className={({ isActive }) =>
                          cn(
                            'rounded-xl px-4 py-3 text-sm font-medium transition',
                            isActive
                              ? 'bg-brand-600 text-white shadow'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </nav>
              </div>
            ) : null}
          </div>
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
              把商品亮点、使用指南、兑换码入口和咨询售后入口分开展示，让你在选购前后都能更快找到所需内容。
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
