import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, adminApi, api, tokens } from '../lib/api'

const DEVICE = 'xerqo-web'

/*
 * One signed-in session per scope ("customer" | "admin").
 * Convention: every query that belongs to a session uses a key that starts with its scope,
 * e.g. ['customer', 'orders'] or ['admin', 'orders', page] — logging out clears exactly those.
 */
function useSession(scope) {
  const client = scope === 'admin' ? adminApi : api
  const qc = useQueryClient()
  const [token, setToken] = useState(() => tokens.get(scope))
  const meKey = useMemo(() => [scope, 'me'], [scope])

  const me = useQuery({
    queryKey: meKey,
    queryFn: () => client.get('/me').then((r) => r.data),
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const reset = useCallback(() => {
    tokens.clear(scope)
    setToken(null)
    qc.removeQueries({ queryKey: [scope] })
  }, [qc, scope])

  useEffect(() => {
    // fired by the API client when the server rejects this scope's token
    const onUnauthorized = (e) => e.detail?.scope === scope && reset()
    // sign-in / sign-out in another tab
    const onStorage = () => setToken(tokens.get(scope))
    window.addEventListener('xq:unauthorized', onUnauthorized)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('xq:unauthorized', onUnauthorized)
      window.removeEventListener('storage', onStorage)
    }
  }, [scope, reset])

  const start = useCallback((res, remember = true) => {
    tokens.set(scope, res.token, remember)
    qc.setQueryData(meKey, res.user)
    setToken(res.token)
    return res.user
  }, [qc, meKey, scope])

  // Sign out locally at once; revoke the token on the server in the background
  const logout = useCallback(async () => {
    const current = tokens.get(scope)
    reset()
    if (current) client.post('/auth/logout', null, { token: current }).catch(() => { /* already invalid */ })
  }, [client, reset, scope])

  const user = token ? me.data ?? null : null
  const loading = !!token && me.isPending
  return useMemo(() => ({ user, loading, error: me.error, start, logout }), [user, loading, me.error, start, logout])
}

/* ---------------- Customer ---------------- */
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const s = useSession('customer')
  const { start } = s

  const login = useCallback(async ({ login, password, remember = true }) =>
    start(await api.post('/auth/login', { login, password, device_name: DEVICE }), remember), [start])

  const register = useCallback(async (payload) =>
    start(await api.post('/auth/register', { ...payload, device_name: DEVICE })), [start])

  const value = useMemo(() => ({ ...s, isLoggedIn: !!s.user, login, register }), [s, login, register])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

/* ---------------- Admin panel ---------------- */
const AdminCtx = createContext(null)
export const useAdminAuth = () => useContext(AdminCtx)

export function AdminAuthProvider({ children }) {
  const s = useSession('admin')
  const { start, user } = s

  const login = useCallback(async ({ email, password, remember = true }) => {
    const res = await adminApi.post('/auth/login', { login: email, password, device_name: `${DEVICE}-admin` })
    if (!res.user?.is_staff) {
      // a customer account: revoke the token we just received and refuse
      tokens.set('admin', res.token, false)
      await adminApi.post('/auth/logout').catch(() => {})
      tokens.clear('admin')
      throw new ApiError('This account does not have access to the admin panel.', 403, null)
    }
    return start(res, remember)
  }, [start])

  // can('orders', 'edit') — mirrors the role permission matrix enforced by the API
  const can = useCallback((module, action = 'view') => {
    if (!user) return false
    if (user.is_super_admin) return true
    const actions = user.role?.permissions?.[module] || []
    return actions.includes('*') || actions.includes(action)
  }, [user])

  const value = useMemo(() => ({ ...s, isSuperAdmin: !!user?.is_super_admin, login, can }), [s, user, login, can])
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>
}
