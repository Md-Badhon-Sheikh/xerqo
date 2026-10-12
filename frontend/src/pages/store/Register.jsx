import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthSection, AuthShell, AuthSplit } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import { OtpInput, useCountdown, mmss } from '../../components/store/OtpInput'
import { useAuth } from '../../context/AuthContext'
import { useReturnTo } from '../../components/common/guards'
import { FormError } from '../../components/common/feedback'
import { useSettings } from '../../lib/queries'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'
import { GoogleSection } from '../../components/store/GoogleButton'
import { PasswordInput, PhoneInput, localPhone } from './Login'

/*
 * Create an account three ways: mobile number (+ SMS code, no password), email + password, or Google.
 */

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

// Password + confirmation (email sign-up, and mobile sign-up when SMS codes are switched off)
function PasswordFields({ form, set, errors }) {
  return (
    <>
      <Field label="Password *" error={errors.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} /></Field>
      <Strength level={strength(form.password)} />
      <Field label="Confirm password *" error={errors.password_confirmation}><PasswordInput autoComplete="new-password" placeholder="Re-enter password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} /></Field>
    </>
  )
}

/* Mobile number: name + number, then the 6-digit SMS code — no password needed */
function PhoneSignup({ onDone }) {
  const needsOtp = useSettings().data?.auth?.register_otp !== false
  const { start, register } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', password: '', password_confirmation: '', marketing_sms: false })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [left, setLeft] = useCountdown()
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const sendOtp = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Enter your name.' }); return }
    setSending(true); setErrors({})
    try {
      const res = await api.post('/auth/otp/send', { phone: localPhone(form.phone), purpose: 'register' })
      setOtpSent(true); setOtp(''); setLeft(res.resend_in ?? 60)
      toast.success(res.message)
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setErrors({ phone: err.fields?.phone || err.message }) } finally { setSending(false) }
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (needsOtp && !otpSent) { sendOtp(); return }
    if (needsOtp && otp.length !== 6) { setErrors({ otp: 'Enter the 6-digit code.' }); return }
    if (!needsOtp && form.password !== form.password_confirmation) { setErrors({ password_confirmation: 'Passwords do not match.' }); return }
    setBusy(true); setErrors({}); setError(null)
    try {
      const base = { name: form.name.trim(), phone: localPhone(form.phone), marketing_sms: form.marketing_sms }
      if (needsOtp) start(await api.post('/auth/otp/register', { ...base, otp, device_name: 'xerqo-web' }))
      else await register({ ...base, password: form.password, password_confirmation: form.password_confirmation })
      toast.success('Welcome to XERQO!')
      onDone()
    } catch (err) {
      setErrors(err.fields ?? {})
      setError(Object.keys(err.fields ?? {}).length ? null : err.message)
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormError>{error}</FormError>
      <Field label="Full name *" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
      <Field label="Mobile number *" error={errors.phone}>
        <PhoneInput value={form.phone} onChange={(phone) => { setForm((f) => ({ ...f, phone })); setOtpSent(false); setOtp('') }} invalid={!!errors.phone}
          right={needsOtp && otpSent && (
            left > 0
              ? <span className="px-4 text-xs text-mute">{mmss(left)}</span>
              : <button type="button" disabled={sending} onClick={sendOtp} className="px-4 text-xs font-semibold text-tan disabled:opacity-40">{sending ? 'Sending…' : 'Resend'}</button>
          )} />
      </Field>
      {needsOtp && otpSent && (
        <Field label="Verification code *" error={errors.otp} help={`We sent it to ${localPhone(form.phone)}`}>
          <OtpInput value={otp} onChange={setOtp} invalid={!!errors.otp} />
        </Field>
      )}
      {!needsOtp && <PasswordFields form={form} set={set} errors={errors} />}
      <Checkbox label="Send me offers & new arrivals by SMS" checked={form.marketing_sms} onChange={set('marketing_sms')} />
      <Button size="lg" className="w-full" disabled={busy || sending || !form.name || form.phone.length < 10 || (needsOtp && otpSent && otp.length !== 6)}>
        {(busy || sending) && <Loader2 className="size-4 animate-spin" />}
        {needsOtp && !otpSent ? (sending ? 'Sending code…' : 'Send OTP') : busy ? 'Creating account…' : 'Create account'}
      </Button>
      {needsOtp && <p className="text-center text-xs text-mute">No password needed — next time just sign in with a code to your phone.</p>}
    </form>
  )
}

