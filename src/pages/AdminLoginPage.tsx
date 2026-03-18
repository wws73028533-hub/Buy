import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'

export function AdminLoginPage() {
  usePageMeta({
    title: '后台登录',
    description: '登录独立后台管理中心，维护商品、使用指南、兑换码和咨询售后内容。',
  })

  const { loading, session, signIn, usingDefaultAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) {
    return <Navigate to="/admin/overview" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn({ email, password })
      navigate('/admin/overview', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#111827_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-stretch">
        <section className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-200">Admin Console</p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">独立后台管理中心</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              用标准后台结构集中管理商品、教程、兑换码和咨询售后内容。左侧导航切换模块，右侧内容区专注编辑与查看状态。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: '标准后台布局', description: '侧边栏导航与主内容区分离，支持桌面端与移动端。' },
              { title: '共享数据状态', description: '后台模块共用一套数据加载与概览统计，避免重复请求。' },
              { title: '独立后台路由', description: '支持 /admin/overview、/admin/products 等独立地址。' },
              { title: '直连现有接口', description: '继续复用当前认证、内容接口与数据库语义。' },
            ].map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-black/10 p-5">
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex rounded-[2rem] border border-white/10 bg-white p-6 text-slate-700 shadow-[0_24px_80px_rgba(15,23,42,0.35)] sm:p-8">
          <div className="flex w-full flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">后台登录</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">进入管理中心</h2>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                >
                  返回前台
                </Link>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                登录后即可进入新的后台模块布局，统一维护前台展示内容与兑换流程相关数据。
              </p>

              {usingDefaultAdmin ? (
                <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                  当前仍在使用默认开发账号：<strong>admin@example.com</strong> / <strong>change-me</strong>。正式上线前请务必在环境变量中修改管理员账号和密码。
                </div>
              ) : null}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">邮箱</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                    placeholder="admin@example.com"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">密码</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-400"
                    placeholder="请输入管理员密码"
                  />
                </label>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? '登录中...' : '进入后台管理中心'}
                </button>
              </form>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500">
              后台登录与前台页面已完全分离；进入后台后将显示左侧侧边栏导航与右侧主内容区域。
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
