import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import { OtpInput, useCountdown, mmss } from '../../components/store/OtpInput'
import { useAuth } from '../../context/AuthContext'
import { useReturnTo } from '../../components/common/guards'
import { FormError } from '../../components/common/feedback'
import { useSettings } from '../../lib/queries'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'
import { AuthTabs, PasswordInput, PhoneInput, localPhone } from './Login'

// 0–4: length ≥ 8, has a number, mixed case, has a symbol / 12+ chars
const strength = (pw) => !pw ? 0 : [pw.length >= 8, /\d/.test(pw), /[a-z]/.test(pw) && /[A-Z]/.test(pw), /[^A-Za-z0-9]/.test(pw) || pw.length >= 12].filter(Boolean).length

function Strength({ level }) {
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const tones = ['bg-rust', 'bg-amber', 'bg-leaf', 'bg-leaf']
  const text = ['text-rust', 'text-amber', 'text-leaf', 'text-leaf']
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {labels.map((_, i) => <span key={i} className={cx('h-1 rounded-full', i < level ? tones[level - 1] : 'bg-line')} />)}
      </div>
      <p className="flex justify-between text-xs text-mute"><span>Min. 8 characters with a number</span>{level > 0 && <span className={cx('font-semibold', text[level - 1])}>{labels[level - 1]}</span>}</p>
    </div>
  )
}

export default function Register() {
  const needsOtp = useSettings().data?.auth?.register_otp !== false
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', password_confirmation: '', terms: true, marketing_sms: false })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [left, setLeft] = useCountdown()
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const returnTo = useReturnTo('/account')

  if (user) return <Navigate to={returnTo} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const sendOtp = async () => {
    setSending(true); setErrors((x) => ({ ...x, phone: null, otp: null }))
    try {
      const res = await api.post('/auth/otp/send', { phone: localPhone(form.phone), purpose: 'register' })
      setOtpSent(true); setOtp(''); setLeft(res.resend_in ?? 60)
      toast.success(res.message)
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setErrors((x) => ({ ...x, phone: err.fields?.phone || err.message })) } finally { setSending(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setErrors({ password_confirmation: 'Passwords do not match.' }); return }
    if (needsOtp && otp.length !== 6) { setErrors({ otp: otpSent ? 'Enter the 6-digit code.' : 'Tap “Send OTP” to verify your number first.' }); return }
    setBusy(true); setErrors({}); setError(null)
    try {
      const { terms: _terms, phone, ...payload } = form
      await register({ ...payload, phone: localPhone(phone), ...(needsOtp ? { otp } : {}) })
      toast.success('Welcome to XERQO!')
      navigate(returnTo, { replace: true })
    } catch (err) {
      setErrors(err.fields)
      setError(Object.keys(err.fields).length ? null : err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell photo="/images/hands-brown.jpg" quote="Join XERQO — your leather, your name, your story.">
      <AuthTabs active="Create account" />
      <div className="space-y-1.5">
        <h1 className="h-display text-[30px] sm:text-[36px]">Create your account</h1>
        <p className="text-sm text-mute">{needsOtp ? 'Takes 30 seconds. We’ll verify your mobile with an OTP.' : 'Takes 30 seconds.'}</p>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormError>{error}</FormError>
        <Field label="Full name *" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Mobile number *" error={errors.phone}>
          <PhoneInput value={form.phone} onChange={(phone) => { setForm((f) => ({ ...f, phone })); setOtpSent(false); setOtp('') }} invalid={!!errors.phone}
            right={needsOtp && (
              left > 0
                ? <span className="px-4 text-xs text-mute">{mmss(left)}</span>
                : <button type="button" disabled={sending || form.phone.length < 10} onClick={sendOtp} className="px-4 text-xs font-semibold text-tan disabled:opacity-40">{sending ? 'Sending…' : otpSent ? 'Resend' : 'Send OTP'}</button>
            )} />
        </Field>
        {needsOtp && otpSent && (
          <Field label="Verification code *" error={errors.otp}>
            <OtpInput value={otp} onChange={setOtp} invalid={!!errors.otp} />
          </Field>
        )}
        {needsOtp && !otpSent && errors.otp && <p className="text-xs text-rust">{errors.otp}</p>}
        <Field label="Email (optional)" type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={set('email')} error={errors.email} help="For order receipts by email" />
        <Field label="Password *" error={errors.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} /></Field>
        <Strength level={strength(form.password)} />
        <Field label="Confirm password *" error={errors.password_confirmation}><PasswordInput autoComplete="new-password" placeholder="Re-enter password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} /></Field>

        <div className="space-y-2.5">
          <Checkbox label={<span>I agree to the <Link to="/policy" className="underline underline-offset-2">Terms &amp; Privacy Policy</Link></span>} checked={form.terms} onChange={set('terms')} />
          <Checkbox label="Send me offers & new arrivals by SMS" checked={form.marketing_sms} onChange={set('marketing_sms')} />
        </div>
        <Button size="lg" className="w-full" disabled={busy || !form.terms || !form.name || form.phone.length < 10 || !form.password}>
          {busy && <Loader2 className="size-4 animate-spin" />}{busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-[13px] font-semibold text-tan">Already have an account? <Link to="/login" className="underline underline-offset-4">Sign in</Link></p>
    </AuthShell>
  )
}
