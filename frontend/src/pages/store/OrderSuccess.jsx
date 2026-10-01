import { Check, Download } from 'lucide-react'
import { cartItems, tk } from '../../data/store'
import { Button, cx } from '../../components/store/ui'

/* Static order confirmation — replace with GET /orders/{id} later */
const ORDER = {
  id: 'XQ-24817',
  customer: 'Rahim Uddin',
  phone: '01XXXXXXXXX',
  address: 'House 12, Road 5, Dhanmondi, Dhaka',
  eta: '3 Oct',
  coupon: { code: 'XERQO300', amount: 300 },
}
const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0)
const total = subtotal - ORDER.coupon.amount

// state: done | current | next
const TIMELINE = [
  { title: 'Order placed', sub: '1 Oct, 2:14 AM', state: 'done' },
  { title: 'Confirmed by call', sub: 'Within 2 hours', state: 'current' },
  { title: 'Packed & engraved', sub: 'Workshop, Dhaka', state: 'next' },
  { title: 'Shipped', sub: 'Steadfast / Pathao', state: 'next' },
  { title: 'Delivered', sub: `Est. ${ORDER.eta}`, state: 'next' },
  { title: 'Rate your product', sub: 'Earn 50 points', state: 'next' },
]

const Dot = ({ state }) => (
  <span className={cx('relative z-10 grid size-5 shrink-0 place-items-center rounded-full',
    state === 'done' ? 'border-[5px] border-leaf bg-white' : state === 'current' ? 'border-[5px] border-tan bg-white' : 'border-[6px] border-sand bg-mute')} />
)

function Timeline() {
  return (
    <div className="rounded-lg bg-white p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:mb-7">
        <h2 className="h-display text-[26px] sm:text-[30px]">What happens next</h2>
        <span className="text-[13px] font-semibold text-tan">Est. delivery: {ORDER.eta}</span>
      </div>
      <ol className="relative grid gap-5 md:grid-cols-6 md:gap-2">
        {/* connector line */}
        <span className="absolute left-[9px] top-2 bottom-2 w-px bg-line md:inset-x-[8%] md:bottom-auto md:top-[9px] md:h-px md:w-auto" />
        {TIMELINE.map((s) => (
          <li key={s.title} className="relative flex items-start gap-3.5 md:flex-col md:items-center md:gap-3 md:text-center">
            <Dot state={s.state} />
            <span>
              <b className={cx('block text-sm font-semibold', s.state === 'next' && 'text-mute')}>{s.title}</b>
              <span className="text-xs text-mute">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

const InfoCard = ({ title, lines }) => (
  <div className="space-y-2.5 rounded-lg bg-white p-5 sm:p-6">
    <p className="eyebrow">{title}</p>
    <div className="space-y-1 text-sm">{lines.map((l) => <p key={l}>{l}</p>)}</div>
  </div>
)

function OrderSummary() {
  return (
    <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
      <h2 className="h-display text-[26px] sm:text-[30px]">Order summary ({cartItems.length})</h2>
      <ul className="space-y-4">
        {cartItems.map(({ product: p, qty, variant }) => (
          <li key={p.id} className="flex items-center gap-3.5">
            <img src={p.image} alt="" className="size-16 shrink-0 rounded object-cover" />
            <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{p.name}</b><span className="text-xs text-mute">{variant} · Qty {qty}</span></span>
            <span className="text-sm font-semibold">{tk(p.price * qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{tk(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Delivery (Inside Dhaka)</dt><dd className="font-medium text-leaf">Free</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Coupon {ORDER.coupon.code}</dt><dd className="text-tan">− {tk(ORDER.coupon.amount)}</dd></div>
      </dl>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-[34px] font-semibold leading-none">{tk(total)}</span>
      </div>
    </div>
  )
}

export default function OrderSuccess() {
  return (
    <section className="container-x max-w-[860px] space-y-5 py-10 sm:space-y-6 sm:py-16">
      <header className="space-y-4 pb-2 text-center sm:space-y-5 sm:pb-4">
        <span className="mx-auto grid size-[92px] place-items-center rounded-full bg-leaf/15">
          <span className="grid size-14 place-items-center rounded-full bg-leaf text-white"><Check className="size-7" strokeWidth={2.5} /></span>
        </span>
        <h1 className="h-display mx-auto max-w-2xl text-[32px] sm:text-5xl">Thank you, Rahim! Your order is confirmed.</h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-mute sm:text-base">
          Order <b className="text-ink">#{ORDER.id}</b> · We've sent an SMS to {ORDER.phone}. Our team will call to confirm within 2 hours.
        </p>
      </header>

      <Timeline />

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <InfoCard title="Delivery to" lines={[ORDER.customer, ORDER.address, ORDER.phone]} />
        <InfoCard title="Payment" lines={['Cash on Delivery', `Pay ${tk(total)} when you receive`]} />
      </div>

      <OrderSummary />

      <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
        <Button to="/shop" size="lg">Continue shopping</Button>
        <Button to="/track" variant="outline" size="lg">Track order</Button>
        <Button variant="white" size="lg"><Download className="size-4" /> Download invoice</Button>
      </div>
    </section>
  )
}
