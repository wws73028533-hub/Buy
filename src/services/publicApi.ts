import { apiGet } from '../lib/api'
import type { ContactItem, Product, TutorialItem } from '../types/content'

export type HomepageDataSource = 'postgres'

type HomepageResponse = {
  products: Product[]
  tutorials: TutorialItem[]
  contacts: ContactItem[]
  source: HomepageDataSource
}

export async function getHomepageData() {
  return apiGet<HomepageResponse>('/api/public/homepage')
}

export async function getPublishedProductBySlug(slug: string) {
  const data = await apiGet<{ product: Product | null }>(`/api/public/products/${slug}`)
  return data.product
}
