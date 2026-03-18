import type { Dispatch, SetStateAction } from 'react'

import type { ContactItem, Product, RedeemBatch, TutorialItem } from '../types/content'

export type AdminContentSummary = {
  total: number
  published: number
}

export type AdminRedeemSummary = {
  batches: number
  totalCodes: number
  pendingCodes: number
  redeemedCodes: number
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
  redeemBatches: RedeemBatch[]
  summary: AdminSummary
  refresh: () => Promise<void>
  setProducts: Dispatch<SetStateAction<Product[]>>
  setTutorials: Dispatch<SetStateAction<TutorialItem[]>>
  setContacts: Dispatch<SetStateAction<ContactItem[]>>
  setRedeemBatches: Dispatch<SetStateAction<RedeemBatch[]>>
}
