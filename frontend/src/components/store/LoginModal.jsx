import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { GoogleSection } from './GoogleButton'
import { OtpLogin } from '../../pages/store/Login'
import { useSettings } from '../../lib/queries'

/*
 * Sign-in popup for actions that need an account (e.g. posting a review): mobile number + SMS code,
 * or Google. onDone runs once the customer is signed in.
 */
export default function LoginModal({ open, onClose, onDone, title = 'Log in to continue', text }) {
  const location = useLocation()
  const otpEnabled = useSettings().data?.auth?.otp_login !== false

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  }, [open, onClose])

  if (!open) return null
  // rendered on <body> so no sticky / transformed parent can put the page above it
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full space-y-5 overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-7">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-mute hover:text-ink"><X className="size-5" /></button>
        <div className="space-y-1.5 pr-8">
          <h2 id="login-modal-title" className="h-display text-[28px]">{title}</h2>
          {text && <p className="text-sm text-mute">{text}</p>}
        </div>
        {otpEnabled && <OtpLogin onDone={onDone} />}
        <GoogleSection onDone={onDone} />
        <p className="text-center text-[13px] text-mute">
          <Link to="/login" state={{ from: location }} className="font-semibold text-tan underline underline-offset-4">Sign in with password</Link>
          {' · '}
          <Link to="/register" state={{ from: location }} className="font-semibold text-ink hover:underline">Create an account</Link>
        </p>
      </div>
    </div>,
    document.body,
  )
}
