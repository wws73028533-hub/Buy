import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { getAdminData, getRedeemData } from '../services/adminApi'
import type { ContactItem, Product, RedeemBatch, TutorialItem } from '../types/content'
import { AdminDataContext } from './AdminDataContextObject'
import type { AdminDataContextValue, AdminSummary } from './adminData'


function countPublished<T extends { isPublished: boolean }>(items: T[]) {
  return items.filter((item) => item.isPublished).length
}

function createSummary(products: Product[], tutorials: TutorialItem[], contacts: ContactItem[], redeemBatches: RedeemBatch[]): AdminSummary {
  const redeemCodes = redeemBatches.flatMap((item) => item.codes)
  const redeemedCodes = redeemCodes.filter((item) => item.redeemedAt).length

  return {
    products: {
      total: products.length,
      published: countPublished(products),
    },
    tutorials: {
      total: tutorials.length,
      published: countPublished(tutorials),
    },
    contacts: {
      total: contacts.length,
      published: countPublished(contacts),
    },
    redeem: {
      batches: redeemBatches.length,
      totalCodes: redeemCodes.length,
      pendingCodes: redeemCodes.length - redeemedCodes,
      redeemedCodes,
    },
  }
}

export function AdminDataProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<Product[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [redeemBatches, setRedeemBatches] = useState<RedeemBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [contentData, redeemData] = await Promise.all([getAdminData(), getRedeemData()])

      setProducts(contentData.products)
      setTutorials(contentData.tutorials)
      setContacts(contentData.contacts)
      setRedeemBatches(redeemData.batches)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '后台数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const summary = useMemo(
    () => createSummary(products, tutorials, contacts, redeemBatches),
    [contacts, products, redeemBatches, tutorials],
  )

  const value = useMemo<AdminDataContextValue>(
    () => ({
      loading,
      error,
      products,
      tutorials,
      contacts,
      redeemBatches,
      summary,
      refresh,
      setProducts,
      setTutorials,
      setContacts,
      setRedeemBatches,
    }),
    [contacts, error, loading, products, redeemBatches, refresh, summary, tutorials],
  )

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

