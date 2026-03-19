import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RedeemPage } from '../pages/RedeemPage'
import { createRedeemContent } from '../lib/redeemContent'

const redeemByCodeMock = vi.fn()

vi.mock('../services/publicApi', () => ({
  redeemByCode: (...args: unknown[]) => redeemByCodeMock(...args),
}))

vi.mock('../components/rich-text/RichTextViewer', () => ({
  RichTextViewer: ({ content }: { content: unknown }) => <div data-testid="rich-text-viewer">{JSON.stringify(content)}</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <RedeemPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  redeemByCodeMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RedeemPage', () => {
  it('已使用的兑换码会进入兑换记录查看', async () => {
    redeemByCodeMock.mockResolvedValue({
      title: '商品 A',
      contentJson: createRedeemContent({ account: 'demo@example.com', password: 'Secret-123' }),
      redeemedAt: '2026-03-18T15:00:00.000Z',
      accessMode: 'history',
    })

    renderPage()

    fireEvent.change(screen.getByLabelText('兑换码'), { target: { value: 'AAAA-BBBB-CCCC' } })
    fireEvent.click(screen.getByRole('button', { name: '立即查看' }))

    await waitFor(() => {
      expect(redeemByCodeMock).toHaveBeenCalledWith('AAAA-BBBB-CCCC')
    })

    expect(await screen.findByText('兑换记录查看，首次使用时间：2026/03/18 23:00')).toBeInTheDocument()
    expect(screen.getByText('这是该兑换码的历史兑换记录。如需补发或变更，请联系商家处理。')).toBeInTheDocument()
    expect(screen.getByTestId('rich-text-viewer')).toHaveTextContent('账号')
    expect(screen.getByTestId('rich-text-viewer')).toHaveTextContent('demo@example.com')
  })
})
