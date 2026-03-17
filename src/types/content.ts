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

export type TutorialType = 'link' | 'file'

export interface TutorialItem {
  id: string
  title: string
  type: TutorialType
  url: string | null
  fileUrl: string | null
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
