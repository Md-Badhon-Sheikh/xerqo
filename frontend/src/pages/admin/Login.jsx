import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function BrandMark({ light, size = 'md' }) {
  const big = size === 'lg'
  return (
    <div className="flex items-center gap-2.5">
      <span className={big ? 'grid size-10 place-items-center rounded-lg bg-white p-1' : 'grid size-9 place-items-center'}>
        <img src="/images/logo-dark.png" alt="" className="max-h-full" />
      </span>
      <span className={`font-display text-[26px] font-semibold leading-none tracking-[0.22em] ${light ? 'text-white' : 'text-ink'}`}>XERQO</span>
      <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-espresso">ADMIN</span>
    </div>
  )
}

/* Dark photo panel shared by Login and Forgot password (desktop only) */
export function BrandPanel({ children, footer, logoOnly, className = 'lg:w-[42%] xl:w-[37.5%]' }) {
  return (
    <aside className={`relative hidden flex-col justify-between overflow-hidden bg-espresso p-10 text-white lg:flex xl:p-14 ${className}`}>
      <img src="/images/workshop.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-espresso/30 to-espresso/80" />
      <div className="relative">
        {logoOnly
          ? <span className="grid size-14 place-items-center rounded-xl bg-white p-1.5"><img src="/images/logo-dark.png" alt="XERQO" /></span>
          : <BrandMark light size="lg" />}
      </div>
      <div className="relative">{children}</div>
      <p className="relative text-xs text-white/50">{footer}</p>
    </aside>
  )
}

export default function AdminLogin() {
  const [show, setShow] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen bg-abg text-ink">
      <BrandPanel footer="© 2026 XERQO · v1.0">
        <h1 className="font-display text-[44px] font-semibold leading-[1.1] xl:text-[52px]">Run the whole store from one place.</h1>
        <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-white/75">Orders, inventory, couriers, COD reconciliation and customer insights — built for XERQO.</p>
        <div className="mt-5 grid max-w-[540px] grid-cols-3 gap-3">
          {[['938', 'Orders / 30d'], ['Tk 21.4L', 'Revenue'], ['92%', 'Delivery success']].map(([v, l]) => (
            <div key={l} className="rounded-lg bg-white/8 px-4 py-3 backdrop-blur-sm">
              <p className="text-xl font-bold text-gold">{v}</p>
              <p className="mt-0.5 text-[11px] text-white/65">{l}</p>
            </div>
          ))}
        </div>
      </BrandPanel>

      <main className="grid flex-1 place-items-center px-4 py-10 sm:px-8">
        <form
          onSubmit={(e) => { e.preventDefault(); navigate('/admin') }}
          className="w-full max-w-[420px] rounded-2xl border border-aline bg-white p-6 shadow-[0_20px_50px_-30px_rgba(35,26,21,0.35)] sm:p-9"
        >
          <div className="mb-6 lg:hidden"><BrandMark /></div>
          <h2 className="text-[22px] font-bold sm:text-2xl">Sign in to dashboard</h2>
          <p className="mt-1 text-[13px] text-amute">Use your staff email and password.</p>

          <label className="mt-6 block space-y-1.5">
            <span className="block text-xs font-semibold">Email</span>
            <input type="email" defaultValue="dip@xerqo.com" className="ainput" />
          </label>
          <label className="mt-4 block space-y-1.5">
            <span className="block text-xs font-semibold">Password</span>
            <span className="relative block">
              <input type={show ? 'text' : 'password'} defaultValue="xerqo-admin" className="ainput border-tan pr-16" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-tan">{show ? 'Hide' : 'Show'}</button>
            </span>
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked className="size-4 accent-tan" />Remember me</label>
            <Link to="/admin/forgot-password" className="text-[13px] font-semibold text-tan hover:underline">Forgot password?</Link>
          </div>

          <button className="mt-6 w-full rounded-lg bg-ink py-3 text-[13px] font-semibold text-white transition hover:bg-espresso">Sign in</button>

          <p className="mt-5 flex items-center gap-2.5 rounded-lg bg-asoft px-3.5 py-3 text-xs text-amute">
            <ShieldCheck className="size-4 shrink-0 text-tan" />2-step verification via SMS is on for all staff
          </p>
        </form>
      </main>
    </div>
  )
}
