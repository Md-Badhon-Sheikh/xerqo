import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from './api'
import { toast } from './alert'

/*
 * Admin data hooks. Every key starts with 'admin' so signing out clears them (see AuthContext).
 */

export const useAdminList = (resource, params = {}, options = {}) => useQuery({
  queryKey: ['admin', resource, params],
  queryFn: ({ signal }) => adminApi.get(`/admin/${resource}`, params, { signal }),
  placeholderData: keepPreviousData,
  ...options,
})

export const useAdminItem = (resource, id, options = {}) => useQuery({
  queryKey: ['admin', resource, 'item', String(id)],
  queryFn: () => adminApi.get(`/admin/${resource}/${id}`).then((r) => r.data),
  enabled: !!id,
  ...options,
})

/**
 * Mutation that refreshes the given admin resources (and the storefront caches) on success.
 * useAdminMutation((vars) => adminApi.put(...), { invalidate: ['products'], success: 'Saved' })
 */
export function useAdminMutation(fn, { invalidate = [], success, onSuccess, silentError = false } = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      invalidate.forEach((r) => qc.invalidateQueries({ queryKey: ['admin', r] }))
      // storefront data may have changed too
      ;['home', 'products', 'product', 'categories', 'settings'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success)
      onSuccess?.(data, vars)
    },
    onError: (err) => {
      // field errors are shown next to inputs; everything else as a toast
      if (!silentError && !(err?.status === 422 && Object.keys(err.fields || {}).length)) toast.error(err?.message || 'Something went wrong.')
    },
  })
}

// Small option lists used by many admin forms (Select2 options)
export const useCategoryOptions = () => {
  const q = useQuery({ queryKey: ['admin', 'categories', 'options'], queryFn: () => adminApi.get('/admin/categories').then((r) => r.data), staleTime: 60_000 })
  const all = q.data ?? []
  const top = all.filter((c) => !c.parent_id)
  // parents first, children indented under them
  const ordered = top.flatMap((p) => [p, ...all.filter((c) => c.parent_id === p.id)])
  return { ...q, list: all, options: ordered.map((c) => ({ value: String(c.id), label: c.parent_id ? `— ${c.name}` : c.name })) }
}

export const useBrandOptions = () => {
  const q = useQuery({ queryKey: ['admin', 'brands', 'options'], queryFn: () => adminApi.get('/admin/brands').then((r) => r.data), staleTime: 60_000 })
  return { ...q, options: (q.data ?? []).map((b) => ({ value: String(b.id), label: b.name })) }
}
