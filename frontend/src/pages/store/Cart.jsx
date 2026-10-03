import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BadgeCheck, Loader2, RotateCcw, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react'
import { tk } from '../../data/store'
import { api } from '../../lib/api'
import { useSettings } from '../../lib/queries'
import { useCart } from '../../context/CartContext'
import { Breadcrumb, Button, EmptyState, Qty, cx } from '../../components/store/ui'

const PayChips = () => (
  <div className="flex flex-wrap justify-center gap-1.5">
    {['COD', 'bKash', 'Rocket', 'Nagad', 'Bank'].map((p) => <span key={p} className="rounded-sm border border-line px-2 py-0.5 text-[10px] font-semibold text-mute">{p}</span>)}
  </div>
)

function FreeDeliveryBar({ subtotal, freeAt }) {
  if (!freeAt) return null
  const left = Math.max(0, freeAt - subtotal)
  const pct = Math.min(100, (subtotal / freeAt) * 100)
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

function LineItem({ item: i, onQty, onRemove }) {
  const remove = <button onClick={onRemove} className="text-xs text-tan underline underline-offset-2">Remove</button>
  const meta = [i.color, i.engraving_text && `Engraving: “${i.engraving_text}”`].filter(Boolean).join(' · ')
  return (
    <div className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5 sm:grid-cols-[110px_1fr] md:grid-cols-[110px_1fr_110px_120px_100px] md:items-center md:gap-5">
      <Link to={`/product/${i.slug}`} className="block aspect-[110/124] overflow-hidden rounded bg-tile">
        <img src={i.image} alt={i.name} className="size-full object-cover" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <Link to={`/product/${i.slug}`} className="font-display text-lg font-semibold leading-tight hover:text-tan sm:text-[22px]">{i.name}</Link>
        {meta && <p className="text-xs text-mute sm:text-[13px]">{meta}</p>}
        <p className="md:hidden"><b className="text-[15px]">{tk(i.price)}</b></p>
        <div className="mt-1 flex items-center justify-between md:hidden"><Qty value={i.qty} max={i.stock} onChange={onQty} small />{remove}</div>
        <div className="mt-1 max-md:hidden">{remove}</div>
      </div>
      <b className="text-[15px] max-md:hidden">{tk(i.price)}</b>
      <div className="max-md:hidden"><Qty value={i.qty} max={i.stock} onChange={onQty} small /></div>
      <b className="text-right text-base max-md:hidden">{tk(i.price * i.qty)}</b>
    </div>
  )
}

// Validates the saved coupon against the current cart (server-side prices) and delivery zone
function useCoupon(code, lines, zone) {
  return useQuery({
    queryKey: ['coupon', code, lines, zone],
    queryFn: () => api.post('/coupons/validate', { code, items: lines, delivery_zone: zone }),
    enabled: !!code && lines.length > 0,
    retry: false,
    staleTime: 30_000,
  })
}

function Summary({ cart, zone, setZone, delivery, couponQ, totals }) {
  const [code, setCode] = useState(cart.coupon)
  const zones = delivery ? [
    { id: 'inside_dhaka', label: 'Inside Dhaka', fee: delivery.inside_dhaka, eta: delivery.inside_dhaka_eta },
    { id: 'outside_dhaka', label: 'Outside Dhaka', fee: delivery.outside_dhaka, eta: delivery.outside_dhaka_eta },
  ] : []
  const current = zones.find((z) => z.id === zone)
  const applied = couponQ.data
  return (
    <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
      <h2 className="h-display text-[28px] sm:text-[32px]">Order summary</h2>
      <div className="space-y-2">
        {cart.coupon && applied ? (
          <div className="flex items-center justify-between rounded border border-leaf/40 bg-leaf/8 px-3.5 py-2.5 text-[13px]">
            <span><b className="text-leaf">{applied.code}</b> applied — you save {tk(applied.discount)}</span>
            <button onClick={() => { cart.setCoupon(''); setCode('') }} aria-label="Remove coupon"><X className="size-4 text-mute hover:text-ink" /></button>
          </div>
        ) : (
          <form className="flex" onSubmit={(e) => { e.preventDefault(); cart.setCoupon(code.trim().toUpperCase()) }}>
            <input className="input !rounded-r-none" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Coupon code" />
            <Button variant="outline" className="!rounded-l-none border-l-0" disabled={!code.trim() || couponQ.isFetching}>
              {couponQ.isFetching ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
            </Button>
          </form>
        )}
        {cart.coupon && couponQ.error && (
          <p className="flex items-center justify-between text-xs text-rust">
            {couponQ.error.fields?.coupon_code || couponQ.error.message}
            <button onClick={() => { cart.setCoupon(''); setCode('') }} className="underline">Remove</button>
          </p>
        )}
      </div>

      {zones.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold">Delivery area</p>
          <div className="grid grid-cols-2 gap-2">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setZone(z.id)} aria-pressed={zone === z.id} className={cx('rounded border px-3 py-2.5 text-left text-xs transition', zone === z.id ? 'border-ink bg-cream' : 'border-line hover:border-mute')}>
                <b className="block text-[13px]">{z.label}</b><span className="text-mute">{tk(z.fee)} · {z.eta}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Subtotal ({cart.count} {cart.count === 1 ? 'item' : 'items'})</dt><dd>{tk(cart.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Delivery{current && ` (${current.label})`}</dt><dd className={totals.fee ? '' : 'font-medium text-leaf'}>{totals.fee ? tk(totals.fee) : 'Free'}</dd></div>
        {totals.discount > 0 && <div className="flex justify-between"><dt className="text-mute">Coupon {applied?.code}</dt><dd className="text-tan">− {tk(totals.discount)}</dd></div>}
      </dl>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-[34px] font-semibold leading-none">{tk(totals.total)}</span>
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
  const cart = useCart()
  const { data: settings } = useSettings()
  const delivery = settings?.delivery
  const [zone, setZone] = useState('inside_dhaka')
  const couponQ = useCoupon(cart.coupon, cart.orderLines, zone)

  // the API's numbers win once the coupon is validated; until then estimate locally
  const freeAt = delivery?.free_delivery_threshold ?? 0
  const localFee = !delivery ? 0 : freeAt && cart.subtotal >= freeAt ? 0 : delivery[zone] ?? 0
  const discount = couponQ.data?.discount ?? 0
  const fee = couponQ.data?.delivery_charge ?? localFee
  const total = couponQ.data?.total ?? Math.max(0, cart.subtotal - discount + fee)
  const totals = { fee, discount, total }

  if (cart.items.length === 0) {
    return (
      <section className="container-x space-y-4 py-8 sm:py-12">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Looks like you haven't added anything yet. Our handcrafted pieces are waiting." action={<Button to="/shop">Start shopping</Button>} />
      </section>
    )
  }

  return (
    <div className="pb-20 sm:pb-0">
      <section className="container-x space-y-2 pb-14 pt-5 sm:pt-10 lg:pb-20">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <h1 className="h-display text-[34px] sm:text-5xl lg:text-[56px]">Your cart ({cart.count})</h1>

        <div className="grid items-start gap-8 pt-4 sm:pt-6 lg:grid-cols-[1fr_400px] lg:gap-10 xl:grid-cols-[1fr_420px]">
          <div className="min-w-0">
            <FreeDeliveryBar subtotal={cart.subtotal} freeAt={freeAt} />
            <div className="mt-6 hidden grid-cols-[110px_1fr_110px_120px_100px] gap-5 border-b border-line pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute md:grid">
              <span className="col-span-2">Product</span><span>Price</span><span>Quantity</span><span className="text-right">Total</span>
            </div>
            {cart.items.map((i) => <LineItem key={i.key} item={i} onQty={(q) => cart.update(i.key, q)} onRemove={() => cart.remove(i.key)} />)}
            <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-[13px]">
              <Link to="/shop" className="flex items-center gap-1.5 font-semibold underline underline-offset-4"><ArrowLeft className="size-4" /> Continue shopping</Link>
              <p className="text-xs text-mute">Prices are confirmed at checkout.</p>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28"><Summary cart={cart} zone={zone} setZone={setZone} delivery={delivery} couponQ={couponQ} totals={totals} /></aside>
        </div>
      </section>

      {/* Mobile sticky total bar above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[70px] z-30 space-y-2 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
        <p className="flex justify-between text-sm"><span className="text-mute">Total ({cart.count} {cart.count === 1 ? 'item' : 'items'})</span><b>{tk(total)}</b></p>
        <Button to="/checkout" className="w-full">Checkout · {tk(total)}</Button>
      </div>
    </div>
  )
}
