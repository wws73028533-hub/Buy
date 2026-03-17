import { useEffect, useMemo, useState } from 'react'

import { ContactManager } from '../components/admin/ContactManager'
import { ProductManager } from '../components/admin/ProductManager'
import { TutorialManager } from '../components/admin/TutorialManager'
import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { SectionCard } from '../components/SectionCard'
import { useAuth } from '../contexts/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { getAdminData } from '../services/adminApi'
import type { ContactItem, Product, TutorialItem } from '../types/content'

type AdminTab = 'products' | 'tutorials' | 'contacts'

const tabs: Array<{ key: AdminTab; label: string; hint: string }> = [
  { key: 'products', label: '商品', hint: '封面、标题、详情富文本' },
  { key: 'tutorials', label: '教程', hint: '外部链接或站内文件' },
  { key: 'contacts', label: '售后联系方式', hint: '文字、链接、二维码' },
]

export function AdminDashboardPage() {
  usePageMeta({
    title: '后台管理',
    description: '管理商品、教程文档与售后联系方式。',
  })

  const { session, signOut, usingDefaultAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await getAdminData()

        if (!active) {
          return
        }

        setProducts(data.products)
        setTutorials(data.tutorials)
        setContacts(data.contacts)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '后台数据加载失败')
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
  }, [])

  const currentPanel = useMemo(() => {
    switch (activeTab) {
      case 'products':
        return <ProductManager items={products} onChange={setProducts} />
      case 'tutorials':
        return <TutorialManager items={tutorials} onChange={setTutorials} />
      case 'contacts':
        return <ContactManager items={contacts} onChange={setContacts} />
      default:
        return null
    }
  }, [activeTab, contacts, products, tutorials])

  const stats = useMemo(
    () => [
      {
        label: '商品',
        value: products.length,
        hint: `已发布 ${products.filter((item) => item.isPublished).length}`,
      },
      {
        label: '教程',
        value: tutorials.length,
        hint: `已发布 ${tutorials.filter((item) => item.isPublished).length}`,
      },
      {
        label: '联系方式',
        value: contacts.length,
        hint: `已发布 ${contacts.filter((item) => item.isPublished).length}`,
      },
    ],
    [contacts, products, tutorials],
  )

  if (loading) {
    return <LoadingView message="正在加载后台内容..." />
  }

  if (error) {
    return <EmptyState title="后台数据加载失败" description={error} />
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-soft sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">当前登录</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            商品展示站后台
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {session?.user.email ?? '管理员'}，可在这里维护前台首页和详情页内容。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
        >
          退出登录
        </button>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800">
        当前后台已连接 <strong>PostgreSQL 云端/服务器数据库</strong>，你在这里保存的内容会被所有公网访客看到。
      </section>

      {usingDefaultAdmin ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          你仍在使用默认开发管理员账号，正式部署前请务必修改 <code>ADMIN_EMAIL</code> 和 <code>ADMIN_PASSWORD</code>。
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
          </article>
        ))}
      </div>

      <SectionCard
        title="内容管理"
        description="维护商品、教程和售后联系方式。勾选“发布”后，前台首页会自动读取。"
      >
        <div className="mb-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          建议先完成 3 步：① 创建商品并发布；② 补充教程文档；③ 配置至少一条售后联系方式。这样前台体验会更完整。
        </div>
        <div className="mb-6 grid gap-3 lg:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-3xl border p-5 text-left transition ${
                activeTab === tab.key
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <p className="text-base font-semibold text-slate-900">{tab.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{tab.hint}</p>
            </button>
          ))}
        </div>
        {currentPanel}
      </SectionCard>
    </div>
  )
}
