export type RichTextJson = Record<string, unknown>

export interface Product {
  id: string
  slug: string
  title: string
  coverImageUrl: string | null
  purchaseLinkUrl: string | null
  purchaseCode: string | null
  contentJson: RichTextJson
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type TutorialType = 'link' | 'file' | 'article'

export interface TutorialItem {
  id: string
  title: string
  type: TutorialType
  url: string | null
  fileUrl: string | null
  contentJson: RichTextJson
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface ContactItem {
  id: string
  label: string
  value: string
  linkUrl: string | null
  qrImageUrl: string | null
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface RedeemItem {
  id: string
  productId: string
  productTitle: string
  code: string
  contentJson: RichTextJson
  redeemedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RedeemResult {
  title: string
  contentJson: RichTextJson
  redeemedAt: string
  accessMode: 'used' | 'history'
}

export interface ProductInput {
  id?: string
  slug: string
  title: string
  coverImageUrl: string | null
  purchaseLinkUrl: string | null
  purchaseCode: string | null
  contentJson: RichTextJson
  sortOrder: number
  isPublished: boolean
}

export interface TutorialInput {
  id?: string
  title: string
  type: TutorialType
  url: string | null
  fileUrl: string | null
  contentJson: RichTextJson
  sortOrder: number
  isPublished: boolean
}

export interface ContactInput {
  id?: string
  label: string
  value: string
  linkUrl: string | null
  qrImageUrl: string | null
  sortOrder: number
  isPublished: boolean
}

export interface RedeemItemInput {
  id?: string
  productId: string
  contentJson: RichTextJson
}

export interface RedeemItemBulkInput {
  productId: string
  count: number
  contentJson: RichTextJson
}
