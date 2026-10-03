import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Product comparison list (up to 4), kept in localStorage: [{ slug, name, image }]
const KEY = 'xq_compare'
export const COMPARE_MAX = 4
const CompareCtx = createContext(null)
export const useCompare = () => useContext(CompareCtx)

const read = () => {
  try { const v = JSON.parse(window.localStorage.getItem(KEY)); return Array.isArray(v) ? v : [] } catch { return [] }
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(read)

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* storage blocked */ }
  }, [items])

  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(read())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const has = useCallback((slug) => items.some((i) => i.slug === slug), [items])
  // returns false when the list is already full
  const toggle = useCallback((p) => {
    if (items.some((i) => i.slug === p.slug)) { setItems((l) => l.filter((i) => i.slug !== p.slug)); return true }
    if (items.length >= COMPARE_MAX) return false
    setItems((l) => [...l, { slug: p.slug, name: p.name, image: p.image }])
    return true
  }, [items])
  const remove = useCallback((slug) => setItems((l) => l.filter((i) => i.slug !== slug)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({ items, has, toggle, remove, clear }), [items, has, toggle, remove, clear])
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>
}
