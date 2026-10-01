import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { cartItems, tk } from '../../data/store'
import { Breadcrumb, Button, Qty, cx } from '../../components/store/ui'

/* Static cart maths — replace with the cart API response later */
const FREE_DELIVERY_AT = 2000
const COUPON = { code: 'XERQO300', amount: 300 }
const ZONES = [{ id: 'inside', label: 'Inside Dhaka', fee: 60 }, { id: 'outside', label: 'Outside Dhaka', fee: 120 }]
const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)
const itemCount = cartItems.reduce((s, i) => s + i.qty, 0)

const PayChips = () => (
  <div className="flex flex-wrap justify-center gap-1.5">
    {['bKash', 'Nagad', 'Visa', 'COD'].map((p) => <span key={p} className="rounded-sm border border-line px-2 py-0.5 text-[10px] font-semibold text-mute">{p}</span>)}
  </div>
)

function FreeDeliveryBar() {
  const left = Math.max(0, FREE_DELIVERY_AT - subtotal)
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_AT) * 100)
  return (
    <div className="space-y-2.5 rounded bg-sand px-4 py-3.5 sm:px-5">
      <p className="flex items-center gap-2 text-[13px] font-medium sm:text-sm">
        <Truck className="size-4 text-leaf" />
        {left > 0 ? <>You're <b>{tk(left)}</b> away from free delivery</> : <>You've unlocked <b className="text-leaf">free delivery</b> 🎉</>}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-leaf" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function LineItem({ item: { product: p, qty, variant } }) {
  const links = (
    <span className="flex gap-3 text-xs text-tan">
      <button className="underline underline-offset-2">Remove</button>
      <button className="underline underline-offset-2 max-sm:hidden">Save for later</button>
    </span>
  )
  return (
    <div className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[110px_1fr] md:grid-cols-[110px_1fr_110px_120px_100px] md:items-center md:gap-5">
      <Link to={`/product/${p.slug}`} className="block aspect-[110/124] overflow-hidden rounded bg-tile">
        <img src={p.image} alt={p.name} className="size-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <Link to={`/product/${p.slug}`} className="font-display text-lg font-semibold leading-tight hover:text-tan sm:text-[22px]">{p.name}</Link>
        <p className="text-xs text-mute sm:text-[13px]">{variant}</p>
        <p className="flex items-baseline gap-2 md:hidden"><b className="text-[15px]">{tk(p.price)}</b>{p.oldPrice && <span className="text-xs text-mute line-through">{tk(p.oldPrice)}</span>}</p>
        <div className="mt-1 flex items-center justify-between md:hidden"><Qty value={qty} small />{links}</div>
        <div className="mt-1 max-md:hidden">{links}</div>
      </div>
      <p className="flex flex-col max-md:hidden"><b className="text-[15px]">{tk(p.price)}</b>{p.oldPrice && <span className="text-xs text-mute line-through">{tk(p.oldPrice)}</span>}</p>
      <div className="max-md:hidden"><Qty value={qty} small /></div>
      <b className="text-right text-base max-md:hidden">{tk(p.price * qty)}</b>
    </div>
  )
}

function Summary({ zone, setZone }) {
  const fee = subtotal >= FREE_DELIVERY_AT ? 0 : ZONES.find((z) => z.id === zone).fee
  const total = subtotal + fee - COUPON.amount
  return (
    <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
      <h2 className="h-display text-[28px] sm:text-[32px]">Order summary</h2>
      <form className="flex" onSubmit={(e) => e.preventDefault()}>
        <input className="input !rounded-r-none" placeholder="Coupon code" defaultValue={COUPON.code} aria-label="Coupon code" />
        <Button variant="outline" className="!rounded-l-none border-l-0">Apply</Button>
      </form>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold">Delivery area</p>
        <div className="grid grid-cols-2 gap-2">
          {ZONES.map((z) => (
            <button key={z.id} onClick={() => setZone(z.id)} className={cx('rounded border px-3 py-2.5 text-left text-xs transition', zone === z.id ? 'border-ink bg-cream' : 'border-line hover:border-mute')}>
              <b className="block text-[13px]">{z.label}</b><span className="text-mute">{tk(z.fee)} · {z.id === 'inside' ? '1–2' : '2–4'} days</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Subtotal ({itemCount} items)</dt><dd>{tk(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Delivery ({ZONES.find((z) => z.id === zone).label})</dt><dd className={fee ? '' : 'font-medium text-leaf'}>{fee ? tk(fee) : 'Free'}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Coupon {COUPON.code}</dt><dd className="text-tan">− {tk(COUPON.amount)}</dd></div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-[34px] font-semibold leading-none">{tk(total)}</span>
      </div>
      <Button to="/checkout" size="lg" className="w-full">Proceed to checkout</Button>
      <PayChips />
      <ul className="grid gap-2.5 border-t border-line pt-4 text-xs text-mute">
        {[[ShieldCheck, '100% genuine leather, 1-year warranty'], [RotateCcw, '7-day easy return & free exchange'], [BadgeCheck, 'Cash on Delivery available nationwide']].map(([Icon, t]) => (
          <li key={t} className="flex items-center gap-2"><Icon className="size-4 text-tan" strokeWidth={1.7} />{t}</li>
        ))}
      </ul>
    </div>
  )
}

export default function Cart() {
  const [zone, setZone] = useState('inside')
  const total = subtotal + (subtotal >= FREE_DELIVERY_AT ? 0 : ZONES.find((z) => z.id === zone).fee) - COUPON.amount
  return (
    <div className="pb-20 sm:pb-0">
      <section className="container-x space-y-2 pb-14 pt-5 sm:pt-10 lg:pb-20">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <h1 className="h-display text-[34px] sm:text-5xl lg:text-[56px]">Your cart ({cartItems.length})</h1>

        <div className="grid items-start gap-8 pt-4 sm:pt-6 lg:grid-cols-[1fr_400px] lg:gap-10 xl:grid-cols-[1fr_420px]">
          <div className="min-w-0">
            <FreeDeliveryBar />
            <div className="mt-6 hidden grid-cols-[110px_1fr_110px_120px_100px] gap-5 border-b border-line pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute md:grid">
              <span className="col-span-2">Product</span><span>Price</span><span>Quantity</span><span className="text-right">Total</span>
            </div>
            {cartItems.map((item) => <LineItem key={item.product.id} item={item} />)}
            <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-[13px]">
              <Link to="/shop" className="flex items-center gap-1.5 font-semibold underline underline-offset-4"><ArrowLeft className="size-4" /> Continue shopping</Link>
              <label className="flex items-center gap-2 text-mute"><input type="checkbox" className="size-4 accent-ink" /> Add gift wrap (+{tk(150)})</label>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28"><Summary zone={zone} setZone={setZone} /></aside>
        </div>
      </section>

      {/* Mobile sticky total bar above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[70px] z-30 space-y-2 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
        <p className="flex justify-between text-sm"><span className="text-mute">Total ({itemCount} items)</span><b>{tk(total)}</b></p>
        <Button to="/checkout" className="w-full">Checkout · {tk(total)}</Button>
      </div>
    </div>
  )
}
