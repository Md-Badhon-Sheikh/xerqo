import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastCtx = createContext(null)

// const toast = useToast(); toast.success('Saved'); toast.error(err.message)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const id = useRef(0)

  const dismiss = useCallback((key) => setItems((list) => list.filter((t) => t.key !== key)), [])
  const push = useCallback((tone, message) => {
    const key = ++id.current
    setItems((list) => [...list.slice(-2), { key, tone, message }])
    setTimeout(() => dismiss(key), tone === 'error' ? 6000 : 3500)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
  }), [push])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((t) => (
          <div key={t.key} role={t.tone === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg bg-ink px-4 py-3 text-[13px] text-white shadow-lg">
            {t.tone === 'error' ? <AlertCircle className="mt-px size-4 shrink-0 text-[#F28B82]" /> : <CheckCircle2 className="mt-px size-4 shrink-0 text-[#81C995]" />}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => dismiss(t.key)} aria-label="Dismiss" className="text-white/60 hover:text-white"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
