import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ShieldAlert } from 'lucide-react'
import { cx } from '../../components/admin/ui'
import { BrandMark, BrandPanel } from './Login'

const STEPS = ['Identify', 'Verify OTP', 'New password']
const ACTIVE = 1

function Steps() {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {i > 0 && <span className="h-px w-3 shrink-0 bg-aline sm:w-4" />}
          <span className={cx('grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold',
            i < ACTIVE ? 'bg-tan text-white' : i === ACTIVE ? 'bg-tan text-white' : 'bg-asoft text-amute')}>
            {i < ACTIVE ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={cx('whitespace-nowrap text-[11px] sm:text-xs', i === ACTIVE ? 'font-semibold' : i < ACTIVE ? 'text-ink' : 'text-amute')}>{s}</span>
        </li>
      ))}
    </ol>
  )
}

export default function AdminForgotPassword() {
  const navigate = useNavigate()
  const [secs, setSecs] = useState(42)
  useEffect(() => {
    if (secs <= 0) return
    const t = setTimeout(() => setSecs(secs - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])
  const code = ['4', '8', '2', '7', '', '']

  return (
    <div className="flex min-h-screen bg-espresso text-ink lg:bg-abg">
      <BrandPanel logoOnly footer="XERQO Admin · secure staff access" className="lg:w-[46%]">
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] xl:text-[46px]">Every stitch, accounted for.</h1>
      </BrandPanel>

      <main className="grid flex-1 place-items-center px-4 py-10 sm:px-8">
        <form
          onSubmit={(e) => { e.preventDefault(); navigate('/admin/login') }}
          className="w-full min-w-0 max-w-[440px] rounded-2xl border border-aline bg-white p-5 sm:p-9 lg:shadow-[0_20px_50px_-30px_rgba(35,26,21,0.35)]"
        >
          <BrandMark />
          <div className="mt-5"><Steps /></div>

          <h2 className="mt-6 text-[22px] font-bold sm:text-2xl">Reset your password</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-amute">We sent a 6-digit code to +880 1XXX-XXXX45 and dip@xerqo.com</p>

          <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-2.5">
            {code.map((d, i) => (
              <input
                key={i}
                inputMode="numeric"
                maxLength={1}
                defaultValue={d}
                autoFocus={i === 4}
                aria-label={`Digit ${i + 1}`}
                className={cx('aspect-square w-full min-w-0 rounded-lg border bg-white text-center text-lg font-bold outline-none transition focus:border-tan focus:ring-1 focus:ring-tan sm:text-xl',
                  i === 4 ? 'border-tan' : 'border-aline')}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-amute">Didn’t get it?</span>
            {secs > 0
              ? <span className="font-semibold text-tan">Resend in 00:{String(secs).padStart(2, '0')}</span>
              : <button type="button" onClick={() => setSecs(60)} className="font-semibold text-tan hover:underline">Resend code</button>}
          </div>

          <button className="mt-5 w-full rounded-lg bg-ink py-3 text-[13px] font-semibold text-white transition hover:bg-espresso">Verify &amp; continue</button>

          <Link to="/admin/login" className="mt-4 flex items-center justify-center gap-2 text-[13px] font-medium text-amute hover:text-ink">
            <ArrowLeft className="size-3.5" />Back to admin login
          </Link>

          <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-amber/8 px-3.5 py-3 text-xs leading-relaxed text-amber">
            <ShieldAlert className="mt-px size-4 shrink-0" />For security, the store owner is notified of every password reset.
          </p>
        </form>
      </main>
    </div>
  )
}
