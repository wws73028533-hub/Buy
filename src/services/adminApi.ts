import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api'
import type {
  ContactInput,
  ContactItem,
  Product,
  ProductInput,
  RedeemBatch,
  RedeemBatchInput,
  RedeemCode,
  TutorialInput,
  TutorialItem,
} from '../types/content'

type AdminContentResponse = {
  products: Product[]
  tutorials: TutorialItem[]
  contacts: ContactItem[]
}

type AdminRedeemResponse = {
  batches: RedeemBatch[]
}

const uploadKindMap = {
  'product-images': 'product-image',
  'tutorial-files': 'tutorial-file',
  'contact-qrcodes': 'contact-qrcode',
} as const

export async function getAdminData() {
  return apiGet<AdminContentResponse>('/api/admin/content')
}

export async function getRedeemData() {
  return apiGet<AdminRedeemResponse>('/api/admin/redeem')
}

export async function saveProduct(input: ProductInput) {
  const data = input.id
    ? await apiPut<{ product: Product }>(`/api/admin/products/${input.id}`, input)
    : await apiPost<{ product: Product }>('/api/admin/products', input)

  return data.product
}

export async function deleteProduct(id: string) {
  await apiDelete<{ ok: true }>(`/api/admin/products/${id}`)
}

export async function saveTutorial(input: TutorialInput) {
  const data = input.id
    ? await apiPut<{ tutorial: TutorialItem }>(`/api/admin/tutorials/${input.id}`, input)
    : await apiPost<{ tutorial: TutorialItem }>('/api/admin/tutorials', input)

  return data.tutorial
}

export async function deleteTutorial(id: string) {
  await apiDelete<{ ok: true }>(`/api/admin/tutorials/${id}`)
}

export async function saveContact(input: ContactInput) {
  const data = input.id
    ? await apiPut<{ contact: ContactItem }>(`/api/admin/contacts/${input.id}`, input)
    : await apiPost<{ contact: ContactItem }>('/api/admin/contacts', input)

  return data.contact
}

export async function deleteContact(id: string) {
  await apiDelete<{ ok: true }>(`/api/admin/contacts/${id}`)
}

export async function saveRedeemBatch(input: RedeemBatchInput) {
  const data = input.id
    ? await apiPut<{ batch: RedeemBatch }>(`/api/admin/redeem-batches/${input.id}`, input)
    : await apiPost<{ batch: RedeemBatch }>('/api/admin/redeem-batches', input)

  return data.batch
}

export async function generateRedeemCodes(batchId: string, count: number) {
  const data = await apiPost<{ codes: RedeemCode[] }>(`/api/admin/redeem-batches/${batchId}/codes`, {
    count,
  })

  return data.codes
}

export async function deleteRedeemCode(id: string) {
  await apiDelete<{ ok: true }>(`/api/admin/redeem-codes/${id}`)
}

export async function uploadPublicFile(bucket: keyof typeof uploadKindMap, folder: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const search = new URLSearchParams({
    kind: uploadKindMap[bucket],
    folder,
  })

  const data = await apiPost<{ url: string }>(`/api/admin/uploads?${search.toString()}`, formData)
  return data.url
}
