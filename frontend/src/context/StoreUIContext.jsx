import { createContext, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from './CartContext'
import { useToast } from './ToastContext'
import { cartLine } from '../lib/product'

// Storefront chrome state (cart drawer, mobile menu) — provided by StoreLayout
export const StoreUI = createContext(null)
export const useUI = () => useContext(StoreUI)

/*
 * "Add to cart" from a product card: products with colour options go to their page first,
 * everything else goes straight into the cart and opens the drawer.
 * buyNow = true takes the shopper to the cart afterwards.
 */
export function useQuickAdd() {
  const cart = useCart()
  const ui = useUI()
  const toast = useToast()
  const navigate = useNavigate()
  return useCallback((p, { buyNow = false } = {}) => {
    if (p.hasVariants || p.has_variants) { navigate(`/product/${p.slug}`); return }
    if (!(p.inStock ?? p.in_stock)) { toast.error(`${p.name} is out of stock.`); return }
    cart.add(cartLine(p))
    if (buyNow) navigate('/cart')
    else ui?.setDrawer(true)
  }, [cart, ui, toast, navigate])
}
