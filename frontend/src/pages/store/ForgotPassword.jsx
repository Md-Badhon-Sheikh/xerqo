import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, cx } from '../../components/store/ui'
import { OtpBoxes, PasswordInput } from './Login'

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
  const [step, setStep] = useState(2)
  return (
    <AuthShell photo="/images/fb-passport-hand.jpg" quote="Locked out? We’ll get you back in under a minute.">
      <Steps current={step} />

      {step === 1 && (
        <>
          <div className="space-y-1.5">
            <h1 className="h-display text-[30px] sm:text-[38px]">Forgot password?</h1>
            <p className="text-sm text-mute">Enter the mobile number or email on your account and we’ll send you a 6-digit code.</p>
          </div>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setStep(2) }}>
            <Field label="Mobile number or email" placeholder="01712-XXXXXX or you@email.com" />
            <Button size="lg" className="w-full">Send code</Button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="space-y-1.5">
            <h1 className="h-display text-[30px] sm:text-[38px]">Reset your password</h1>
            <p className="text-sm text-mute">Enter the 6-digit code we sent to <span className="whitespace-nowrap">+880 1712-XXXXXX</span>.</p>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(3) }}>
            <OtpBoxes value="4829" />
            <p className="flex items-center justify-between text-[13px]">
              <span className="text-mute">Didn’t get it?</span>
              <button type="button" className="font-semibold text-tan">Resend in 0:38</button>
            </p>
            <Field label="New password"><PasswordInput defaultValue="Leather25" /></Field>
            <Field label="Confirm password" type="password" defaultValue="Leather25" help="✓ Passwords match" />
            <Button size="lg" className="w-full">Reset password</Button>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="space-y-4 py-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-leaf/12 text-leaf"><Check className="size-7" /></span>
          <h1 className="h-display text-[30px] sm:text-[36px]">Password updated</h1>
          <p className="text-sm text-mute">You can now sign in with your new password.</p>
          <Button to="/login" size="lg" className="w-full">Sign in</Button>
        </div>
      )}

      <div className="text-center">
        {step > 1 && step < 3 ? (
          <button onClick={() => setStep(1)} className="mr-5 text-[13px] text-mute hover:text-ink">Change number</button>
        ) : null}
        <Link to="/login" className="inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"><ArrowLeft className="size-3.5" /> Back to sign in</Link>
      </div>
    </AuthShell>
  )
}
