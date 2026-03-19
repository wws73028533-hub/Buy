import { Link } from 'react-router-dom'

import { GlobalPurchaseLinksManager } from '../../components/admin/GlobalPurchaseLinksManager'
import { ProductManager } from '../../components/admin/ProductManager'
import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

export function AdminProductsPage() {
  usePageMeta({
    title: '商品管理',
    description: '维护全局购买入口、商品专属入口、详情文案与封面图片。',
  })

  const { loading, error, globalPurchaseLinks, products, refresh, setGlobalPurchaseLinks, setProducts } = useAdminData()

  return (
    <AdminSectionPage
      title="商品管理"
      description="在这里维护前台商品列表与商品详情页。保存后，首页、商品列表和详情页会直接使用最新内容。"
      action={
        <Link
          to="/products"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          查看商品页
        </Link>
      }
      loading={loading}
      loadingMessage="正在加载商品管理数据..."
      error={error}
      errorTitle="商品管理加载失败"
      onRetry={() => void refresh()}
    >
      <div className="space-y-6">
        <GlobalPurchaseLinksManager links={globalPurchaseLinks} onChange={setGlobalPurchaseLinks} />
        <ProductManager items={products} onChange={setProducts} />
      </div>
    </AdminSectionPage>
  )
}
