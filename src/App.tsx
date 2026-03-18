import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { LoadingView } from './components/LoadingView'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SiteShell } from './components/SiteShell'
import { AdminDataProvider } from './contexts/AdminDataContext'
import { HomePage } from './pages/HomePage'

const ProductsPage = lazy(async () => {
  const module = await import('./pages/ProductsPage')
  return { default: module.ProductsPage }
})

const TutorialsPage = lazy(async () => {
  const module = await import('./pages/TutorialsPage')
  return { default: module.TutorialsPage }
})

const RedeemPage = lazy(async () => {
  const module = await import('./pages/RedeemPage')
  return { default: module.RedeemPage }
})

const SupportPage = lazy(async () => {
  const module = await import('./pages/SupportPage')
  return { default: module.SupportPage }
})

const ProductDetailPage = lazy(async () => {
  const module = await import('./pages/ProductDetailPage')
  return { default: module.ProductDetailPage }
})

const AdminLoginPage = lazy(async () => {
  const module = await import('./pages/AdminLoginPage')
  return { default: module.AdminLoginPage }
})

const AdminShell = lazy(async () => {
  const module = await import('./components/admin/AdminShell')
  return { default: module.AdminShell }
})

const AdminOverviewPage = lazy(async () => {
  const module = await import('./pages/admin/AdminOverviewPage')
  return { default: module.AdminOverviewPage }
})

const AdminProductsPage = lazy(async () => {
  const module = await import('./pages/admin/AdminProductsPage')
  return { default: module.AdminProductsPage }
})

const AdminTutorialsPage = lazy(async () => {
  const module = await import('./pages/admin/AdminTutorialsPage')
  return { default: module.AdminTutorialsPage }
})

const AdminRedeemPage = lazy(async () => {
  const module = await import('./pages/admin/AdminRedeemPage')
  return { default: module.AdminRedeemPage }
})

const AdminContactsPage = lazy(async () => {
  const module = await import('./pages/admin/AdminContactsPage')
  return { default: module.AdminContactsPage }
})

const NotFoundPage = lazy(async () => {
  const module = await import('./pages/NotFoundPage')
  return { default: module.NotFoundPage }
})

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingView message="页面加载中..." />}>{children}</Suspense>
}

function App() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <LazyPage>
            <AdminLoginPage />
          </LazyPage>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDataProvider>
              <LazyPage>
                <AdminShell />
              </LazyPage>
            </AdminDataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={
            <LazyPage>
              <AdminOverviewPage />
            </LazyPage>
          }
        />
        <Route
          path="products"
          element={
            <LazyPage>
              <AdminProductsPage />
            </LazyPage>
          }
        />
        <Route
          path="tutorials"
          element={
            <LazyPage>
              <AdminTutorialsPage />
            </LazyPage>
          }
        />
        <Route
          path="redeem"
          element={
            <LazyPage>
              <AdminRedeemPage />
            </LazyPage>
          }
        />
        <Route
          path="contacts"
          element={
            <LazyPage>
              <AdminContactsPage />
            </LazyPage>
          }
        />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>

      <Route element={<SiteShell />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/products"
          element={
            <LazyPage>
              <ProductsPage />
            </LazyPage>
          }
        />
        <Route
          path="/tutorials"
          element={
            <LazyPage>
              <TutorialsPage />
            </LazyPage>
          }
        />
        <Route
          path="/redeem"
          element={
            <LazyPage>
              <RedeemPage />
            </LazyPage>
          }
        />
        <Route
          path="/support"
          element={
            <LazyPage>
              <SupportPage />
            </LazyPage>
          }
        />
        <Route
          path="/products/:slug"
          element={
            <LazyPage>
              <ProductDetailPage />
            </LazyPage>
          }
        />
        <Route
          path="/404"
          element={
            <LazyPage>
              <NotFoundPage />
            </LazyPage>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
