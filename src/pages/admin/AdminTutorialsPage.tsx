import { Link } from 'react-router-dom'

import { AdminSectionPage } from '../../components/admin/AdminSectionPage'
import { TutorialManager } from '../../components/admin/TutorialManager'
import { useAdminData } from '../../contexts/useAdminData'
import { usePageMeta } from '../../hooks/usePageMeta'

export function AdminTutorialsPage() {
  usePageMeta({
    title: '使用指南管理',
    description: '维护在线指南、资料下载与教程入口。',
  })

  const { loading, error, refresh, setTutorials, tutorials } = useAdminData()

  return (
    <AdminSectionPage
      title="使用指南"
      description="统一管理在线教程和资料下载入口，确保前台用户能快速找到上手方式与资料包。"
      action={
        <Link
          to="/tutorials"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          查看指南页
        </Link>
      }
      loading={loading}
      loadingMessage="正在加载使用指南数据..."
      error={error}
      errorTitle="使用指南加载失败"
      onRetry={() => void refresh()}
    >
      <TutorialManager items={tutorials} onChange={setTutorials} />
    </AdminSectionPage>
  )
}
