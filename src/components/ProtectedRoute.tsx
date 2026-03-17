import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../contexts/useAuth'
import { LoadingView } from './LoadingView'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { loading, session } = useAuth()

  if (loading) {
    return <LoadingView message="正在校验管理员登录状态..." />
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
