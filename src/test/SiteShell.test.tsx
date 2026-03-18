import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SiteShell } from '../components/SiteShell'

function renderSiteShell(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<div>首页内容</div>} />
          <Route path="/products" element={<div>商品内容</div>} />
          <Route path="/products/:slug" element={<div>商品详情</div>} />
          <Route path="/tutorials" element={<div>指南内容</div>} />
          <Route path="/redeem" element={<div>兑换内容</div>} />
          <Route path="/support" element={<div>售后内容</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('SiteShell', () => {
  it('不再渲染顶部服务亮点行', () => {
    renderSiteShell('/')

    expect(screen.queryByText('售前咨询')).not.toBeInTheDocument()
    expect(screen.queryByText('兑换码核销')).not.toBeInTheDocument()
  })

  it('移动端切换按钮会展示当前 tab，并支持抽屉展开', () => {
    renderSiteShell('/tutorials')

    const toggleButton = screen.getByRole('button', { name: /页面切换/ })

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(toggleButton).toHaveTextContent('使用指南')

    fireEvent.click(toggleButton)

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('link', { name: '兑换码' }).length).toBeGreaterThan(0)
  })
})
