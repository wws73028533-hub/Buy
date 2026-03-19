import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { getAdminData, getRedeemData } from '../services/adminApi'
import type { ContactItem, Product, PurchaseLink, RedeemItem, TutorialItem } from '../types/content'
import { AdminDataContext } from './AdminDataContextObject'
import type { AdminDataContextValue, AdminSummary } from './adminData'

function countPublished<T extends { isPublished: boolean }>(items: T[]) {
  return items.filter((item) => item.isPublished).length
}

function createSummary(products: Product[], tutorials: TutorialItem[], contacts: ContactItem[], redeemItems: RedeemItem[]): AdminSummary {
  const usedCodes = redeemItems.filter((item) => item.redeemedAt).length

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
      totalCodes: redeemItems.length,
      pendingCodes: redeemItems.length - usedCodes,
      usedCodes,
    },
  }
}

export function AdminDataProvider({ children }: PropsWithChildren) {
  const [globalPurchaseLinks, setGlobalPurchaseLinks] = useState<PurchaseLink[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [tutorials, setTutorials] = useState<TutorialItem[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [redeemItems, setRedeemItems] = useState<RedeemItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [contentData, redeemData] = await Promise.all([getAdminData(), getRedeemData()])

      setGlobalPurchaseLinks(contentData.globalPurchaseLinks ?? [])
      setProducts(contentData.products)
      setTutorials(contentData.tutorials)
      setContacts(contentData.contacts)
      setRedeemItems(redeemData.items)
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
    () => createSummary(products, tutorials, contacts, redeemItems),
    [contacts, products, redeemItems, tutorials],
  )

  const value = useMemo<AdminDataContextValue>(
    () => ({
      loading,
      error,
      globalPurchaseLinks,
      products,
      tutorials,
      contacts,
      redeemItems,
      summary,
      refresh,
      setGlobalPurchaseLinks,
      setProducts,
      setTutorials,
      setContacts,
      setRedeemItems,
    }),
    [contacts, error, globalPurchaseLinks, loading, products, redeemItems, refresh, summary, tutorials],
  )

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}
