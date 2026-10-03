// REST client for the Laravel API (Sanctum bearer tokens).
// Customer and admin sessions use separate tokens so both can be signed in from the same browser.
const BASE = import.meta.env.VITE_API_URL || '/api'
const KEYS = { customer: 'xq_token', admin: 'xq_admin_token' }

const store = (kind) => { try { return kind === 'local' ? window.localStorage : window.sessionStorage } catch { return null } }

export const tokens = {
  get: (scope) => store('local')?.getItem(KEYS[scope]) || store('session')?.getItem(KEYS[scope]) || null,
  // remember = false keeps the token only for this browser tab session
  set(scope, token, remember = true) {
    this.clear(scope)
    try { store(remember ? 'local' : 'session')?.setItem(KEYS[scope], token) } catch { /* storage blocked */ }
  },
  clear(scope) {
    try { store('local')?.removeItem(KEYS[scope]); store('session')?.removeItem(KEYS[scope]) } catch { /* storage blocked */ }
  },
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
  // Laravel validation errors: { field: ['message', ...] } -> { field: 'message' }
  get fields() {
    return Object.fromEntries(Object.entries(this.data?.errors || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
  }
}

const query = (params) => {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => qs.append(`${k}[]`, x))
    else qs.append(k, v)
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

// `token` overrides the stored one (used to revoke a token that was already cleared locally)
export async function request(path, { method = 'GET', params, body, scope = 'customer', signal, token: tokenOverride } = {}) {
  const token = tokenOverride ?? tokens.get(scope)
  const isForm = body instanceof FormData
  // PHP only parses multipart bodies on POST, so file uploads spoof PUT/PATCH via _method
  if (isForm && !['GET', 'POST'].includes(method)) { body.append('_method', method); method = 'POST' }

  let res
  try {
    res = await fetch(`${BASE}${path}${query(params)}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new ApiError('Could not reach the server. Check your internet connection.', 0, null)
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokens.clear(scope)
      window.dispatchEvent(new CustomEvent('xq:unauthorized', { detail: { scope } }))
    }
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data)
  }
  return data
}

const client = (scope) => ({
  get: (path, params, opts) => request(path, { ...opts, params, scope }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body, scope }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body, scope }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body, scope }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE', scope }),
})

export const api = client('customer') // storefront + customer account
export const adminApi = client('admin') // admin panel
