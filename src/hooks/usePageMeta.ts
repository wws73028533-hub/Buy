import { useEffect } from 'react'

const DEFAULT_TITLE = '甄选好物馆'
const DEFAULT_DESCRIPTION = '面向消费者的商品展示站，帮助用户快速了解商品亮点、使用指南与咨询售后入口。'

export function usePageMeta({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    document.title = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null

    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }

    meta.content = description ?? DEFAULT_DESCRIPTION
  }, [description, title])
}
