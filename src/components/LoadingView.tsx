export function LoadingView({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
