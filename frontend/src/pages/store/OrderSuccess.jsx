import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock } from 'lucide-react'
import { tk } from '../../data/store'
import { Button, cx } from '../../components/store/ui'
import { PageLoader, ErrorState } from '../../components/common/feedback'
import { api } from '../../lib/api'
import { prettyPhone } from '../../lib/bd'

export const METHOD_LABEL = { cod: 'Cash on Delivery', bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', bank: 'Bank transfer', card: 'Card' }

// state: done | current | next
function steps(o, eta) {
  const paidOnline = o.payment_method !== 'cod'
  return [
    { title: 'Order placed', sub: new Date(o.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }), state: 'done' },
    paidOnline
      ? { title: 'Payment check', sub: o.payment?.status === 'verified' ? 'Verified' : 'We verify your payment', state: o.payment?.status === 'verified' ? 'done' : 'current' }
      : { title: 'Confirmed by call', sub: 'Within 2 hours', state: 'current' },
    { title: 'Processing', sub: 'Workshop, Dhaka', state: 'next' },
    { title: 'Shipped', sub: 'Courier', state: 'next' },
    { title: 'Delivered', sub: eta ? `Usually ${eta}` : '', state: 'next' },
  ]
}

const Dot = ({ state }) => (
  <span className={cx('relative z-10 grid size-5 shrink-0 place-items-center rounded-full',
    state === 'done' ? 'border-[5px] border-leaf bg-white' : state === 'current' ? 'border-[5px] border-tan bg-white' : 'border-[6px] border-sand bg-mute')} />
)

const InfoCard = ({ title, children }) => (
  <div className="space-y-2.5 rounded-lg bg-white p-5 sm:p-6">
    <p className="eyebrow">{title}</p>
    <div className="space-y-1 text-sm">{children}</div>
  </div>
)

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const number = params.get('order')
  const { data: o, isPending, error, refetch } = useQuery({ queryKey: ['customer', 'orders', 'item', number], queryFn: () => api.get(`/me/orders/${number}`).then((r) => r.data), enabled: !!number })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })

  if (!number) return <Navigate to="/account" replace />
  if (isPending) return <PageLoader />
  if (error) return <div className="container-x py-16"><ErrorState error={error} onRetry={refetch} /></div>

  const eta = o.delivery_zone === 'inside_dhaka' ? settings?.delivery?.inside_dhaka_eta : settings?.delivery?.outside_dhaka_eta
  const timeline = steps(o, eta)
  const first = o.name.split(' ')[0]
  const cod = o.payment_method === 'cod'

  return (
    <section className="container-x max-w-[860px] space-y-5 py-10 sm:space-y-6 sm:py-16">
      <header className="space-y-4 pb-2 text-center sm:space-y-5 sm:pb-4">
        <span className="mx-auto grid size-[92px] place-items-center rounded-full bg-leaf/15">
          <span className="grid size-14 place-items-center rounded-full bg-leaf text-white"><Check className="size-7" strokeWidth={2.5} /></span>
        </span>
        <h1 className="h-display mx-auto max-w-2xl text-[32px] sm:text-5xl">Thank you, {first}! Your order is placed.</h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-mute sm:text-base">
          Order <b className="text-ink">#{o.order_number}</b> · We've sent an SMS to {prettyPhone(o.phone)}.{' '}
          {cod ? 'Our team will call to confirm within 2 hours.' : 'We’ll confirm as soon as your payment is verified.'}
        </p>
      </header>

      <div className="rounded-lg bg-white p-5 sm:p-7">
        <h2 className="h-display mb-5 text-[26px] sm:mb-7 sm:text-[30px]">What happens next</h2>
        <ol className="relative grid gap-5 md:grid-cols-5 md:gap-2">
          <span className="absolute bottom-2 left-[9px] top-2 w-px bg-line md:inset-x-[10%] md:bottom-auto md:top-[9px] md:h-px md:w-auto" />
          {timeline.map((s) => (
            <li key={s.title} className="relative flex items-start gap-3.5 md:flex-col md:items-center md:gap-3 md:text-center">
              <Dot state={s.state} />
              <span><b className={cx('block text-sm font-semibold', s.state === 'next' && 'text-mute')}>{s.title}</b><span className="text-xs text-mute">{s.sub}</span></span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <InfoCard title="Delivery to">
          <p>{o.name}</p><p>{[o.address_line, o.area, o.district].filter(Boolean).join(', ')}</p><p>{prettyPhone(o.phone)}</p>
        </InfoCard>
        <InfoCard title="Payment">
          <p className="font-semibold">{METHOD_LABEL[o.payment_method] ?? o.payment_method}</p>
          {cod ? <p>Pay {tk(o.total)} when you receive it</p> : (
            <>
              {o.payment?.transaction_id && <p className="text-mute">Transaction {o.payment.transaction_id}{o.payment.sender_number ? ` · from ${prettyPhone(o.payment.sender_number)}` : ''}</p>}
              <p className="flex items-center gap-1.5 text-amber"><Clock className="size-3.5" />{o.payment?.status === 'verified' ? 'Payment verified' : 'Waiting for verification'}</p>
              {o.payment_method === 'bank' && !o.payment?.proof && <Link to={`/track?order=${o.order_number}`} className="font-semibold text-tan underline">Upload your deposit slip</Link>}
            </>
          )}
        </InfoCard>
      </div>

      <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
        <h2 className="h-display text-[26px] sm:text-[30px]">Order summary ({o.items.length})</h2>
        <ul className="space-y-4">
          {o.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3.5">
              {i.image ? <img src={i.image} alt="" className="size-16 shrink-0 rounded object-cover" /> : <span className="size-16 shrink-0 rounded bg-tile" />}
              <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{i.name}</b><span className="text-xs text-mute">{[i.variant_name, i.engraving_text && `“${i.engraving_text}”`, `Qty ${i.qty}`].filter(Boolean).join(' · ')}</span></span>
              <span className="text-sm font-semibold">{tk(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{tk(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-mute">Delivery ({o.delivery_zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</dt><dd className={o.delivery_charge ? '' : 'font-medium text-leaf'}>{o.delivery_charge ? tk(o.delivery_charge) : 'Free'}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt className="text-mute">Coupon {o.coupon_code}</dt><dd className="text-tan">− {tk(o.discount)}</dd></div>}
        </dl>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-[34px] font-semibold leading-none">{tk(o.total)}</span>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
        <Button to="/shop" size="lg">Continue shopping</Button>
        <Button to={`/track?order=${o.order_number}`} variant="outline" size="lg">Track order</Button>
      </div>
    </section>
  )
}
