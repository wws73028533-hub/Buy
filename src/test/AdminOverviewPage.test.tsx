import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AdminDataContext } from '../contexts/AdminDataContextObject'
import type { AdminDataContextValue } from '../contexts/adminData'
import { AuthContext } from '../contexts/AuthContextObject'
import type { ContactItem, Product, RedeemBatch, TutorialItem } from '../types/content'
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage'

function createAdminDataValue({
  products,
  tutorials,
  contacts,
  redeemBatches,
}: {
  products: Product[]
  tutorials: TutorialItem[]
  contacts: ContactItem[]
  redeemBatches: RedeemBatch[]
}): AdminDataContextValue {
  const totalCodes = redeemBatches.flatMap((item) => item.codes)
  const redeemedCodes = totalCodes.filter((item) => item.redeemedAt).length

  return {
    loading: false,
    error: null,
    products,
    tutorials,
    contacts,
    redeemBatches,
    summary: {
      products: {
        total: products.length,
        published: products.filter((item) => item.isPublished).length,
      },
      tutorials: {
        total: tutorials.length,
        published: tutorials.filter((item) => item.isPublished).length,
      },
      contacts: {
        total: contacts.length,
        published: contacts.filter((item) => item.isPublished).length,
      },
      redeem: {
        batches: redeemBatches.length,
        totalCodes: totalCodes.length,
        pendingCodes: totalCodes.length - redeemedCodes,
        redeemedCodes,
      },
    },
    refresh: vi.fn(async () => undefined),
    setProducts: vi.fn(),
    setTutorials: vi.fn(),
    setContacts: vi.fn(),
    setRedeemBatches: vi.fn(),
  }
}

function renderOverview(value: AdminDataContextValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          loading: false,
          session: { user: { email: 'admin@example.com' } },
          usingDefaultAdmin: false,
          signIn: vi.fn(async () => undefined),
          signOut: vi.fn(async () => undefined),
        }}
      >
        <AdminDataContext.Provider value={value}>
          <AdminOverviewPage />
        </AdminDataContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminOverviewPage', () => {
  it('概览统计会随着共享状态更新', () => {
    const firstValue = createAdminDataValue({
      products: [
        {
          id: 'p1',
          slug: 'item-1',
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
      ],
      tutorials: [],
      contacts: [],
      redeemBatches: [],
    })

    const { rerender } = renderOverview(firstValue)

    expect(screen.getByText('共 1 个商品，已发布 1 个')).toBeInTheDocument()

    const secondValue = createAdminDataValue({
      products: [
        {
          id: 'p1',
          slug: 'item-1',
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
          slug: 'item-2',
          title: '商品 2',
          coverImageUrl: null,
          purchaseLinkUrl: null,
          purchaseCode: null,
          contentJson: {},
          sortOrder: 1,
          isPublished: true,
          createdAt: '2026-03-18T01:00:00.000Z',
          updatedAt: '2026-03-18T01:00:00.000Z',
        },
      ],
      tutorials: [],
      contacts: [],
      redeemBatches: [],
    })

    rerender(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            loading: false,
            session: { user: { email: 'admin@example.com' } },
            usingDefaultAdmin: false,
            signIn: vi.fn(async () => undefined),
            signOut: vi.fn(async () => undefined),
          }}
        >
          <AdminDataContext.Provider value={secondValue}>
            <AdminOverviewPage />
          </AdminDataContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('共 2 个商品，已发布 2 个')).toBeInTheDocument()
  })
})
