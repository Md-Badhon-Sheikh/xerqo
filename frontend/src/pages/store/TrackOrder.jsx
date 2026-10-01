import { Check, Phone, ExternalLink } from 'lucide-react'
import { products, tk } from '../../data/store'
import { Button, Field, PageHero, cx } from '../../components/store/ui'

const STEPS = [
  ['Order placed', '1 Oct, 2:14 AM'],
  ['Confirmed', '1 Oct, 10:05 AM'],
  ['Packed & engraved', '1 Oct, 4:40 PM'],
  ['Handed to Steadfast', '2 Oct, 11:20 AM'],
  ['Out for delivery', '3 Oct, 9:15 AM'],
  ['Delivered', 'Expected today'],
]
const CURRENT = 5 // 1-based index of the active step

const items = [
  { p: products[5], note: 'Cognac · Engraving "M.H.D"', price: 2450 },
  { p: products[15], note: 'Tan', price: 590 },
]

function Dot({ n }) {
  const done = n < CURRENT
  const active = n === CURRENT
  return (
    <span className={cx('relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-leaf text-white' : active ? 'bg-info text-white ring-4 ring-info/15' : 'bg-sand text-mute')}>
      {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
    </span>
  )
}

function Timeline() {
  return (
    <ol className="grid gap-4 sm:grid-cols-6 sm:gap-2">
      {STEPS.map(([t, d], i) => (
        <li key={t} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
          {/* connector to the next step: vertical on mobile, horizontal from sm */}
          {i < STEPS.length - 1 && <span className={cx('absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 sm:left-1/2 sm:top-[11px] sm:h-0.5 sm:w-[calc(100%+8px)]', i + 1 < CURRENT ? 'bg-leaf' : 'bg-line')} />}
          <Dot n={i + 1} />
          <div>
            <p className={cx('text-[13px] font-semibold', i + 1 > CURRENT && 'text-mute')}>{t}</p>
            <p className="text-[11px] text-mute">{d}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function TrackOrder() {
  return (
    <>
      <PageHero image="/images/messenger.jpg" crumbs={[{ label: 'Home', to: '/' }, { label: 'Track Order' }]} title="Track your order" sub="Enter your order ID and the phone number you used at checkout." />

      <div className="container-x space-y-4 py-6 sm:space-y-5 sm:py-10">
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 rounded-lg border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-5">
          <Field label="Order ID" defaultValue="XQ-24817" />
          <Field label="Phone number" inputMode="tel" defaultValue="01712-XXXXXX" />
          <Button size="lg" className="sm:!py-[15px]">Track</Button>
        </form>

        <section className="space-y-6 rounded-lg bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="h-display text-[28px] sm:text-[32px]">Order #XQ-24817</h1>
              <p className="text-[13px] text-mute">Placed 1 Oct 2026 · 2 items · {tk(3040)} (Cash on Delivery)</p>
            </div>
            <span className="w-fit rounded-full bg-info/12 px-2.5 py-1 text-[11px] font-semibold text-info">Out for delivery</span>
          </div>

          <Timeline />

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2 rounded-md bg-cream p-4 sm:p-5">
              <p className="eyebrow">Courier</p>
              <p className="text-sm font-semibold">Steadfast Courier · CN 88213457</p>
              <p className="text-[13px] text-mute">Rider: Kamal · 01XXX-XXXXXX</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button as="a" href="tel:+8801000000000" variant="white" size="sm"><Phone className="size-3.5" />Call rider</Button>
                <Button as="a" href="https://steadfast.com.bd" target="_blank" rel="noreferrer" variant="white" size="sm">Courier site<ExternalLink className="size-3.5" /></Button>
              </div>
            </div>
            <div className="space-y-2 rounded-md bg-cream p-4 sm:p-5">
              <p className="eyebrow">Delivering to</p>
              <p className="text-sm">Rahim Uddin<br />House 12, Road 5, Dhanmondi, Dhaka</p>
              <p className="text-[13px] font-semibold text-amber">Pay {tk(3040)} cash to rider</p>
            </div>
          </div>

          <ul className="divide-y divide-line border-b border-line">
            {items.map(({ p, note, price }) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <img src={p.image} alt={p.name} className="size-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-mute">{note}</p>
                </div>
                <span className="text-sm font-bold">{tk(price)}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="rounded-md bg-sand px-4 py-3.5 text-[13px]">Problem with your delivery? Chat with us or call +880 1XXX-XXXXXX (10am–8pm).</p>
      </div>
    </>
  )
}
