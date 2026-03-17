import { useEffect, useState } from 'react'

import { getHomepageData } from '../services/publicApi'
import type { HomepageDataSource } from '../services/publicApi'
import type { ContactItem, Product, TutorialItem } from '../types/content'

export function useSiteContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [dataSource, setDataSource] = useState<HomepageDataSource>('postgres')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await getHomepageData()

        if (!active) {
          return
        }

        setProducts(data.products)
        setTutorials(data.tutorials)
        setContacts(data.contacts)
        setDataSource(data.source)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : '站点内容加载失败')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return {
    products,
    tutorials,
    contacts,
    dataSource,
    loading,
    error,
  }
}
