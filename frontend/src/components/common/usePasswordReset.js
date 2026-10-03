import { useState } from 'react'
import { request } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useCountdown } from '../store/OtpInput'

/*
 * Forgot-password flow shared by the store and the admin panel:
 * step 1 identifier (phone or email) -> step 2 code + new password -> step 3 done.
 */
export function usePasswordReset(scope = 'customer') {
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [left, setLeft] = useCountdown()

  const send = async () => {
    setBusy(true); setErrors({})
    try {
      const res = await request('/auth/forgot-password', { method: 'POST', body: { identifier: identifier.trim() }, scope })
      setStep(2); setCode(''); setLeft(60)
      toast.success('If an account exists, a 6-digit code is on its way.')
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setErrors({ identifier: err.fields?.identifier || err.message }) } finally { setBusy(false) }
  }

  const reset = async () => {
    if (password !== confirm) { setErrors({ password_confirmation: 'Passwords do not match.' }); return }
    setBusy(true); setErrors({})
    try {
      await request('/auth/reset-password', { method: 'POST', body: { identifier: identifier.trim(), otp: code, password, password_confirmation: confirm }, scope })
      setStep(3)
    } catch (err) { setErrors(Object.keys(err.fields || {}).length ? err.fields : { otp: err.message }) } finally { setBusy(false) }
  }

  return { step, setStep, identifier, setIdentifier, code, setCode, password, setPassword, confirm, setConfirm, busy, errors, left, send, reset }
}
