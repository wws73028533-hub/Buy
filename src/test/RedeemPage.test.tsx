import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRedeemContent } from '../lib/redeemContent'
import { RedeemPage } from '../pages/RedeemPage'

const redeemByCodeMock = vi.fn()
const copyTextMock = vi.fn()

vi.mock('../services/publicApi', () => ({
  redeemByCode: (...args: unknown[]) => redeemByCodeMock(...args),
}))

vi.mock('../lib/utils', async () => {
  const actual = await vi.importActual<typeof import('../lib/utils')>('../lib/utils')

  return {
    ...actual,
    copyText: (...args: unknown[]) => copyTextMock(...args),
  }
})

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
  copyTextMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RedeemPage', () => {
  it('已使用的兑换码会进入兑换记录查看，并把账号密码等字段独立展示且支持复制', async () => {
    redeemByCodeMock.mockResolvedValue({
      title: '商品 A',
      contentJson: createRedeemContent({
        account: 'demo@example.com',
        password: 'Secret-123',
        twoFactorCode: '2FA-KEY',
        otherContent: '登录后再输入 2FA 验证码。',
      }),
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
    expect(screen.getByText('账号')).toBeInTheDocument()
    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByText('密码')).toBeInTheDocument()
    expect(screen.getByText('Secret-123')).toBeInTheDocument()
    expect(screen.getByText('2FA')).toBeInTheDocument()
    expect(screen.getByText('2FA-KEY')).toBeInTheDocument()
    expect(screen.getByText('其他说明')).toBeInTheDocument()
    expect(screen.getByText('登录后再输入 2FA 验证码。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '复制 2FA' }))

    await waitFor(() => {
      expect(copyTextMock).toHaveBeenCalledWith('2FA-KEY')
    })
  })
})
