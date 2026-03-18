import { apiGet, apiPost } from '../lib/api'
import type { ContactItem, Product, RedeemResult, TutorialItem } from '../types/content'

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

export async function getHomepageData() {
  return apiGet<HomepageResponse>('/api/public/homepage')
}

export async function getPublishedProductBySlug(slug: string) {
  const data = await apiGet<{ product: Product | null }>(`/api/public/products/${slug}`)
  return data.product
}

export async function redeemByCode(code: string) {
  const data = await apiPost<RedeemResponse>('/api/public/redeem', { code })
  return data.redemption
}
