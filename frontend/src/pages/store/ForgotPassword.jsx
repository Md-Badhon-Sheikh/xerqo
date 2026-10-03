import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, cx } from '../../components/store/ui'
import { OtpInput, mmss } from '../../components/store/OtpInput'
import { usePasswordReset } from '../../components/common/usePasswordReset'
import { PasswordInput } from './Login'

const STEPS = ['Mobile', 'Verify OTP', 'New password']

function Steps({ current }) {
  return (
    <ol className="flex items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
      {STEPS.map((s, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <Fragment key={s}>
            {i > 0 && <span className="h-px w-3 shrink-0 bg-line sm:w-5" />}
            <li className={cx('flex min-w-0 items-center gap-1.5', active ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-mute')}>
              <span className={cx('grid h-5 shrink-0 place-items-center rounded-full text-[10px] font-bold', done ? 'w-6 bg-ink text-white' : active ? 'w-5 bg-ink text-white' : 'w-5 bg-sand text-mute')}>
                {done ? <Check className="size-3" strokeWidth={3} /> : n}
              </span>
              <span className="truncate">{s}</span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

export default function ForgotPassword() {
  const r = usePasswordReset('customer')
  return (
    <AuthShell photo="/images/fb-passport-hand.jpg" quote="Locked out? We’ll get you back in under a minute.">
      <Steps current={r.step === 3 ? 4 : r.step} />

      {r.step === 1 && (
        <>
          <div className="space-y-1.5">
            <h1 className="h-display text-[30px] sm:text-[38px]">Forgot password?</h1>
            <p className="text-sm text-mute">Enter the mobile number or email on your account and we’ll send you a 6-digit code.</p>
          </div>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); r.send() }} noValidate>
            <Field label="Mobile number or email" placeholder="01712-XXXXXX or you@email.com" autoComplete="username" value={r.identifier} onChange={(e) => r.setIdentifier(e.target.value)} error={r.errors.identifier} />
            <Button size="lg" className="w-full" disabled={r.busy || r.identifier.trim().length < 5}>{r.busy && <Loader2 className="size-4 animate-spin" />}Send code</Button>
          </form>
        </>
      )}

      {r.step === 2 && (
        <>
          <div className="space-y-1.5">
            <h1 className="h-display text-[30px] sm:text-[38px]">Reset your password</h1>
            <p className="text-sm text-mute">Enter the 6-digit code we sent to <b className="whitespace-nowrap text-ink">{r.identifier}</b>, then choose a new password.</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); r.reset() }} noValidate>
            <OtpInput value={r.code} onChange={r.setCode} invalid={!!r.errors.otp} />
            {r.errors.otp && <p className="text-xs text-rust">{r.errors.otp}</p>}
            <p className="flex items-center justify-between text-[13px]">
              <span className="text-mute">Didn’t get it?</span>
              {r.left > 0 ? <span className="text-mute">Resend in {mmss(r.left)}</span> : <button type="button" onClick={r.send} className="font-semibold text-tan">Resend code</button>}
            </p>
            <Field label="New password" error={r.errors.password}><PasswordInput autoComplete="new-password" placeholder="Min. 8 characters" value={r.password} onChange={(e) => r.setPassword(e.target.value)} error={r.errors.password} /></Field>
            <Field label="Confirm password" type="password" autoComplete="new-password" value={r.confirm} onChange={(e) => r.setConfirm(e.target.value)} error={r.errors.password_confirmation}
              help={r.confirm && r.confirm === r.password ? '✓ Passwords match' : undefined} />
            <Button size="lg" className="w-full" disabled={r.busy || r.code.length !== 6 || r.password.length < 8}>{r.busy && <Loader2 className="size-4 animate-spin" />}Reset password</Button>
          </form>
        </>
      )}

      {r.step === 3 && (
        <div className="space-y-4 py-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-leaf/12 text-leaf"><Check className="size-7" /></span>
          <h1 className="h-display text-[30px] sm:text-[36px]">Password updated</h1>
          <p className="text-sm text-mute">You can now sign in with your new password. Other devices were signed out.</p>
          <Button to="/login" size="lg" className="w-full">Sign in</Button>
        </div>
      )}

      <div className="text-center">
        {r.step === 2 && <button onClick={() => r.setStep(1)} className="mr-5 text-[13px] text-mute hover:text-ink">Change number</button>}
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
      </div>
    </AuthShell>
  )
}
