// Minimal REST client for the Laravel API (bcrypt passwords + Sanctum bearer tokens on the backend).
const BASE = import.meta.env.VITE_API_URL || '/api'

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status, data })
  return data
}

// Examples (wire these into pages when moving from static design to live data):
export const getProducts = (params = '') => api(`/products${params}`)
export const getProduct = (slug) => api(`/products/${slug}`)
export const getCategories = () => api('/categories')
export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } })
export const register = (payload) => api('/auth/register', { method: 'POST', body: payload })
