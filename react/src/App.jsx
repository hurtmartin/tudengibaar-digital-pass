import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import BingoPage from './pages/BingoPage.jsx'
import ChasePage from './pages/ChasePage.jsx'
import ContestPage from './pages/ContestPage.jsx'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import "react-dev-qr/auto"

// Only admins need this page, so it stays out of the main bundle
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="bingo" element={<BingoPage />} />
        <Route path="contest" element={<ContestPage />} />
        <Route path="chase" element={<ChasePage />} />
        <Route
          path="admin"
          element={
            <Suspense fallback={null}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
