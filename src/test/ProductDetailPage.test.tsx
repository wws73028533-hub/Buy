import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDetailPage } from '../pages/ProductDetailPage'
import type { Product, PurchaseLink } from '../types/content'

const getPublishedProductBySlugMock = vi.fn<
  (slug: string) => Promise<{ product: Product | null; globalPurchaseLinks: PurchaseLink[] }>
>()

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

function createDetailResponse(productOverrides?: Partial<Product>, globalPurchaseLinks: PurchaseLink[] = []) {
  return {
    product: createProduct(productOverrides),
    globalPurchaseLinks,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  getPublishedProductBySlugMock.mockReset()
})

describe('ProductDetailPage', () => {
  it('会同时展示商品专属入口和全局购买入口', async () => {
    getPublishedProductBySlugMock.mockResolvedValue(
      createDetailResponse(
        {
          purchaseLinkUrl: 'https://shop-a.example.com/item-a',
          purchaseLinks: [{ label: '商品专属入口', url: 'https://shop-a.example.com/item-a' }],
        },
        [
          { label: '店铺 A', url: 'https://global-shop-a.example.com' },
          { label: '店铺 B', url: 'https://global-shop-b.example.com' },
        ],
      ),
    )

    renderPage()

    const productLinks = await screen.findAllByRole('link', { name: '直达：商品专属入口' })
    const globalShopALinks = screen.getAllByRole('link', { name: '直达：店铺 A' })
    const globalShopBLinks = screen.getAllByRole('link', { name: '直达：店铺 B' })

    expect(productLinks).toHaveLength(2)
    expect(globalShopALinks).toHaveLength(2)
    expect(globalShopBLinks).toHaveLength(2)
    expect(productLinks[0]).toHaveAttribute('href', 'https://shop-a.example.com/item-a')
    expect(globalShopALinks[0]).toHaveAttribute('href', 'https://global-shop-a.example.com')
    expect(globalShopBLinks[0]).toHaveAttribute('href', 'https://global-shop-b.example.com')
    expect(screen.getByText('如果当前入口失效，可以继续尝试其它购买入口。')).toBeInTheDocument()
  })

  it('旧商品只有单个链接时仍会自动展示默认入口', async () => {
    getPublishedProductBySlugMock.mockResolvedValue(
      createDetailResponse({
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
