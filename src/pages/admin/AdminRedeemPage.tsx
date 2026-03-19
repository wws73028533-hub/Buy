import { Link } from 'react-router-dom'

import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { RedeemManager } from '../../components/admin/RedeemManager'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

export function AdminRedeemPage() {
  usePageMeta({
    title: '兑换码管理',
    description: '维护一对一兑换码、商品关联与核销状态。',
  })

  const { error, loading, products, redeemItems, refresh, setRedeemItems } = useAdminData()

  return (
    <AdminSectionPage
      title="兑换码"
      description="统一维护一对一兑换码。支持按模板批量生成，并直接填写账号、密码、2FA 与补充说明。"
      action={
        <Link
          to="/redeem"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          查看兑换页
        </Link>
      }
      loading={loading}
      loadingMessage="正在加载兑换码数据..."
      error={error}
      errorTitle="兑换码管理加载失败"
      onRetry={() => void refresh()}
    >
      <RedeemManager items={redeemItems} products={products} onChange={setRedeemItems} />
    </AdminSectionPage>
  )
}
