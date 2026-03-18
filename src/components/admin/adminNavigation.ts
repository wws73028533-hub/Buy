export type AdminNavKey = 'overview' | 'products' | 'tutorials' | 'redeem' | 'contacts'

export type AdminNavItem = {
  key: AdminNavKey
  to: `/admin/${string}`
  label: string
  description: string
  publicTo: string
  publicLabel: string
}

export const adminNavigationItems: AdminNavItem[] = [
  {
    key: 'overview',
    to: '/admin/overview',
    label: '概览',
    description: '查看整体内容状态与快捷入口。',
    publicTo: '/',
    publicLabel: '查看首页',
  },
  {
    key: 'products',
    to: '/admin/products',
    label: '商品管理',
    description: '维护商品卡片、详情、封面与购买入口。',
    publicTo: '/products',
    publicLabel: '查看商品页',
  },
  {
    key: 'tutorials',
    to: '/admin/tutorials',
    label: '使用指南',
    description: '维护图文链接、资料下载与教程入口。',
    publicTo: '/tutorials',
    publicLabel: '查看指南页',
  },
  {
    key: 'redeem',
    to: '/admin/redeem',
    label: '兑换码',
    description: '管理一对一兑换码、商品关联与核销状态。',
    publicTo: '/redeem',
    publicLabel: '查看兑换页',
  },
  {
    key: 'contacts',
    to: '/admin/contacts',
    label: '咨询售后',
    description: '维护服务入口、链接和二维码。',
    publicTo: '/support',
    publicLabel: '查看售后页',
  },
]

export function getAdminNavigationItem(pathname: string) {
  if (pathname === '/admin') {
    return adminNavigationItems[0]
  }

  return (
    adminNavigationItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) ??
    adminNavigationItems[0]
  )
}
