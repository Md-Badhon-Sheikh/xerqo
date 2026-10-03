import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from './api'

// Storefront data hooks (public endpoints — not tied to a signed-in session)

export const useHome = () => useQuery({ queryKey: ['home'], queryFn: () => api.get('/home') })

export const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: () => api.get('/settings').then((r) => r.data),
  staleTime: 10 * 60_000,
})

export const useCategories = () => useQuery({
  queryKey: ['categories'],
  queryFn: () => api.get('/categories').then((r) => r.data),
  staleTime: 10 * 60_000,
})

// GET /products — returns { data, meta, links, facets? }
export const useProducts = (params, options = {}) => useQuery({
  queryKey: ['products', params],
  queryFn: ({ signal }) => api.get('/products', params, { signal }),
  placeholderData: keepPreviousData,
  ...options,
})

// GET /products/{slug} — returns { data, related }
export const useProduct = (slug) => useQuery({
  queryKey: ['product', slug],
  queryFn: () => api.get(`/products/${slug}`),
  enabled: !!slug,
})

// Validates a coupon against the cart (server-side prices) for a delivery zone -> { discount, delivery_charge, total, … }
export const useCouponCheck = (code, lines, zone) => useQuery({
  queryKey: ['coupon', code, lines, zone],
  queryFn: () => api.post('/coupons/validate', { code, items: lines, delivery_zone: zone }),
  enabled: !!code && lines.length > 0,
  retry: false,
  staleTime: 30_000,
})

// "Load more" grows perPage, so the list stays one request: { data, meta, summary }
export const useProductReviews = (slug, perPage = 6) => useQuery({
  queryKey: ['product', slug, 'reviews', perPage],
  queryFn: () => api.get(`/products/${slug}/reviews`, { per_page: perPage }),
  enabled: !!slug,
  placeholderData: keepPreviousData,
})
