import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/useAuth'
import { cn } from '../../lib/utils'
import { adminNavigationItems, getAdminNavigationItem } from './adminNavigation'

function SidebarContent({
  email,
  onNavigate,
  onSignOut,
}: {
  email: string | undefined
  onNavigate: () => void
  onSignOut: () => Promise<void>
}) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-5 py-6">
        <Link to="/admin/overview" onClick={onNavigate} className="inline-flex flex-col gap-1">
          <span className="text-lg font-semibold tracking-tight text-white">甄选好物馆</span>
          <span className="text-sm text-slate-400">后台管理中心</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {adminNavigationItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'block rounded-2xl border px-4 py-3 transition',
                isActive
                  ? 'border-brand-500 bg-brand-500/15 text-white shadow-[0_16px_40px_rgba(37,99,235,0.2)]'
                  : 'border-transparent bg-white/5 text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">当前登录</p>
          <p className="mt-3 break-all text-sm font-medium text-white">{email ?? '管理员账号'}</p>
          <div className="mt-4 grid gap-2">
            <Link
              to="/"
              onClick={onNavigate}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              返回前台
            </Link>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminShell() {
  const { session, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentItem = getAdminNavigationItem(location.pathname)


  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '退出登录失败，请稍后再试')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-white/10">
        <SidebarContent email={session?.user.email} onNavigate={() => setIsMobileMenuOpen(false)} onSignOut={handleSignOut} />
      </aside>

      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="关闭后台导航遮罩"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 transition-transform duration-200 lg:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-end bg-slate-950 px-4">
          <button
            type="button"
            aria-label="关闭后台导航"
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-xl text-white transition hover:bg-white/10"
          >
            ×
          </button>
        </div>
        <div className="h-[calc(100%-4rem)]">
          <SidebarContent email={session?.user.email} onNavigate={() => setIsMobileMenuOpen(false)} onSignOut={handleSignOut} />
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="打开后台导航"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
              >
                ☰
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">独立后台</p>
                <p className="truncate text-lg font-semibold text-slate-950">{currentItem.label}</p>
              </div>
            </div>

            <Link
              to={currentItem.publicTo}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              {currentItem.publicLabel}
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-73px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
