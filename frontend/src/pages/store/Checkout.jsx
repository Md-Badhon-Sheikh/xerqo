import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Lock } from 'lucide-react'
import { cartItems, tk } from '../../data/store'
import { Button, Field, cx } from '../../components/store/ui'

/* Static checkout data — replace with the cart/checkout API later */
const FREE_DELIVERY_AT = 2000
const COUPON = { code: 'XERQO300', amount: 300 }
const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)
const STEPS = ['Cart', 'Information', 'Payment', 'Done']
const DISTRICTS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj']
const AREAS = ['Dhanmondi', 'Gulshan', 'Banani', 'Mirpur', 'Uttara', 'Mohammadpur', 'Bashundhara', 'Motijheel']
const DELIVERY = [
  { id: 'inside', label: 'Inside Dhaka', sub: '1–2 days', fee: 60 },
  { id: 'outside', label: 'Outside Dhaka', sub: '2–4 days', fee: 120 },
]
// Chip colours are static class strings so Tailwind can see them
const PAYMENTS = [
  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', chip: 'COD', chipCls: 'bg-leaf' },
  { id: 'bkash', label: 'bKash', sub: 'Instant payment · 10% cashback', chip: 'bKash', chipCls: 'bg-bkash' },
  { id: 'nagad', label: 'Nagad', sub: 'Instant payment', chip: 'Nagad', chipCls: 'bg-nagad' },
  { id: 'card', label: 'Card / Mobile Banking', sub: 'Visa, Mastercard, Rocket (SSLCommerz)', chip: 'Card', chipCls: 'bg-[#2B3240]' },
]

function Steps() {
  return (
    <ol className="no-scrollbar flex items-center gap-1.5 overflow-x-auto text-[11px] sm:gap-3 sm:text-[13px]">
      {STEPS.map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {i > 0 && <span className={cx('h-px w-3 sm:w-10', i <= 1 ? 'bg-ink' : 'bg-line')} />}
          <span className={cx('grid size-5 place-items-center rounded-full text-[10px] font-bold', i < 1 ? 'bg-leaf text-white' : i === 1 ? 'bg-ink text-white' : 'bg-sand text-mute')}>
            {i < 1 ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span className={i <= 1 ? 'font-semibold' : 'text-mute'}>{s}</span>
        </li>
      ))}
    </ol>
  )
}

const SectionTitle = ({ n, children }) => (
  <h2 className="flex items-center gap-3 font-display text-[26px] font-semibold sm:text-3xl">
    <span className="grid size-6 place-items-center rounded-full bg-ink font-sans text-xs font-bold text-white">{n}</span>{children}
  </h2>
)

function Select({ label, options, defaultValue }) {
  return (
    <Field label={label}>
      <span className="relative block">
        <select defaultValue={defaultValue} className="input appearance-none pr-10">{options.map((o) => <option key={o}>{o}</option>)}</select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
      </span>
    </Field>
  )
}

