import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'

export const AuthTabs = ({ active }) => (
  <div className="grid grid-cols-2 border-b border-line text-center text-sm font-medium sm:text-[15px]">
    {[['Sign in', '/login'], ['Create account', '/register']].map(([t, to]) => (
      <Link key={t} to={to} className={cx('-mb-px border-b-2 pb-3', active === t ? 'border-ink text-ink' : 'border-transparent text-mute hover:text-ink')}>{t}</Link>
    ))}
  </div>
)

export const OrDivider = () => (
  <div className="flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
)

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="size-4 sm:hidden" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.4-1.66 4.1-5.4 4.1-3.25 0-5.9-2.7-5.9-6s2.65-6 5.9-6c1.85 0 3.1.8 3.8 1.47l2.6-2.5C16.74 3.6 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.43 0 9.03-3.82 9.03-9.2 0-.62-.07-1.09-.15-1.56H12Z" />
  </svg>
)
const FacebookMark = () => (
  <svg viewBox="0 0 24 24" className="size-4 sm:hidden" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.8-4.67 4.54-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z" /></svg>
)

export const SocialButtons = ({ verb = 'Continue' }) => (
  <div className="grid gap-2.5 sm:grid-cols-2">
    <button className="flex items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-white px-2 py-3 text-[13px] font-semibold transition hover:border-ink"><GoogleMark />{verb} with Google</button>
    <button className="flex items-center justify-center gap-2 whitespace-nowrap rounded border border-line bg-white px-2 py-3 text-[13px] font-semibold transition hover:border-ink"><FacebookMark />{verb} with Facebook</button>
  </div>
)

// 6-digit OTP boxes (static demo: first few digits filled, next one focused)
export const OtpBoxes = ({ value = '482', className }) => (
  <div className={cx('grid grid-cols-6 gap-2 sm:gap-3', className)}>
    {Array.from({ length: 6 }).map((_, i) => (
      <input key={i} inputMode="numeric" maxLength={1} defaultValue={value[i] || ''} aria-label={`Digit ${i + 1}`}
        className={cx('aspect-square w-full min-w-0 rounded border bg-white text-center text-lg font-semibold outline-none transition focus:border-ink sm:text-xl', i === value.length ? 'border-ink border-[1.5px]' : 'border-line')} />
    ))}
  </div>
)

export const PasswordInput = ({ placeholder = 'Password', defaultValue }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} defaultValue={defaultValue} placeholder={placeholder} className="input pr-16" />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 flex items-center gap-1 px-4 text-xs font-semibold text-tan" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

const PhoneInput = () => (
  <div className="flex items-center rounded border-[1.5px] border-ink bg-white focus-within:ring-1 focus-within:ring-ink">
    <span className="flex items-center gap-1.5 border-r border-line py-1 pl-4 pr-3 text-sm font-semibold"><span className="text-base leading-none">🇧🇩</span>+880</span>
    <input inputMode="tel" placeholder="1XXX-XXXXXX" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-mute" />
  </div>
)

export default function Login() {
  const [mode, setMode] = useState('otp')
  return (
    <AuthShell photo="/images/tools-flat.jpg" quote="Early access to drops, free engraving & faster checkout.">
      <AuthTabs active="Sign in" />
      <div className="space-y-1.5">
        <h1 className="h-display text-[32px] sm:text-[38px]">Welcome back</h1>
        <p className="text-sm leading-relaxed text-mute">
          {mode === 'otp' ? 'Sign in with your mobile number — we’ll send a 6-digit code.' : 'Sign in with your phone or email and password.'}
        </p>
      </div>

      {mode === 'otp' ? (
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Field label="Mobile number"><PhoneInput /></Field>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]"><span className="font-semibold">Enter OTP</span><span className="text-xs text-mute">Resend in 0:42</span></div>
            <OtpBoxes />
          </div>
          <Button size="lg" className="w-full">Verify &amp; continue</Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Field label="Phone or email" placeholder="01XXXXXXXXX or you@email.com" />
          <Field label="Password"><PasswordInput /></Field>
          <div className="flex items-center justify-between gap-3">
            <Checkbox label="Remember me" defaultChecked />
            <Link to="/forgot-password" className="text-[13px] font-semibold text-tan hover:underline">Forgot password?</Link>
          </div>
          <Button size="lg" className="w-full">Login</Button>
        </form>
      )}

      <OrDivider />
      <SocialButtons />
      <div className="space-y-2 text-center text-[13px]">
        <button onClick={() => setMode(mode === 'otp' ? 'password' : 'otp')} className="font-semibold text-tan underline underline-offset-4">
          {mode === 'otp' ? 'Prefer email? Sign in with email & password' : 'Sign in with a one-time code instead'}
        </button>
        <p className="text-mute">New to XERQO? <Link to="/register" className="font-semibold text-ink hover:underline">Create an account</Link></p>
      </div>
    </AuthShell>
  )
}
