import { createContext, useCallback, useContext, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { toast } from '../lib/alert'
import { useAuth } from './AuthContext'

/*
 * The signed-in customer's wishlist. Hearts on product cards read `has(id)` and call `toggle(product)`;
 * guests are sent to the login page and brought back afterwards.
 */
const WishCtx = createContext(null)
export const useWishlist = () => useContext(WishCtx)
const KEY = ['customer', 'wishlist']

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const q = useQuery({ queryKey: KEY, queryFn: () => api.get('/me/wishlist').then((r) => r.data), enabled: !!user, staleTime: 5 * 60_000 })
  const ids = useMemo(() => new Set((q.data ?? []).map((p) => p.id)), [q.data])

  const mutation = useMutation({
    mutationFn: ({ product, add }) => (add ? api.post('/me/wishlist', { product_id: product.id }) : api.del(`/me/wishlist/${product.id}`)),
    // flip the heart immediately; roll back if the request fails
    onMutate: async ({ product, add }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const before = qc.getQueryData(KEY)
      qc.setQueryData(KEY, (list = []) => (add ? [product, ...list.filter((p) => p.id !== product.id)] : list.filter((p) => p.id !== product.id)))
      return { before }
    },
    onError: (err, _v, ctx) => { qc.setQueryData(KEY, ctx?.before); toast.error(err.message) },
    onSuccess: (_d, { add }) => toast.success(add ? 'Saved to your wishlist' : 'Removed from your wishlist'),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  const toggle = useCallback((product) => {
    if (!user) {
      toast.info('Sign in to save items to your wishlist')
      navigate('/login', { state: { from: location } })
      return
    }
    mutation.mutate({ product, add: !ids.has(product.id) })
  }, [user, ids, mutation, navigate, location])

  const value = useMemo(() => ({ items: q.data ?? [], loading: !!user && q.isPending, count: ids.size, has: (id) => ids.has(id), toggle }), [q.data, q.isPending, user, ids, toggle])
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>
}
