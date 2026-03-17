import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { PublicPageHeader } from '../components/PublicPageHeader'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

export function TutorialsPage() {
  usePageMeta({
    title: '使用指南',
    description: '集中展示使用说明、资料下载和学习入口的页面。',
  })

  const { tutorials, loading, error } = useSiteContent()

  return (
    <div className="space-y-6 lg:space-y-8">
      <PublicPageHeader
        badge="使用指南"
        title="需要怎么用、从哪里开始，这里直接告诉你。"
        description="把说明、资料和下载入口前置，避免页面先讲很多引导，真正有用的内容会更早出现。"
        aside={
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            当前可查看 <span className="font-semibold text-slate-900">{tutorials.length}</span> 项
          </div>
        }
        actions={
          <>
            <Link
              to="/products"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              回到商品页
            </Link>
            <Link
              to="/support"
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              咨询售后支持
            </Link>
          </>
        }
      />

      {loading ? <LoadingView message="正在加载使用指南..." /> : null}
      {error ? <EmptyState title="使用指南加载失败" description={error} /> : null}

      {!loading && !error ? (
        <SectionCard title="全部指南与资料" description="点击即可打开图文说明、视频链接或下载文件。">
          {tutorials.length > 0 ? (
            <div className="space-y-4">
              {tutorials.map((tutorial, index) => {
                const href = tutorial.type === 'link' ? tutorial.url : tutorial.fileUrl

                return (
                  <a
                    key={tutorial.id}
                    href={href ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                        {tutorial.type === 'link' ? '↗' : '⇩'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{tutorial.title}</h3>
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                            {tutorial.type === 'link' ? '在线查看' : '资料下载'}
                          </span>
                          <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                            第 {index + 1} 项
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {tutorial.type === 'link'
                            ? '适合查看图文步骤、视频讲解、外部知识库等更详细的使用说明。'
                            : '适合下载 PDF、模板、补充资料或需要保存到本地的文件。'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-1">
                      {tutorial.type === 'link' ? '打开查看 →' : '立即下载 →'}
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="指南与资料正在整理中"
              description="当前还没有公开展示的使用指南，欢迎稍后再来查看。"
            />
          )}
        </SectionCard>
      ) : null}
    </div>
  )
}
