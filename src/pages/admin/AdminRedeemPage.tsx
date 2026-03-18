import { Link } from 'react-router-dom'

import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { RedeemManager } from '../../components/admin/RedeemManager'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

export function AdminRedeemPage() {
  usePageMeta({
    title: '兑换码管理',
    description: '维护兑换模板、批量生成兑换码与核销状态。',
  })

  const { error, loading, redeemBatches, refresh, setRedeemBatches } = useAdminData()

  return (
    <AdminSectionPage
      title="兑换码"
      description="统一维护兑换模板和随机兑换码。保存模板后即可批量生成新码，核销状态也会在这里实时展示。"
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
      <RedeemManager items={redeemBatches} onChange={setRedeemBatches} />
    </AdminSectionPage>
  )
}
