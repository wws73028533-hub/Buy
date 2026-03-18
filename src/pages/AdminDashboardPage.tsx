import { useEffect, useMemo, useState } from 'react'

import { ContactManager } from '../components/admin/ContactManager'
import { ProductManager } from '../components/admin/ProductManager'
import { RedeemManager } from '../components/admin/RedeemManager'
import { TutorialManager } from '../components/admin/TutorialManager'
import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { SectionCard } from '../components/SectionCard'
import { useAuth } from '../contexts/useAuth'
import { usePageMeta } from '../hooks/usePageMeta'
import { getAdminData, getRedeemData } from '../services/adminApi'
import type { ContactItem, Product, RedeemItem, TutorialItem } from '../types/content'

type AdminTab = 'products' | 'tutorials' | 'redeem' | 'contacts'

const tabs: Array<{ key: AdminTab; label: string; hint: string }> = [
  { key: 'products', label: '商品展示', hint: '封面、标题、卖点说明' },
  { key: 'tutorials', label: '使用指南', hint: '图文链接或资料入口' },
  { key: 'redeem', label: '兑换码', hint: '一对一内容、商品关联、核销状态' },
  { key: 'contacts', label: '咨询售后', hint: '文字、链接、二维码' },
]

export function AdminDashboardPage() {
  usePageMeta({
    title: '商家工作台',
    description: '维护前台展示的商品、使用指南、兑换码与咨询售后内容。',
  })

  const { session, signOut, usingDefaultAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [contentData, redeemData] = await Promise.all([getAdminData(), getRedeemData()])

        if (!active) {
          return
        }

        setProducts(contentData.products)
        setTutorials(contentData.tutorials)
        setContacts(contentData.contacts)
        setRedeemItems(redeemData.items)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '商家工作台加载失败')
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
      case 'redeem':
        return <RedeemManager items={redeemItems} products={products} onChange={setRedeemItems} />
      case 'contacts':
        return <ContactManager items={contacts} onChange={setContacts} />
      default:
        return null
    }
  }, [activeTab, contacts, products, redeemItems, tutorials])

  const stats = useMemo(
    () => [
      {
        label: '商品',
        value: products.length,
        hint: `对外展示 ${products.filter((item) => item.isPublished).length}`,
      },
      {
        label: '指南',
        value: tutorials.length,
        hint: `对外展示 ${tutorials.filter((item) => item.isPublished).length}`,
      },
      {
        label: '兑换码',
        value: redeemItems.length,
        hint: `待兑换 ${redeemItems.filter((item) => !item.redeemedAt).length}`,
      },
      {
        label: '服务入口',
        value: contacts.length,
        hint: `对外展示 ${contacts.filter((item) => item.isPublished).length}`,
      },
    ],
    [contacts, products, redeemItems, tutorials],
  )

  if (loading) {
    return <LoadingView message="正在加载商家工作台..." />
  }

  if (error) {
    return <EmptyState title="商家工作台加载失败" description={error} />
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-soft sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">当前登录</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            商家工作台
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {session?.user.email ?? '商家账号'}，可在这里维护消费者看到的商品、指南、兑换码与服务内容。
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
        当前内容已连接 <strong>PostgreSQL 数据库</strong>，你在这里保存的商品、指南、兑换码和服务入口会直接用于前台展示或兑换核销。
      </section>

      {usingDefaultAdmin ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          你仍在使用默认开发管理员账号，正式部署前请务必修改 <code>ADMIN_EMAIL</code> 和 <code>ADMIN_PASSWORD</code>。
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
          </article>
        ))}
      </div>

      <SectionCard
        title="前台内容管理"
        description="维护消费者看到的商品、使用指南、兑换码和咨询售后入口。保存后，前台页面或兑换流程会自动更新。"
      >
        <div className="mb-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          建议先完成 4 步：① 放 1 款主推商品；② 补充新手上手指南；③ 先按商品生成兑换码，再逐条补充专属内容；④ 再补充至少 1 个咨询或售后入口。
        </div>
        <div className="mb-6 grid gap-3 lg:grid-cols-4">
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
