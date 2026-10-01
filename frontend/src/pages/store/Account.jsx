import { Link } from 'react-router-dom'
import { ChevronDown, Star, Truck, FileText, RotateCcw } from 'lucide-react'
import { orders, tk } from '../../data/store'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, StatusBadge } from '../../components/store/ui'

const STATS = [['3', 'Orders'], ['6', 'Wishlist'], ['2', 'Reviews'], ['৳120', 'Reward']]

function Greeting() {
  return (
    <section className="bg-sand">
      <div className="container-x flex flex-col gap-4 py-5 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-tan text-base font-bold text-white sm:size-14 sm:text-lg">RU</span>
          <div className="min-w-0">
            <h1 className="h-display text-[28px] sm:text-4xl">Hi, Rahim Uddin</h1>
            <p className="text-xs text-mute sm:text-[13px]">01XXXXXXXXX · Member since 2025</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:flex">
          {STATS.map(([v, l]) => (
            <div key={l} className="rounded-md bg-white px-2 py-2.5 text-center lg:min-w-[76px] lg:px-4">
              <p className="text-base font-bold sm:text-lg">{v}</p>
              <p className="text-[11px] text-mute">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function OrderCard({ o }) {
  const delivered = o.status === 'Delivered'
  return (
    <article className="overflow-hidden rounded-lg bg-white">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[15px] font-bold sm:text-base">Order #{o.id}</h2>
            <StatusBadge status={o.status} />
          </div>
          <p className="text-[13px] text-mute">Placed {o.date} · {tk(o.total)}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-2">
            {o.items.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} title={p.name} className="block size-12 overflow-hidden rounded bg-tile sm:size-16">
                <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" />
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            {delivered
              ? <Button variant="outline" size="sm" className="sm:!px-4 sm:!py-2.5"><RotateCcw className="size-3.5 max-sm:hidden" />Buy again</Button>
              : <Button to="/track" size="sm" className="sm:!px-4 sm:!py-2.5"><Truck className="size-3.5 max-sm:hidden" />Track</Button>}
            <Button variant="soft" size="sm" className="sm:!px-4 sm:!py-2.5"><FileText className="size-3.5 max-sm:hidden" />Invoice</Button>
          </div>
        </div>
      </div>
      {o.reviewPending && (
        <div className="flex flex-col gap-3 border-t border-tan/25 bg-tan/8 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tan text-white"><Star className="size-4 fill-white" /></span>
            <div>
              <p className="text-sm font-semibold">Delivered — how was your {o.items[0].name}?</p>
              <p className="text-xs text-mute">Rate your product &amp; delivery · earn 50 reward points for a photo review</p>
            </div>
          </div>
          <Button to={`/account/review/${o.id}`} variant="tan" size="sm" className="shrink-0 sm:!px-4 sm:!py-2.5">Rate your product</Button>
        </div>
      )}
    </article>
  )
}

export default function Account() {
  return (
    <>
      <Greeting />
      <AccountShell hideUser>
        <div className="flex items-center justify-between">
          <h2 className="h-display text-[30px] sm:text-4xl">My orders</h2>
          <label className="relative">
            <span className="sr-only">Filter orders</span>
            <select className="appearance-none bg-transparent pr-5 text-sm font-medium outline-none">
              {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2" />
          </label>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {orders.map((o) => <OrderCard key={o.id} o={o} />)}
        </div>
      </AccountShell>
    </>
  )
}
