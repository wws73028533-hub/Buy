import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { usePageMeta } from '../hooks/usePageMeta'

export function NotFoundPage() {
  usePageMeta({
    title: '页面走丢了',
    description: '访问的页面不存在。',
  })

  return (
    <EmptyState
      title="页面走丢了"
      description="你访问的链接可能已失效，或者内容暂时还没有对外展示。"
      action={
        <Link to="/" className="text-sm font-medium text-brand-600 underline underline-offset-4">
          返回首页
        </Link>
      }
    />
  )
}
