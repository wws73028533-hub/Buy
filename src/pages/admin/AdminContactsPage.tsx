import { Link } from 'react-router-dom'

import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { ContactManager } from '../../components/admin/ContactManager'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

export function AdminContactsPage() {
  usePageMeta({
    title: '咨询售后管理',
    description: '维护咨询入口、售后说明、跳转链接与二维码。',
  })

  const { contacts, error, loading, refresh, setContacts } = useAdminData()

  return (
    <AdminSectionPage
      title="咨询售后"
      description="统一维护售前咨询与售后支持入口，前台用户会直接看到这里配置的文字、链接与二维码。"
      action={
        <Link
          to="/support"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          查看售后页
        </Link>
      }
      loading={loading}
      loadingMessage="正在加载咨询售后数据..."
      error={error}
      errorTitle="咨询售后管理加载失败"
      onRetry={() => void refresh()}
    >
      <ContactManager items={contacts} onChange={setContacts} />
    </AdminSectionPage>
  )
}
