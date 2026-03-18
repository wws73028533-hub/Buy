import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RedeemManager } from '../components/admin/RedeemManager'
import type { Product, RedeemItem } from '../types/content'

const createRedeemItemsMock = vi.fn()
const saveRedeemItemMock = vi.fn()
const deleteRedeemItemMock = vi.fn()

vi.mock('../services/adminApi', () => ({
  createRedeemItems: (...args: unknown[]) => createRedeemItemsMock(...args),
  saveRedeemItem: (...args: unknown[]) => saveRedeemItemMock(...args),
  deleteRedeemItem: (...args: unknown[]) => deleteRedeemItemMock(...args),
}))

vi.mock('../components/rich-text/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: unknown }) => <div data-testid="rich-text-editor">{JSON.stringify(value)}</div>,
}))

vi.mock('../components/rich-text/RichTextViewer', () => ({
  RichTextViewer: ({ content }: { content: unknown }) => <div data-testid="rich-text-viewer">{JSON.stringify(content)}</div>,
}))

const products: Product[] = [
  {
    id: 'p1',
    slug: 'product-1',
    title: '商品 1',
    coverImageUrl: null,
    purchaseLinkUrl: null,
    purchaseCode: null,
    contentJson: {},
    sortOrder: 0,
    isPublished: true,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
  },
  {
    id: 'p2',
    slug: 'product-2',
    title: '商品 2',
    coverImageUrl: null,
    purchaseLinkUrl: null,
    purchaseCode: null,
    contentJson: {},
    sortOrder: 1,
    isPublished: true,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
  },
]

function Harness({ initialItems = [] }: { initialItems?: RedeemItem[] }) {
  const [items, setItems] = useState(initialItems)

  return <RedeemManager items={items} products={products} onChange={setItems} />
}

beforeEach(() => {
  createRedeemItemsMock.mockReset()
  saveRedeemItemMock.mockReset()
  deleteRedeemItemMock.mockReset()
  vi.spyOn(window, 'alert').mockImplementation(() => undefined)
  vi.spyOn(window, 'confirm').mockImplementation(() => true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RedeemManager', () => {
  it('支持按商品批量生成兑换码并展示扁平列表', async () => {
    createRedeemItemsMock.mockResolvedValue([
      {
        id: 'r1',
        productId: 'p1',
        productTitle: '商品 1',
        code: 'AAAA-BBBB-CCCC',
        contentJson: {},
        redeemedAt: null,
        createdAt: '2026-03-18T01:00:00.000Z',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ])

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: '批量生成兑换码' }))

    await waitFor(() => {
      expect(createRedeemItemsMock).toHaveBeenCalledWith({ productId: 'p1', count: 10 })
    })

    expect((await screen.findAllByText('AAAA-BBBB-CCCC')).length).toBeGreaterThan(0)
    expect(screen.getByText('商品：商品 1')).toBeInTheDocument()
  })

  it('未兑换码保存时会调用单条保存接口', async () => {
    const initialItems: RedeemItem[] = [
      {
        id: 'r1',
        productId: 'p1',
        productTitle: '商品 1',
        code: 'AAAA-BBBB-CCCC',
        contentJson: { type: 'doc', content: [] },
        redeemedAt: null,
        createdAt: '2026-03-18T01:00:00.000Z',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]

    saveRedeemItemMock.mockResolvedValue({
      ...initialItems[0],
      productId: 'p2',
      productTitle: '商品 2',
      updatedAt: '2026-03-18T02:00:00.000Z',
    })

    render(<Harness initialItems={initialItems} />)

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'p2' } })
    fireEvent.click(screen.getByRole('button', { name: '保存兑换内容' }))

    await waitFor(() => {
      expect(saveRedeemItemMock).toHaveBeenCalledWith({
        id: 'r1',
        productId: 'p2',
        contentJson: { type: 'doc', content: [] },
      })
    })

    expect(await screen.findByText('商品：商品 2')).toBeInTheDocument()
  })
})
