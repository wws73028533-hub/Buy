import { Link } from 'react-router-dom'

import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { adminNavigationItems } from '../../components/admin/adminNavigation'
import { useAuth } from '../../contexts/useAuth'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

const actionCardStyles =
  'rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]'

export function AdminOverviewPage() {
  usePageMeta({
    title: '后台概览',
    description: '查看后台内容概览、快捷入口与当前数据状态。',
  })

  const { loading, error, summary, refresh } = useAdminData()
  const { session, usingDefaultAdmin } = useAuth()

  const statCards = [
    {
      label: '商品',
      value: summary.products.total,
      hint: `已发布 ${summary.products.published} 个`,
    },
    {
      label: '使用指南',
      value: summary.tutorials.total,
      hint: `已发布 ${summary.tutorials.published} 个`,
    },
    {
      label: '兑换模板',
      value: summary.redeem.batches,
      hint: `待兑换码 ${summary.redeem.pendingCodes} 个`,
    },
    {
      label: '服务入口',
      value: summary.contacts.total,
      hint: `已发布 ${summary.contacts.published} 个`,
    },
  ]

  return (
    <AdminSectionPage
      title="后台概览"
      description="使用标准后台视图统一管理商品、教程、兑换码与咨询售后内容，右侧模块页会直接连接现有 API 与数据库数据。"
      action={
        <Link
          to="/admin/products"
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          进入商品管理
        </Link>
      }
      loading={loading}
      loadingMessage="正在加载后台概览..."
      error={error}
      errorTitle="后台概览加载失败"
      onRetry={() => void refresh()}
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">快捷入口</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">从左侧导航进入各业务模块，也可以从这里直接跳转到最常用的管理页面。</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {adminNavigationItems
                .filter((item) => item.key !== 'overview')
                .map((item) => {
                  const detail =
                    item.key === 'products'
                      ? `共 ${summary.products.total} 个商品，已发布 ${summary.products.published} 个`
                      : item.key === 'tutorials'
                        ? `共 ${summary.tutorials.total} 个使用指南，已发布 ${summary.tutorials.published} 个`
                        : item.key === 'redeem'
                          ? `共 ${summary.redeem.batches} 组模板，待兑换码 ${summary.redeem.pendingCodes} 个`
                          : `共 ${summary.contacts.total} 个服务入口，已发布 ${summary.contacts.published} 个`

                  return (
                    <Link key={item.key} to={item.to} className={actionCardStyles}>
                      <p className="text-base font-semibold text-slate-950">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                      <p className="mt-4 text-sm font-medium text-brand-700">{detail}</p>
                    </Link>
                  )
                })}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-emerald-950">数据状态</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-800">
                当前后台内容已连接 <strong>PostgreSQL 数据库</strong>，你在这里保存的商品、教程、兑换模板与服务入口会直接同步到前台展示与兑换流程。
              </p>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">当前会话</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">当前登录账号：{session?.user.email ?? '管理员账号'}。</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">建议优先检查商品、指南、兑换模板和咨询售后 4 个模块是否都已配置完毕。</p>
            </section>

            {usingDefaultAdmin ? (
              <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-amber-950">默认管理员提醒</h2>
                <p className="mt-3 text-sm leading-6 text-amber-800">
                  当前仍在使用默认开发管理员账号。正式部署前，请务必修改 <code>ADMIN_EMAIL</code> 与 <code>ADMIN_PASSWORD</code>。
                </p>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </AdminSectionPage>
  )
}
