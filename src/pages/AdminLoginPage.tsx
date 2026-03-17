import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'

export function AdminLoginPage() {
  usePageMeta({
    title: '商家登录',
    description: '登录商家工作台，维护前台展示的商品、使用指南和咨询售后内容。',
  })

  const { loading, session, signIn, usingDefaultAdmin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn({ email, password })
      navigate('/admin', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">商家后台登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          登录后即可维护前台展示的商品、使用指南与咨询售后内容。
        </p>
      </div>

      {usingDefaultAdmin ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          当前仍在使用默认开发账号：<strong>admin@example.com</strong> / <strong>change-me</strong>。
          正式上线前请务必在服务器环境变量中修改管理员账号和密码。
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
          className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          {submitting ? '登录中...' : '进入商家工作台'}
        </button>
      </form>
    </div>
  )
}
