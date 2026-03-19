import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDetailPage } from '../pages/ProductDetailPage'
import type { Product } from '../types/content'

const getPublishedProductBySlugMock = vi.fn<(slug: string) => Promise<Product | null>>()

vi.mock('../services/publicApi', () => ({
  getPublishedProductBySlug: (slug: string) => getPublishedProductBySlugMock(slug),
}))

vi.mock('../components/rich-text/RichTextViewer', () => ({
  RichTextViewer: ({ content }: { content: unknown }) => <div data-testid="rich-text-viewer">{JSON.stringify(content)}</div>,
}))

function renderPage(slug = 'product-a') {
  return render(
    <MemoryRouter initialEntries={[`/products/${slug}`]}>
      <Routes>
        <Route path="/products/:slug" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'p1',
    slug: 'product-a',
    title: '商品 A',
    coverImageUrl: null,
    purchaseLinkUrl: 'https://legacy.example.com/item-a',
    purchaseLinks: [],
    purchaseCode: null,
    contentJson: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '商品亮点说明' }] }],
    },
    sortOrder: 0,
    isPublished: true,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  getPublishedProductBySlugMock.mockReset()
})

describe('ProductDetailPage', () => {
  it('会展示多个直达购买入口', async () => {
    getPublishedProductBySlugMock.mockResolvedValue(
      createProduct({
        purchaseLinkUrl: 'https://shop-a.example.com/item-a',
        purchaseLinks: [
          { label: '淘宝入口', url: 'https://shop-a.example.com/item-a' },
          { label: '京东入口', url: 'https://shop-b.example.com/item-a' },
        ],
      }),
    )

    renderPage()

    const taobaoLinks = await screen.findAllByRole('link', { name: '直达：淘宝入口' })
    const jdLinks = screen.getAllByRole('link', { name: '直达：京东入口' })

    expect(taobaoLinks).toHaveLength(2)
    expect(jdLinks).toHaveLength(2)
    expect(taobaoLinks[0]).toHaveAttribute('href', 'https://shop-a.example.com/item-a')
    expect(jdLinks[0]).toHaveAttribute('href', 'https://shop-b.example.com/item-a')
    expect(screen.getByText('如果当前入口失效，可以继续尝试其它购买入口。')).toBeInTheDocument()
  })

  it('旧商品只有单个链接时仍会自动展示默认入口', async () => {
    getPublishedProductBySlugMock.mockResolvedValue(
      createProduct({
        purchaseLinkUrl: 'https://legacy.example.com/item-a',
        purchaseLinks: [],
      }),
    )

    renderPage()

    const defaultLinks = await screen.findAllByRole('link', { name: '直达：默认入口' })

    expect(defaultLinks).toHaveLength(2)
    expect(defaultLinks[0]).toHaveAttribute('href', 'https://legacy.example.com/item-a')
  })
})
