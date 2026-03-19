import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RedeemManager } from '../components/admin/RedeemManager'
import { createRedeemContent } from '../lib/redeemContent'
import type { Product, RedeemItem } from '../types/content'

const createRedeemItemsMock = vi.fn()
const saveRedeemItemMock = vi.fn()
const deleteRedeemItemMock = vi.fn()

vi.mock('../services/adminApi', () => ({
  createRedeemItems: (...args: unknown[]) => createRedeemItemsMock(...args),
  saveRedeemItem: (...args: unknown[]) => saveRedeemItemMock(...args),
  deleteRedeemItem: (...args: unknown[]) => deleteRedeemItemMock(...args),
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
  it('支持按自定义模板批量生成兑换码', async () => {
    createRedeemItemsMock.mockResolvedValue([
      {
        id: 'r1',
        productId: 'p1',
        productTitle: '商品 1',
        code: 'AAAA-BBBB-CCCC',
        contentJson: createRedeemContent({ otherContent: '统一步骤' }),
        redeemedAt: null,
        createdAt: '2026-03-18T01:00:00.000Z',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ])

    render(<Harness />)

    fireEvent.change(screen.getByLabelText('生成模板'), { target: { value: 'custom' } })
    fireEvent.change(screen.getByLabelText('模板账号'), { target: { value: 'shared-account@example.com' } })
    fireEvent.change(screen.getByLabelText('模板密码'), { target: { value: 'Pass-123456' } })
    fireEvent.change(screen.getByLabelText('模板 2FA'), { target: { value: '2FA-KEY' } })
    fireEvent.change(screen.getByLabelText('模板其他内容'), { target: { value: '统一步骤' } })
    fireEvent.click(screen.getByRole('button', { name: '批量生成兑换码' }))

    await waitFor(() => {
      expect(createRedeemItemsMock).toHaveBeenCalledWith({
        productId: 'p1',
        count: 10,
        contentJson: createRedeemContent({
          account: 'shared-account@example.com',
          password: 'Pass-123456',
          twoFactorCode: '2FA-KEY',
          otherContent: '统一步骤',
        }),
      })
    })

    expect((await screen.findAllByText('AAAA-BBBB-CCCC')).length).toBeGreaterThan(0)
  })

  it('已兑换码也可以继续保存修改', async () => {
    const initialItems: RedeemItem[] = [
      {
        id: 'r1',
        productId: 'p1',
        productTitle: '商品 1',
        code: 'AAAA-BBBB-CCCC',
        contentJson: createRedeemContent({ account: 'old@example.com' }),
        redeemedAt: '2026-03-18T03:00:00.000Z',
        createdAt: '2026-03-18T01:00:00.000Z',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]

    saveRedeemItemMock.mockResolvedValue({
      ...initialItems[0],
      productId: 'p2',
      productTitle: '商品 2',
      contentJson: createRedeemContent({ account: 'new@example.com', otherContent: '已更新' }),
      updatedAt: '2026-03-18T02:00:00.000Z',
    })

    render(<Harness initialItems={initialItems} />)

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects.at(-1) as HTMLSelectElement, { target: { value: 'p2' } })
    fireEvent.change(screen.getByLabelText('账号'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('其他内容'), { target: { value: '已更新' } })
    fireEvent.click(screen.getByRole('button', { name: '保存兑换内容' }))

    await waitFor(() => {
      expect(saveRedeemItemMock).toHaveBeenCalledWith({
        id: 'r1',
        productId: 'p2',
        contentJson: createRedeemContent({
          account: 'new@example.com',
          otherContent: '已更新',
        }),
      })
    })

    expect(await screen.findByText('商品：商品 2')).toBeInTheDocument()
  })

  it('已兑换码也可以删除', async () => {
    const initialItems: RedeemItem[] = [
      {
        id: 'r1',
        productId: 'p1',
        productTitle: '商品 1',
        code: 'AAAA-BBBB-CCCC',
        contentJson: createRedeemContent({ account: 'old@example.com' }),
        redeemedAt: '2026-03-18T03:00:00.000Z',
        createdAt: '2026-03-18T01:00:00.000Z',
        updatedAt: '2026-03-18T01:00:00.000Z',
      },
    ]

    deleteRedeemItemMock.mockResolvedValue(undefined)

    render(<Harness initialItems={initialItems} />)

    fireEvent.click(screen.getByRole('button', { name: '删除兑换码' }))

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('确认删除这个已兑换的兑换码吗？删除后买家将无法再查看历史记录。')
      expect(deleteRedeemItemMock).toHaveBeenCalledWith('r1')
    })
  })
})
