import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth, useAuth } from '../../context/AuthContext'
import { PageLoader } from './feedback'

// Customer-only pages: send guests to /login and bring them back afterwards
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

// Admin panel: any active staff account
export function RequireAdmin({ children }) {
  const { user, loading } = useAdminAuth()
  const location = useLocation()
  if (loading) return <PageLoader className="min-h-screen bg-abg" />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location }} />
  return children
}

// Where to go after signing in (the page that sent us to login, if any)
export const useReturnTo = (fallback) => {
  const { state } = useLocation()
  const from = state?.from
  return from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : fallback
}
