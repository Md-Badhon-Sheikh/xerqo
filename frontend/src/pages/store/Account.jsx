import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Star, Truck, FileText, RotateCcw } from 'lucide-react'
import { tk } from '../../data/store'
import { AccountShell } from '../../components/store/AccountShell'
import { useAuth } from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/StoreUIContext'
import { Button, EmptyState, StatusBadge } from '../../components/store/ui'
import { ErrorState } from '../../components/common/feedback'
import Select2 from '../../components/common/Select2'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'

export const ORDER_STATUS = { pending: 'Pending', confirmed: 'Confirmed', packed: 'Processing', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' }
const FILTERS = [{ value: '', label: 'All orders' }, { value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'processing', label: 'Processing' }, { value: 'shipped', label: 'Shipped' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]
const day = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Greeting({ stats }) {
  const { user } = useAuth()
  const initials = (user?.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const since = user?.created_at ? new Date(user.created_at).getFullYear() : null
  return (
    <section className="bg-sand">
      <div className="container-x flex flex-col gap-4 py-5 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="size-12 shrink-0 rounded-full object-cover sm:size-14" />
            : <span className="grid size-12 shrink-0 place-items-center rounded-full bg-tan text-base font-bold text-white sm:size-14 sm:text-lg">{initials}</span>}
          <div className="min-w-0">
            <h1 className="h-display text-[28px] sm:text-4xl">Hi, {user?.name}</h1>
            <p className="text-xs text-mute sm:text-[13px]">{[user?.phone, since && `Member since ${since}`].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:flex">
          {stats.map(([v, l, to]) => (
            <Link key={l} to={to} className="rounded-md bg-white px-2 py-2.5 text-center hover:ring-1 hover:ring-tan lg:min-w-[84px] lg:px-4">
              <p className="text-base font-bold sm:text-lg">{v ?? '–'}</p>
              <p className="text-[11px] text-mute">{l}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function OrderCard({ o }) {
  const cart = useCart()
  const ui = useUI()
  const delivered = o.status === 'delivered'
  const open = ['pending', 'confirmed', 'packed', 'processing', 'shipped'].includes(o.status)
  const label = ORDER_STATUS[o.status] ?? o.status

  // put the same products back in the cart (today's prices apply)
  const buyAgain = async () => {
    try {
      let added = 0
      for (const item of o.items) {
        if (!item.product_slug) continue
        const { data: p } = await api.get(`/products/${item.product_slug}`)
        const variant = item.variant_id ? p.variants?.find((v) => v.id === item.variant_id) : null
        if (!p.in_stock || (p.variants?.length && !variant?.in_stock)) continue
        cart.add({ product_id: p.id, variant_id: variant?.id ?? null, slug: p.slug, name: p.name, image: variant?.image || p.image, color: variant?.name ?? null, price: variant?.price ?? p.price, stock: variant ? Math.min(variant.stock, p.stock) : p.stock, engraving_text: item.engraving_text }, item.qty)
        added++
      }
      if (added) { toast.success('Added to your cart'); ui?.setDrawer(true) } else toast.error('These items are no longer available.')
    } catch (e) { toast.error(e.message) }
  }

  return (
    <article className="overflow-hidden rounded-lg bg-white">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[15px] font-bold sm:text-base">Order #{o.order_number}</h2>
            <StatusBadge status={label} />
          </div>
          <p className="text-[13px] text-mute">Placed {day(o.created_at)} · {tk(o.total)} · {o.items_count ?? o.items.length} {(o.items_count ?? o.items.length) === 1 ? 'item' : 'items'}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex gap-2">
            {o.items.slice(0, 4).map((it) => (
              <Link key={it.id} to={it.product_slug ? `/product/${it.product_slug}` : '#'} title={it.name} className="block size-12 overflow-hidden rounded bg-tile sm:size-16">
                {it.image && <img src={it.image} alt={it.name} loading="lazy" className="size-full object-cover" />}
              </Link>
            ))}
          </div>
          <div className="flex gap-2">
            {open
              ? <Button to={`/track?order=${o.order_number}`} size="sm" className="sm:!px-4 sm:!py-2.5"><Truck className="size-3.5 max-sm:hidden" />Track</Button>
              : <Button variant="outline" size="sm" className="sm:!px-4 sm:!py-2.5" onClick={buyAgain}><RotateCcw className="size-3.5 max-sm:hidden" />Buy again</Button>}
            <Button to={`/track?order=${o.order_number}`} variant="soft" size="sm" className="sm:!px-4 sm:!py-2.5"><FileText className="size-3.5 max-sm:hidden" />Details</Button>
          </div>
        </div>
      </div>
      {delivered && o.can_review && (
        <div className="flex flex-col gap-3 border-t border-tan/25 bg-tan/8 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tan text-white"><Star className="size-4 fill-white" /></span>
            <div>
              <p className="text-sm font-semibold">Delivered — how was your {o.items[0]?.name}?</p>
              <p className="text-xs text-mute">Rate your product &amp; delivery to help other customers</p>
            </div>
          </div>
          <Button to={`/account/review/${o.order_number}`} variant="tan" size="sm" className="shrink-0 sm:!px-4 sm:!py-2.5">Rate your product</Button>
        </div>
      )}
    </article>
  )
}

export default function Account() {
  const [status, setStatus] = useState('')
  const wish = useWishlist()
  const orders = useQuery({ queryKey: ['customer', 'orders', status], queryFn: () => api.get('/me/orders', { status, per_page: 20 }) })
  const all = useQuery({ queryKey: ['customer', 'orders', 'count'], queryFn: () => api.get('/me/orders', { per_page: 1 }) })
  const reviews = useQuery({ queryKey: ['customer', 'reviews'], queryFn: () => api.get('/me/reviews') })
  const list = orders.data?.data ?? []
  const stats = [[all.data?.meta?.total, 'Orders', '/account'], [wish?.count, 'Wishlist', '/account/wishlist'], [reviews.data?.data?.length, 'Reviews', '/account/reviews']]

  return (
    <>
      <Greeting stats={stats} />
      <AccountShell hideUser>
        <div className="flex items-center justify-between gap-3">
          <h2 className="h-display text-[30px] sm:text-4xl">My orders</h2>
          <Select2 variant="pill" search={false} className="w-44" aria-label="Filter orders" value={status} onChange={setStatus} options={FILTERS} />
        </div>
        {orders.error ? <ErrorState error={orders.error} onRetry={orders.refetch} /> : orders.isPending ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-white" />)}</div>
        ) : list.length ? (
          <div className="space-y-3 sm:space-y-4">{list.map((o) => <OrderCard key={o.id} o={o} />)}</div>
        ) : (
          <EmptyState icon={Package} title={status ? 'No orders with this status' : 'No orders yet'} text={status ? 'Try another filter.' : 'When you place an order it shows up here with live tracking.'} action={!status && <Button to="/shop">Start shopping</Button>} />
        )}
      </AccountShell>
    </>
  )
}