function RadioCard({ checked, onChange, title, sub, right, name }) {
  return (
    <label className={cx('flex cursor-pointer items-center gap-4 rounded border bg-white px-4 py-4 transition sm:px-5', checked ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-mute')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={cx('grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]', checked ? 'border-ink' : 'border-mute')}>
        {checked && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      <span className="flex-1"><b className="block text-sm font-semibold">{title}</b><span className="text-xs text-mute">{sub}</span></span>
      {right}
    </label>
  )
}

function Summary({ fee, total }) {
  return (
    <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
      <h2 className="h-display text-[26px] sm:text-[30px]">Order summary ({cartItems.length})</h2>
      <ul className="space-y-4">
        {cartItems.map(({ product: p, qty, variant }) => (
          <li key={p.id} className="flex items-center gap-3.5">
            <span className="relative shrink-0">
              <img src={p.image} alt="" className="size-16 rounded object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-mute text-[10px] font-bold text-white">{qty}</span>
            </span>
            <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{p.name}</b><span className="block truncate text-xs text-mute">{variant}</span></span>
            <span className="text-sm font-semibold">{tk(p.price * qty)}</span>
          </li>
        ))}
      </ul>
      <form className="flex" onSubmit={(e) => e.preventDefault()}>
        <input className="input !rounded-r-none" placeholder="Coupon code" defaultValue={COUPON.code} aria-label="Coupon code" />
        <Button variant="outline" className="!rounded-l-none border-l-0">Apply</Button>
      </form>
      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{tk(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Delivery</dt><dd className={fee ? '' : 'font-medium text-leaf'}>{fee ? tk(fee) : 'Free'}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Coupon {COUPON.code}</dt><dd className="text-tan">− {tk(COUPON.amount)}</dd></div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-[34px] font-semibold leading-none">{tk(total)}</span>
      </div>
      <Button to="/order-success" size="lg" className="w-full max-sm:hidden">Place order — {tk(total)}</Button>
      <div className="flex flex-wrap justify-center gap-1.5">
        {['bKash', 'Nagad', 'Visa', 'COD'].map((p) => <span key={p} className="rounded-sm border border-line px-2 py-0.5 text-[10px] font-semibold text-mute">{p}</span>)}
      </div>
      <p className="text-center text-xs leading-relaxed text-mute">By placing your order you agree to our <Link to="/policy" className="underline">Terms</Link> &amp; <Link to="/policy" className="underline">Return Policy</Link>. You'll receive an SMS confirmation.</p>
    </div>
  )
}

export default function Checkout() {
  const [delivery, setDelivery] = useState('inside')
  const [payment, setPayment] = useState('cod')
  const [showItems, setShowItems] = useState(false)
  const zone = DELIVERY.find((d) => d.id === delivery)
  const fee = subtotal >= FREE_DELIVERY_AT ? 0 : zone.fee
  const total = subtotal + fee - COUPON.amount

  return (
    <div className="pb-20 sm:pb-0">
      {/* Steps bar */}
      <div className="border-b border-line bg-white">
        <div className="container-x flex items-center justify-between gap-4 py-3.5">
          <Steps />
          <span className="hidden shrink-0 items-center gap-1.5 text-[13px] font-medium text-leaf sm:flex"><Lock className="size-3.5" /> Secure checkout</span>
        </div>
      </div>

      <section className="container-x grid items-start gap-8 pb-14 pt-5 sm:pt-10 lg:grid-cols-[1fr_400px] lg:gap-12 lg:pb-20 xl:grid-cols-[1fr_460px]">
        <div className="min-w-0 space-y-8 sm:space-y-10">
          {/* Mobile: collapsible order summary */}
          <div className="rounded border border-line bg-white lg:hidden">
            <button onClick={() => setShowItems(!showItems)} className="flex w-full items-center justify-between px-4 py-3.5 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-tan"><ChevronDown className={cx('size-4 transition', showItems && 'rotate-180')} /> {showItems ? 'Hide' : 'Show'} order summary ({cartItems.length})</span>
              <b>{tk(total)}</b>
            </button>
            {showItems && (
              <ul className="space-y-3 border-t border-line px-4 py-3.5">
                {cartItems.map(({ product: p, variant }) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm"><img src={p.image} alt="" className="size-12 rounded object-cover" /><span className="flex-1"><b className="block font-semibold">{p.name}</b><span className="text-xs text-mute">{variant}</span></span>{tk(p.price)}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="h-display text-[34px] max-sm:hidden sm:text-5xl lg:text-[56px]">Checkout</h1>
            <p className="eyebrow !text-mute">Express checkout</p>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button className="rounded bg-bkash py-3.5 text-sm font-semibold text-white transition hover:opacity-90">Pay with bKash</button>
              <button className="rounded bg-nagad py-3.5 text-sm font-semibold text-white transition hover:opacity-90">Pay with Nagad</button>
            </div>
          </div>

          {/* 1. Contact */}
          <fieldset className="space-y-4">
            <SectionTitle n={1}>Contact</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *" defaultValue="Rahim Uddin" autoComplete="name" />
              <Field label="Mobile number *" placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" help="We'll call this number to confirm your order" />
              <Field label="Email (optional)" type="email" placeholder="For order updates" className="sm:col-span-2" />
            </div>
          </fieldset>

          {/* 2. Delivery */}
          <fieldset className="space-y-4">
            <SectionTitle n={2}>Delivery address</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="District *" options={DISTRICTS} defaultValue="Dhaka" />
              <Select label="Area / Thana *" options={AREAS} defaultValue="Dhanmondi" />
              <Field label="Full address *" placeholder="House, road, block, landmark" className="sm:col-span-2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY.map((d) => (
                <RadioCard key={d.id} name="delivery" checked={delivery === d.id} onChange={() => setDelivery(d.id)} title={d.label} sub={d.sub} right={<b className="text-sm">{tk(d.fee)}</b>} />
              ))}
            </div>
          </fieldset>

          {/* 3. Payment */}
          <fieldset className="space-y-4">
            <SectionTitle n={3}>Payment method</SectionTitle>
            <div className="space-y-3">
              {PAYMENTS.map((m) => (
                <RadioCard key={m.id} name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} title={m.label} sub={m.sub}
                  right={<span className={cx('rounded px-2.5 py-1 text-[11px] font-bold text-white', m.chipCls)}>{m.chip}</span>} />
              ))}
            </div>
            <Field label="Order note (optional)">
              <textarea rows={3} className="input resize-none" placeholder="Special instruction for delivery or engraving" />
            </Field>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28"><Summary fee={fee} total={total} /></aside>
      </section>

      {/* Mobile sticky place-order bar above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[70px] z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
        <Button to="/order-success" className="w-full !py-3.5">Place order · {tk(total)}</Button>
      </div>
    </div>
  )
}