/* Email or mobile number + password */
// digits, spaces, dashes and an optional + only, e.g. 01712345678, +880 1712-345678
const looksLikePhone = (v) => /^\+?[\d\s-]{6,}$/.test(v.trim())
const toLocalPhone = (v) => { const d = v.replace(/\D/g, ''); return d.startsWith('880') ? d.slice(2) : d.startsWith('0') ? d : `0${d}` }

function PasswordSignup({ onDone }) {
  const needsOtp = useSettings().data?.auth?.register_otp !== false
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', login: '', password: '', password_confirmation: '' })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [left, setLeft] = useCountdown()
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isPhone = looksLikePhone(form.login)
  const phoneOtp = isPhone && needsOtp // a mobile number is confirmed with an SMS code

  const sendOtp = async () => {
    setSending(true); setErrors({})
    try {
      const res = await api.post('/auth/otp/send', { phone: toLocalPhone(form.login), purpose: 'register' })
      setOtpSent(true); setOtp(''); setLeft(res.resend_in ?? 60)
      toast.success(res.message)
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setErrors({ login: err.fields?.phone || err.message }) } finally { setSending(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setErrors({ password_confirmation: 'Passwords do not match.' }); return }
    if (phoneOtp && otp.length !== 6) { setErrors({ otp: otpSent ? 'Enter the 6-digit code.' : 'Tap “Send OTP” to confirm your number first.' }); return }
    setBusy(true); setErrors({}); setError(null)
    try {
      const id = form.login.trim()
      await register({
        name: form.name.trim(),
        ...(isPhone ? { phone: toLocalPhone(id) } : { email: id }),
        password: form.password,
        password_confirmation: form.password_confirmation,
        ...(phoneOtp ? { otp } : {}),
      })
      toast.success('Welcome to XERQO!')
      onDone()
    } catch (err) {
      const f = err.fields ?? {}
      setErrors({ ...f, login: f.email || f.phone })
      setError(Object.keys(f).length ? null : err.message)
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormError>{error}</FormError>
      <Field label="Full name *" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
      <Field label="Email or mobile number *" error={errors.login} help={isPhone ? (needsOtp ? 'We’ll send a code to confirm this number.' : undefined) : undefined}>
        <div className="relative">
          <input className={cx('input', phoneOtp && 'pr-24', errors.login && 'border-rust')} autoComplete="username" placeholder="you@email.com or 01XXXXXXXXX" value={form.login}
            onChange={(e) => { set('login')(e); setOtpSent(false); setOtp('') }} />
          {phoneOtp && (
            left > 0
              ? <span className="absolute inset-y-0 right-0 flex items-center px-4 text-xs text-mute">{mmss(left)}</span>
              : <button type="button" disabled={sending} onClick={sendOtp} className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-tan disabled:opacity-40">{sending ? 'Sending…' : otpSent ? 'Resend' : 'Send OTP'}</button>
          )}
        </div>
      </Field>
      {phoneOtp && otpSent && (
        <Field label="Verification code *" error={errors.otp}><OtpInput value={otp} onChange={setOtp} invalid={!!errors.otp} /></Field>
      )}
      {phoneOtp && !otpSent && errors.otp && <p className="text-xs text-rust">{errors.otp}</p>}
      <PasswordFields form={form} set={set} errors={errors} />
      <Button size="lg" className="w-full" disabled={busy || !form.name || !form.login || !form.password}>
        {busy && <Loader2 className="size-4 animate-spin" />}{busy ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

export default function Register() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const returnTo = useReturnTo('/account')

  if (user) return <Navigate to={returnTo} replace />
  const done = () => navigate(returnTo, { replace: true })

  return (
    <AuthShell wide>
      <div className="space-y-1.5 text-center">
        <h1 className="h-display text-[30px] sm:text-[36px]">Create your account</h1>
        <p className="text-sm text-mute">Register to get started — it takes 30 seconds.</p>
      </div>

      <AuthSplit
        left={<AuthSection title="Sign up with mobile number"><PhoneSignup onDone={done} /></AuthSection>}
        right={<AuthSection title="Sign up with email or mobile"><PasswordSignup onDone={done} /></AuthSection>}
      />
      <div className="mx-auto max-w-sm space-y-4"><GoogleSection text="signup_with" onDone={done} /></div>

      <div className="space-y-2 border-t border-line pt-4 text-center text-[13px]">
        <p className="text-xs text-mute">By creating an account you agree to our <Link to="/policy" className="underline underline-offset-2">Terms &amp; Privacy Policy</Link>.</p>
        <p className="text-mute">Already have an account? <Link to="/login" className="font-semibold text-tan underline underline-offset-4">Sign in</Link></p>
      </div>
    </AuthShell>
  )
}
