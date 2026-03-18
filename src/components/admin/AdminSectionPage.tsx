import type { PropsWithChildren, ReactNode } from 'react'

import { EmptyState } from '../EmptyState'
import { LoadingView } from '../LoadingView'
import { AdminPageHeader } from './AdminPageHeader'

export function AdminSectionPage({
  title,
  description,
  action,
  loading,
  loadingMessage,
  error,
  errorTitle,
  onRetry,
  children,
}: PropsWithChildren<{
  title: string
  description: string
  action?: ReactNode
  loading: boolean
  loadingMessage: string
  error: string | null
  errorTitle: string
  onRetry?: () => void
}>) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} description={description} action={action} />
      {loading ? (
        <LoadingView message={loadingMessage} />
      ) : error ? (
        <EmptyState
          title={errorTitle}
          description={error}
          action={
            onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                重新加载
              </button>
            ) : null
          }
        />
      ) : (
        children
      )}
    </div>
  )
}
