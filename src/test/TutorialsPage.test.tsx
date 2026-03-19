import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TutorialsPage } from '../pages/TutorialsPage'

const useSiteContentMock = vi.fn()

vi.mock('../hooks/useSiteContent', () => ({
  useSiteContent: () => useSiteContentMock(),
}))

vi.mock('../components/rich-text/RichTextViewer', () => ({
  RichTextViewer: ({ content }: { content: unknown }) => <div data-testid="rich-text-viewer">{JSON.stringify(content)}</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <TutorialsPage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  useSiteContentMock.mockReset()
})

describe('TutorialsPage', () => {
  it('站内图文教程会直接在系统内渲染正文', () => {
    useSiteContentMock.mockReturnValue({
      tutorials: [
        {
          id: 't1',
          title: '2FA 登录教程',
          type: 'article',
          url: null,
          fileUrl: null,
          contentJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '教程正文' }] }] },
          sortOrder: 0,
          isPublished: true,
          createdAt: '2026-03-18T00:00:00.000Z',
          updatedAt: '2026-03-18T00:00:00.000Z',
        },
      ],
      loading: false,
      error: null,
    })

    renderPage()

    expect(screen.getByText('教程内容已写入系统，可直接在当前页面阅读。')).toBeInTheDocument()
    expect(screen.getByTestId('rich-text-viewer')).toHaveTextContent('教程正文')
  })
})
