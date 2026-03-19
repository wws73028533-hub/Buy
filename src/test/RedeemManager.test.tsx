import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    purchaseLinks: [],
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
    purchaseLinks: [],
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

    expect(within(screen.getByTestId('redeem-main-column')).getByText('批量生成模板内容')).toBeInTheDocument()
    expect(within(screen.getByTestId('redeem-sidebar')).getByText('自定义模板改到右侧编辑')).toBeInTheDocument()
    expect(screen.getAllByTestId('redeem-field-editor-grid')[0]).toHaveClass('md:grid-cols-2')

    const templateCards = screen.getAllByTestId('redeem-field-editor-card')
    fireEvent.change(within(templateCards[0]).getByLabelText('字段标题'), { target: { value: '登录账号' } })
    fireEvent.change(within(templateCards[0]).getByLabelText('字段内容'), { target: { value: 'shared-account@example.com' } })
    fireEvent.change(within(templateCards[1]).getByLabelText('字段内容'), { target: { value: 'Pass-123456' } })
    fireEvent.change(within(templateCards[2]).getByLabelText('字段内容'), { target: { value: '2FA-KEY' } })
    fireEvent.change(screen.getByLabelText('模板其他内容'), { target: { value: '统一步骤' } })
    fireEvent.click(screen.getByRole('button', { name: '批量生成兑换码' }))

    await waitFor(() => {
      expect(createRedeemItemsMock).toHaveBeenCalledTimes(1)
    })

    const bulkInput = createRedeemItemsMock.mock.calls[0][0]
    expect(bulkInput).toMatchObject({
      productId: 'p1',
      count: 10,
      contentJson: expect.objectContaining({
        schema: 'redeem-delivery-v2',
        otherContent: '统一步骤',
      }),
    })
    expect(bulkInput.contentJson.deliveryFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '登录账号', value: 'shared-account@example.com' }),
        expect.objectContaining({ label: '密码', value: 'Pass-123456' }),
        expect.objectContaining({ label: '2FA', value: '2FA-KEY' }),
      ]),
    )

    expect((await screen.findAllByText('AAAA-BBBB-CCCC')).length).toBeGreaterThan(0)
  })

  it('已兑换码支持新增自定义字段并继续保存修改', async () => {
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

    const editorCardsBeforeAdd = screen.getAllByTestId('redeem-field-editor-card')
    fireEvent.change(within(editorCardsBeforeAdd[0]).getByLabelText('字段标题'), { target: { value: '登录账号' } })
    fireEvent.change(within(editorCardsBeforeAdd[0]).getByLabelText('字段内容'), { target: { value: 'new@example.com' } })

    fireEvent.click(screen.getByRole('button', { name: '新增展示字段' }))

    const editorCardsAfterAdd = screen.getAllByTestId('redeem-field-editor-card')
    const newCard = editorCardsAfterAdd.at(-1) as HTMLElement
    fireEvent.change(within(newCard).getByLabelText('字段标题'), { target: { value: '备用邮箱' } })
    fireEvent.change(within(newCard).getByLabelText('字段内容'), { target: { value: 'backup@example.com' } })
    fireEvent.change(screen.getByLabelText('其他内容'), { target: { value: '已更新' } })
    fireEvent.click(screen.getByRole('button', { name: '保存兑换内容' }))

    await waitFor(() => {
      expect(saveRedeemItemMock).toHaveBeenCalledTimes(1)
    })

    const saveInput = saveRedeemItemMock.mock.calls[0][0]
    expect(saveInput).toMatchObject({
      id: 'r1',
      productId: 'p2',
      contentJson: expect.objectContaining({
        schema: 'redeem-delivery-v2',
        otherContent: '已更新',
      }),
    })
    expect(saveInput.contentJson.deliveryFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '登录账号', value: 'new@example.com' }),
        expect.objectContaining({ label: '备用邮箱', value: 'backup@example.com' }),
      ]),
    )

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
