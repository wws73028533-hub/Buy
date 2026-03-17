import { Link } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { LoadingView } from '../components/LoadingView'
import { SectionCard } from '../components/SectionCard'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteContent } from '../hooks/useSiteContent'

const learningFlow = [
  {
    title: '先看快速了解',
    description: '先用最短时间弄清楚这类商品怎么用、适合什么场景，以及从哪里开始。',
  },
  {
    title: '再看详细资料',
    description: '需要更深入时，再继续查看图文说明、视频链接或下载文件。',
  },
  {
    title: '仍有疑问再咨询',
    description: '看完指南还不确定时，再去咨询售后页面联系，会更高效。',
  },
]

export function TutorialsPage() {
  usePageMeta({
    title: '使用指南',
    description: '集中展示使用说明、资料下载和学习入口的页面。',
  })

  const { tutorials, loading, error } = useSiteContent()

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="rounded-[2.25rem] border border-slate-200 bg-white/90 px-6 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-8 sm:py-12">
        <span className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          使用指南
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          购买前先了解，使用起来会更轻松。
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-500 sm:text-lg">
          无论你是在比较商品，还是已经入手，这里都可以帮你快速找到使用步骤、资料下载和更详细的说明入口。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/products"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            回到商品页
          </Link>
          <Link
            to="/support"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            咨询售后支持
          </Link>
        </div>
      </section>

      {loading ? <LoadingView message="正在加载使用指南..." /> : null}
      {error ? <EmptyState title="使用指南加载失败" description={error} /> : null}

      {!loading && !error ? (
        <>
          <SectionCard title="推荐查看顺序" description="先解决“怎么开始”，再进入更具体的图文、视频或资料。">
            <div className="grid gap-4 md:grid-cols-3">
              {learningFlow.map((item, index) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">0{index + 1}</div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionCard>

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
                      className="group flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                          {tutorial.type === 'link' ? '↗' : '⇩'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{tutorial.title}</h3>
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                              {tutorial.type === 'link' ? '在线查看' : '资料下载'}
                            </span>
                            <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
                              第 {index + 1} 项
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-500">
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
        </>
      ) : null}
    </div>
  )
}
