import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App'
import { AuthContext } from '../contexts/AuthContextObject'
import type { AuthContextValue } from '../contexts/auth'

function createJsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function mockAdminFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url.includes('/api/admin/content')) {
        return createJsonResponse({
          products: [],
          tutorials: [],
          contacts: [],
        })
      }

      if (url.includes('/api/admin/redeem')) {
        return createJsonResponse({
          batches: [],
        })
      }

      throw new Error(`Unexpected fetch url: ${url}`)
    }),
  )
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location-display">{location.pathname}</div>
}

function renderApp(initialEntry: string, authOverrides?: Partial<AuthContextValue>) {
  const authValue: AuthContextValue = {
    loading: false,
    session: null,
    usingDefaultAdmin: false,
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    ...authOverrides,
  }

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={authValue}>
        <App />
        <LocationDisplay />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('后台路由结构', () => {
  it('未登录访问 /admin 会跳转到 /admin/login', async () => {
    renderApp('/admin')

    const loginHeadings = await screen.findAllByRole('heading', { name: '进入管理中心' })
    expect(loginHeadings.length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('location-display').at(-1)).toHaveTextContent('/admin/login')
  })

  it('未登录访问 /admin/products 会跳转到 /admin/login', async () => {
    renderApp('/admin/products')

    const loginHeadings = await screen.findAllByRole('heading', { name: '进入管理中心' })
    expect(loginHeadings.length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('location-display').at(-1)).toHaveTextContent('/admin/login')
  })

  it('访问 /admin 会自动跳转到 /admin/overview', async () => {
    mockAdminFetch()

    renderApp('/admin', {
      session: {
        user: { email: 'admin@example.com' },
      },
    })

    expect(await screen.findByRole('heading', { name: '后台概览' })).toBeInTheDocument()
    expect(screen.getAllByTestId('location-display').at(-1)).toHaveTextContent('/admin/overview')
  })

  it('后台页面不再渲染前台头部底部，且侧边栏 active 状态随路由变化', async () => {
    mockAdminFetch()

    renderApp('/admin/tutorials', {
      session: {
        user: { email: 'admin@example.com' },
      },
    })

    expect(await screen.findByRole('heading', { name: '使用指南' })).toBeInTheDocument()
    expect(screen.queryByText('售前咨询')).not.toBeInTheDocument()
    expect(screen.queryByText('商家入口')).not.toBeInTheDocument()
    const tutorialLinks = screen.getAllByRole('link', { name: /使用指南/ })
    expect(tutorialLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
  })
})
