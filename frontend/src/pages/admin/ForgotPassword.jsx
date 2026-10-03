import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, ShieldAlert } from 'lucide-react'
import { cx } from '../../components/admin/ui'
import { OtpInput, mmss } from '../../components/store/OtpInput'
import { usePasswordReset } from '../../components/common/usePasswordReset'
import { BrandMark, BrandPanel } from './Login'

const STEPS = ['Identify', 'Verify OTP', 'New password']

function Steps({ active }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {i > 0 && <span className="h-px w-3 shrink-0 bg-aline sm:w-4" />}
          <span className={cx('grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold', i <= active ? 'bg-tan text-white' : 'bg-asoft text-amute')}>
            {i < active ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cx('whitespace-nowrap text-[11px] sm:text-xs', i === active ? 'font-semibold' : i < active ? 'text-ink' : 'text-amute')}>{s}</span>
        </li>
      ))}
    </ol>
  )
}

const Btn = ({ busy, children, ...p }) => (
  <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-[13px] font-semibold text-white transition hover:bg-espresso disabled:opacity-60" {...p}>
    {busy && <Loader2 className="size-4 animate-spin" />}{children}
  </button>
)
const Err = ({ children }) => (children ? <p role="alert" className="mt-2 text-xs text-bad">{children}</p> : null)

export default function AdminForgotPassword() {
  const r = usePasswordReset('admin')
  return (
    <div className="flex min-h-screen bg-espresso text-ink lg:bg-abg">
      <BrandPanel logoOnly footer="XERQO Admin · secure staff access" className="lg:w-[46%]">
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] xl:text-[46px]">Every stitch, accounted for.</h1>
      </BrandPanel>

      <main className="grid flex-1 place-items-center px-4 py-10 sm:px-8">
        <form noValidate onSubmit={(e) => { e.preventDefault(); if (r.step === 1) r.send(); else if (r.step === 2) r.reset() }}
          className="w-full min-w-0 max-w-[440px] rounded-2xl border border-aline bg-white p-5 sm:p-9 lg:shadow-[0_20px_50px_-30px_rgba(35,26,21,0.35)]">
          <BrandMark />
          <div className="mt-5"><Steps active={r.step - 1} /></div>

          {r.step === 1 && (
            <>
              <h2 className="mt-6 text-[22px] font-bold sm:text-2xl">Forgot your password?</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-amute">Enter your staff email or mobile number. We’ll send a 6-digit code to the phone on your account.</p>
              <label className="mt-5 block space-y-1.5">
                <span className="block text-xs font-semibold">Email or mobile</span>
                <input className={cx('ainput', r.errors.identifier && '!border-bad')} autoComplete="username" value={r.identifier} onChange={(e) => r.setIdentifier(e.target.value)} placeholder="you@xerqo.com" />
              </label>
              <Err>{r.errors.identifier}</Err>
              <Btn busy={r.busy} disabled={r.busy || r.identifier.trim().length < 5}>Send code</Btn>
            </>
          )}

          {r.step === 2 && (
            <>
              <h2 className="mt-6 text-[22px] font-bold sm:text-2xl">Reset your password</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-amute">Enter the code sent for <b className="text-ink">{r.identifier}</b> and choose a new password.</p>
              <OtpInput className="mt-5" value={r.code} onChange={r.setCode} invalid={!!r.errors.otp} />
              <Err>{r.errors.otp}</Err>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-amute">Didn’t get it?</span>
                {r.left > 0 ? <span className="font-semibold text-tan">Resend in {mmss(r.left)}</span> : <button type="button" onClick={r.send} className="font-semibold text-tan hover:underline">Resend code</button>}
              </div>
              <label className="mt-4 block space-y-1.5"><span className="block text-xs font-semibold">New password</span>
                <input type="password" className={cx('ainput', r.errors.password && '!border-bad')} autoComplete="new-password" value={r.password} onChange={(e) => r.setPassword(e.target.value)} placeholder="Min. 8 characters" />
              </label>
              <Err>{r.errors.password}</Err>
              <label className="mt-3 block space-y-1.5"><span className="block text-xs font-semibold">Confirm password</span>
                <input type="password" className={cx('ainput', r.errors.password_confirmation && '!border-bad')} autoComplete="new-password" value={r.confirm} onChange={(e) => r.setConfirm(e.target.value)} />
              </label>
              <Err>{r.errors.password_confirmation}</Err>
              <Btn busy={r.busy} disabled={r.busy || r.code.length !== 6 || r.password.length < 8}>Reset password</Btn>
            </>
          )}

          {r.step === 3 && (
            <div className="mt-6 space-y-3 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-ok/12 text-ok"><Check className="size-6" /></span>
              <h2 className="text-[22px] font-bold">Password updated</h2>
              <p className="text-[13px] text-amute">Sign in with your new password. All other sessions were signed out.</p>
              <Link to="/admin/login" className="mt-2 block w-full rounded-lg bg-ink py-3 text-[13px] font-semibold text-white hover:bg-espresso">Go to sign in</Link>
            </div>
          )}

          {r.step !== 3 && (
            <Link to="/admin/login" className="mt-4 flex items-center justify-center gap-2 text-[13px] font-medium text-amute hover:text-ink">
              <ArrowLeft className="size-3.5" />Back to admin login
            </Link>
          )}

          <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-amber/8 px-3.5 py-3 text-xs leading-relaxed text-amber">
            <ShieldAlert className="mt-px size-4 shrink-0" />Reset codes expire after 10 minutes. Every reset signs out all other sessions.
          </p>
        </form>
      </main>
    </div>
  )
}
