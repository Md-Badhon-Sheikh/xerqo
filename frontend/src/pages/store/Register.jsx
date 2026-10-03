import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useReturnTo } from '../../components/common/guards'
import { FormError } from '../../components/common/feedback'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import Select2 from '../../components/common/Select2'
import { AuthTabs, OrDivider, SocialButtons, PasswordInput } from './Login'

const DISTRICTS = ['Dhaka', 'Chattogram', 'Gazipur', 'Narayanganj', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla']

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
  const [gender, setGender] = useState('Male')
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', password_confirmation: '', terms: true })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const returnTo = useReturnTo('/account')

  if (user) return <Navigate to={returnTo} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setErrors({ password_confirmation: 'Passwords do not match.' }); return }
    setBusy(true)
    setErrors({})
    setError(null)
    try {
      const { terms: _terms, ...payload } = form
      await register(payload)
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
        <p className="text-sm text-mute">Takes 30 seconds. We’ll verify your mobile with an OTP.</p>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormError>{error}</FormError>
        <Field label="Full name *" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Mobile number *" error={errors.phone}>
          <div className={cx('flex items-center rounded border-[1.5px] bg-white', errors.phone ? 'border-rust' : 'border-ink')}>
            <span className="pl-4 text-sm font-semibold">+880</span>
            <input inputMode="tel" autoComplete="tel-national" placeholder="1712-XXXXXX" value={form.phone} onChange={set('phone')} className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-mute" />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email (optional)" type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={set('email')} error={errors.email} />
          <Field label="District">
            <Select2 variant="store" search defaultValue="Dhaka" options={DISTRICTS} aria-label="District" />
          </Field>
        </div>
        <Field label="Password *" error={errors.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} /></Field>
        <Strength level={strength(form.password)} />
        <Field label="Confirm password *" error={errors.password_confirmation}><PasswordInput autoComplete="new-password" placeholder="Re-enter password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} /></Field>

        <div className="flex flex-wrap gap-2">
          {['Male', 'Female', 'Prefer not to say'].map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)} className={cx('rounded-full border px-3.5 py-2 text-xs font-medium transition', gender === g ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{g}</button>
          ))}
        </div>

        <div className="space-y-2.5">
          <Checkbox label={<span>I agree to the <Link to="/policy" className="underline underline-offset-2">Terms &amp; Privacy Policy</Link></span>} checked={form.terms} onChange={set('terms')} />
          <Checkbox label="Send me offers & new arrivals by SMS" />
        </div>
        <Button size="lg" className="w-full" disabled={busy || !form.terms || !form.name || !form.phone || !form.password}>
          {busy && <Loader2 className="size-4 animate-spin" />}{busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <OrDivider />
      <SocialButtons verb="Sign up" />
      <p className="text-center text-[13px] font-semibold text-tan">Already have an account? <Link to="/login" className="underline underline-offset-4">Sign in</Link></p>
    </AuthShell>
  )
}
