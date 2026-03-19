import { apiGet, apiPost } from '../lib/api'
import type { ContactItem, Product, PurchaseLink, RedeemResult, TutorialItem } from '../types/content'

export type HomepageDataSource = 'postgres'

type HomepageResponse = {
  products: Product[]
  tutorials: TutorialItem[]
  contacts: ContactItem[]
  source: HomepageDataSource
}

type RedeemResponse = {
  redemption: RedeemResult
}

export type ProductDetailResponse = {
  product: Product | null
  globalPurchaseLinks: PurchaseLink[]
}

export async function getHomepageData() {
  return apiGet<HomepageResponse>('/api/public/homepage')
}

export async function getPublishedProductBySlug(slug: string) {
  return apiGet<ProductDetailResponse>(`/api/public/products/${slug}`)
}

export async function redeemByCode(code: string) {
  const data = await apiPost<RedeemResponse>('/api/public/redeem', { code })
  return data.redemption
}
