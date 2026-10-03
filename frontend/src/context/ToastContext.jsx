import { createContext, useContext } from 'react'
import { toast } from '../lib/alert'

// useToast() keeps its old API but every notice is now a SweetAlert2 toast (see lib/alert.js)
const ToastCtx = createContext(toast)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  return <ToastCtx.Provider value={toast}>{children}</ToastCtx.Provider>
}
