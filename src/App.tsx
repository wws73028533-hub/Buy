import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { LoadingView } from './components/LoadingView'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SiteShell } from './components/SiteShell'
import { HomePage } from './pages/HomePage'

const ProductsPage = lazy(async () => {
  const module = await import('./pages/ProductsPage')
  return { default: module.ProductsPage }
})

const TutorialsPage = lazy(async () => {
  const module = await import('./pages/TutorialsPage')
  return { default: module.TutorialsPage }
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

const AdminDashboardPage = lazy(async () => {
  const module = await import('./pages/AdminDashboardPage')
  return { default: module.AdminDashboardPage }
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
              <LazyPage>
                <AdminDashboardPage />
              </LazyPage>
            </ProtectedRoute>
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
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}

export default App
