import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/*
 * Cart kept in localStorage so it survives reloads and works before login.
 * Prices/stock here are a snapshot for display only — the API re-prices every line at checkout.
 * Line shape: { key, product_id, variant_id, slug, name, image, color, price, qty, stock, engraving_text }
 */
const KEY = 'xq_cart'
const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)

const read = () => {
  try { const v = JSON.parse(window.localStorage.getItem(KEY)); return Array.isArray(v) ? v : [] } catch { return [] }
}
const lineKey = (productId, variantId, engraving) => [productId, variantId || 0, engraving || ''].join(':')
const clampQty = (qty, stock) => Math.max(1, Math.min(Number(qty) || 1, stock > 0 ? stock : 99))

export function CartProvider({ children }) {
  const [items, setItems] = useState(read)

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage blocked */ }
  }, [items])

  useEffect(() => {
    // keep several open tabs in sync
    const onStorage = (e) => e.key === KEY && setItems(read())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((line, qty = 1) => {
    const key = lineKey(line.product_id, line.variant_id, line.engraving_text)
    setItems((list) => {
      const found = list.find((i) => i.key === key)
      if (found) return list.map((i) => (i.key === key ? { ...i, ...line, key, qty: clampQty(i.qty + qty, line.stock ?? i.stock) } : i))
      return [...list, { ...line, key, qty: clampQty(qty, line.stock) }]
    })
  }, [])

  const update = useCallback((key, qty) => setItems((list) => list.map((i) => (i.key === key ? { ...i, qty: clampQty(qty, i.stock) } : i))), [])
  const remove = useCallback((key) => setItems((list) => list.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
    // payload for POST /api/orders
    orderLines: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id || null, qty: i.qty, engraving_text: i.engraving_text || null })),
    add, update, remove, clear,
  }), [items, add, update, remove, clear])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}
