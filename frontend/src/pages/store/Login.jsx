import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
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

export const PasswordInput = ({ placeholder = 'Password', error, ...input }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} placeholder={placeholder} className={cx('input pr-16', error && 'border-rust')} {...input} />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 flex items-center gap-1 px-4 text-xs font-semibold text-tan" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

// +880 prefix input; value is the local number as typed (01712345678 or 1712345678)
export const PhoneInput = ({ value, onChange, invalid, disabled, right, ...rest }) => (
  <div className={cx('flex items-center rounded border-[1.5px] bg-white focus-within:ring-1 focus-within:ring-ink', invalid ? 'border-rust' : 'border-ink', disabled && 'opacity-70')}>
    <span className="flex items-center gap-1.5 border-r border-line py-1 pl-4 pr-3 text-sm font-semibold"><span className="text-base leading-none">🇧🇩</span>+880</span>
    <input inputMode="tel" autoComplete="tel-national" placeholder="1XXX-XXXXXX" value={value} disabled={disabled}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-mute" {...rest} />
    {right}
  </div>
)

// "1712345678" | "01712345678" -> "01712345678"
export const localPhone = (v) => (v.startsWith('0') ? v : `0${v}`)

/* Sign in with an SMS code (also used in the login popup on the product page) */
export function OtpLogin({ onDone }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState({})
  const [left, setLeft] = useCountdown()
  const { start } = useAuth()

  const send = async (e) => {
    e?.preventDefault()
    setBusy(true); setError({})
    try {
      const res = await api.post('/auth/otp/send', { phone: localPhone(phone), purpose: 'login' })
      setSent(true); setCode(''); setLeft(res.resend_in ?? 60)
      toast.success(res.message)
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setError({ phone: err.fields?.phone || err.message }) } finally { setBusy(false) }
  }
  const verify = async (c = code) => {
    if (c.length !== 6) return
    setBusy(true); setError({})
    try {
      start(await api.post('/auth/otp/login', { phone: localPhone(phone), otp: c, device_name: 'xerqo-web' }))
      onDone()
    } catch (err) { setError({ otp: err.fields?.otp || err.fields?.phone || err.message }); setBusy(false) }
  }

  return (
    <form className="space-y-5" onSubmit={sent ? (e) => { e.preventDefault(); verify() } : send} noValidate>
      <Field label="Mobile number" error={error.phone}>
        <PhoneInput value={phone} onChange={(v) => { setPhone(v); if (sent) setSent(false) }} invalid={!!error.phone} />
      </Field>
      {sent && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold">Enter OTP</span>
            {left > 0 ? <span className="text-xs text-mute">Resend in {mmss(left)}</span> : <button type="button" onClick={send} className="text-xs font-semibold text-tan">Resend code</button>}
          </div>
          <OtpInput value={code} onChange={setCode} onComplete={verify} invalid={!!error.otp} />
          {error.otp && <p className="text-xs text-rust">{error.otp}</p>}
        </div>
      )}
      <Button size="lg" className="w-full" disabled={busy || phone.length < 10 || (sent && code.length !== 6)}>
        {busy && <Loader2 className="size-4 animate-spin" />}{sent ? 'Verify & continue' : 'Send code'}
      </Button>
    </form>
  )
}

export default function Login() {
  const otpEnabled = useSettings().data?.auth?.otp_login !== false
  const [form, setForm] = useState({ login: '', password: '', remember: true })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const returnTo = useReturnTo('/account')

  if (user) return <Navigate to={returnTo} replace />

  const done = () => navigate(returnTo, { replace: true })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form)
      done()
    } catch (err) {
      setError(err.fields?.login || err.message)
      setBusy(false)
    }
  }

  const passwordForm = (
    <AuthSection title="Sign in with password">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormError>{error}</FormError>
        <Field label="Phone or email" placeholder="01XXXXXXXXX or you@email.com" autoComplete="username" value={form.login} onChange={set('login')} />
        <Field label="Password"><PasswordInput autoComplete="current-password" value={form.password} onChange={set('password')} /></Field>
        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" checked={form.remember} onChange={set('remember')} />
          <Link to="/forgot-password" className="text-[13px] font-semibold text-tan hover:underline">Forgot password?</Link>
        </div>
        <Button size="lg" variant="outline" className="w-full" disabled={busy || !form.login || !form.password}>
          {busy && <Loader2 className="size-4 animate-spin" />}{busy ? 'Signing in…' : 'Login'}
        </Button>
      </form>
    </AuthSection>
  )

  return (
    <AuthShell wide={otpEnabled}>
      <div className="space-y-1.5 text-center">
        <h1 className="h-display text-[32px] sm:text-[38px]">Sign in</h1>
        <p className="text-sm leading-relaxed text-mute">Welcome back — access your XERQO account securely.</p>
      </div>

      {otpEnabled
        ? <AuthSplit left={<AuthSection title="Sign in with mobile number"><OtpLogin onDone={done} /></AuthSection>} right={passwordForm} />
        : passwordForm}
      <div className="mx-auto max-w-sm space-y-4"><GoogleSection onDone={done} /></div>

      <p className="border-t border-line pt-4 text-center text-[13px] text-mute">Don’t have an account? <Link to="/register" className="font-semibold text-tan underline underline-offset-4">Create an account</Link></p>
    </AuthShell>
  )
}
