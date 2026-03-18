import type { Dispatch, SetStateAction } from 'react'

import type { ContactItem, Product, RedeemItem, TutorialItem } from '../types/content'

export type AdminContentSummary = {
  total: number
  published: number
}

export type AdminRedeemSummary = {
  totalCodes: number
  pendingCodes: number
  usedCodes: number
}

export type AdminSummary = {
  products: AdminContentSummary
  tutorials: AdminContentSummary
  contacts: AdminContentSummary
  redeem: AdminRedeemSummary
}

export type AdminDataContextValue = {
  loading: boolean
  error: string | null
  products: Product[]
  tutorials: TutorialItem[]
  contacts: ContactItem[]
  redeemItems: RedeemItem[]
  summary: AdminSummary
  refresh: () => Promise<void>
  setProducts: Dispatch<SetStateAction<Product[]>>
  setTutorials: Dispatch<SetStateAction<TutorialItem[]>>
  setContacts: Dispatch<SetStateAction<ContactItem[]>>
  setRedeemItems: Dispatch<SetStateAction<RedeemItem[]>>
}
