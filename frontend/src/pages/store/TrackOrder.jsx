import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Clock, ExternalLink, FileUp, Loader2, Phone, X } from 'lucide-react'
import { tk } from '../../data/store'
import { Button, Field, PageHero, cx } from '../../components/store/ui'
import { ErrorState } from '../../components/common/feedback'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'
import { prettyPhone } from '../../lib/bd'
import { useSettings } from '../../lib/queries'
import { METHOD_LABEL } from './OrderSuccess'

const FLOW = [['pending', 'Order placed'], ['confirmed', 'Confirmed'], ['processing', 'Processing'], ['shipped', 'Shipped'], ['delivered', 'Delivered']]
const norm = (s) => (s === 'packed' ? 'processing' : s)
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const COURIER_SITES = { steadfast: 'https://steadfast.com.bd/t/', pathao: 'https://merchant.pathao.com/tracking?consignment_id=', redx: 'https://redx.com.bd/track-parcel/?trackingId=' }
const PAY_STATUS = { pending: ['Waiting for verification', 'text-amber'], verified: ['Payment verified', 'text-leaf'], rejected: ['Payment rejected', 'text-rust'] }

function Timeline({ o }) {
  const current = FLOW.findIndex(([s]) => s === norm(o.status))
  const at = (s) => o.status_history?.find((h) => norm(h.status) === s)?.created_at
  return (
    <ol className="grid gap-4 sm:grid-cols-5 sm:gap-2">
      {FLOW.map(([s, t], i) => {
        const done = i < current || (i === current && s === 'delivered')
        const active = i === current && s !== 'delivered'
        return (
          <li key={s} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {i < FLOW.length - 1 && <span className={cx('absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5 sm:left-1/2 sm:top-[11px] sm:h-0.5 sm:w-[calc(100%+8px)]', i < current ? 'bg-leaf' : 'bg-line')} />}
            <span className={cx('relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-leaf text-white' : active ? 'bg-info text-white ring-4 ring-info/15' : 'bg-sand text-mute')}>
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <div>
              <p className={cx('text-[13px] font-semibold', i > current && 'text-mute')}>{t}</p>
              <p className="text-[11px] text-mute">{at(s) ? when(at(s)) : i > current ? 'Upcoming' : ''}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Submit or fix a manual payment (owner only)
function PaymentForm({ o, onDone }) {
  const wallet = ['bkash', 'rocket', 'nagad'].includes(o.payment_method)
  const [f, setF] = useState({ transaction_id: '', sender_number: '', proof: null })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErrors({})
    const fd = new FormData()
    if (f.transaction_id) fd.append('transaction_id', f.transaction_id)
    if (f.sender_number) fd.append('sender_number', f.sender_number)
    if (f.proof) fd.append('proof', f.proof)
    try {
      await api.post(`/me/orders/${o.order_number}/payment`, fd)
      toast.success('Payment details sent — we’ll verify them shortly')
      setF({ transaction_id: '', sender_number: '', proof: null })
      onDone()
    } catch (err) { setErrors(err.fields || { proof: err.message }) } finally { setBusy(false) }
  }
  const rejected = o.payment?.status === 'rejected'
  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-line bg-white p-4" noValidate>
      <p className="text-sm font-semibold">{rejected ? 'Send your payment details again' : wallet ? 'Add or correct your payment details' : 'Upload your deposit slip'}</p>
      {wallet && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Wallet number" inputMode="tel" placeholder="01XXXXXXXXX" value={f.sender_number} onChange={(e) => setF((x) => ({ ...x, sender_number: e.target.value.replace(/\D/g, '').slice(0, 11) }))} error={errors.sender_number} />
          <Field label="Transaction ID" value={f.transaction_id} onChange={(e) => setF((x) => ({ ...x, transaction_id: e.target.value.toUpperCase().replace(/\s/g, '') }))} error={errors.transaction_id} />
        </div>
      )}
      {f.proof ? (
        <div className="flex items-center gap-3 rounded border border-line px-3 py-2.5 text-[13px]"><FileUp className="size-4 text-tan" /><span className="min-w-0 flex-1 truncate">{f.proof.name}</span><button type="button" onClick={() => setF((x) => ({ ...x, proof: null }))} aria-label="Remove file"><X className="size-4" /></button></div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-line px-3 py-3 text-[13px] font-semibold text-tan hover:border-tan">
          <FileUp className="size-4" />{wallet ? 'Payment screenshot (optional)' : 'Deposit slip / receipt (JPG, PNG or PDF)'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setF((x) => ({ ...x, proof: file })); e.target.value = '' }} />
        </label>
      )}
      {errors.proof && <p className="text-xs text-rust">{errors.proof}</p>}
      {errors.payment && <p className="text-xs text-rust">{errors.payment}</p>}
      <Button size="sm" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Send</Button>
    </form>
  )
}

function OrderView({ o, own, refresh }) {
  const { data: settings } = useSettings()
  const closed = ['cancelled', 'returned'].includes(o.status)
  const cod = o.payment_method === 'cod'
  const [payLabel, payTone] = PAY_STATUS[o.payment?.status] ?? (o.payment_status === 'paid' ? PAY_STATUS.verified : ['Not received yet', 'text-mute'])
  const canPay = own && !cod && o.payment_status !== 'paid' && o.payment?.status !== 'verified' && !closed
  const courierKey = (o.courier || '').toLowerCase().split(' ')[0]
  const site = o.tracking_code && COURIER_SITES[courierKey] ? COURIER_SITES[courierKey] + encodeURIComponent(o.tracking_code) : null
  const label = { pending: 'Order placed', confirmed: 'Confirmed', packed: 'Processing', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' }[o.status] ?? o.status

  return (
    <section className="space-y-6 rounded-lg bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="h-display text-[28px] sm:text-[32px]">Order #{o.order_number}</h1>
          <p className="text-[13px] text-mute">Placed {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} {o.items.length === 1 ? 'item' : 'items'} · {tk(o.total)} ({METHOD_LABEL[o.payment_method] ?? o.payment_method})</p>
        </div>
        <span className={cx('w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold', closed ? 'bg-rust/10 text-rust' : o.status === 'delivered' ? 'bg-leaf/12 text-leaf' : 'bg-info/12 text-info')}>{label}</span>
      </div>

      {closed
        ? <p className="flex items-center gap-2 rounded-md bg-rust/8 px-4 py-3 text-[13px] text-rust"><AlertTriangle className="size-4" />This order was {o.status}. {o.payment_status === 'refunded' ? 'Your payment was refunded.' : ''}</p>
        : <Timeline o={o} />}

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2 rounded-md bg-cream p-4 sm:p-5">
          <p className="eyebrow">Courier</p>
          {o.courier ? (
            <>
              <p className="text-sm font-semibold">{o.courier}{o.tracking_code && <> · <span className="font-normal">#{o.tracking_code}</span></>}</p>
              {site && <Button as="a" href={site} target="_blank" rel="noreferrer" variant="white" size="sm">Track on courier site<ExternalLink className="size-3.5" /></Button>}
            </>
          ) : <p className="text-[13px] text-mute">Assigned when your order ships.</p>}
        </div>
        <div className="space-y-2 rounded-md bg-cream p-4 sm:p-5">
          <p className="eyebrow">Delivering to</p>
          <p className="text-sm">{o.name}<br />{[o.address_line, o.area, o.district].filter(Boolean).join(', ')}</p>
          <p className="text-[13px] text-mute">{prettyPhone(o.phone)}</p>
        </div>
        <div className="space-y-2 rounded-md bg-cream p-4 sm:p-5">
          <p className="eyebrow">Payment</p>
          {cod
            ? <p className="text-[13px] font-semibold text-amber">{o.payment_status === 'paid' ? 'Paid in cash' : `Pay ${tk(o.total)} cash to the rider`}</p>
            : (
              <>
                <p className={cx('flex items-center gap-1.5 text-[13px] font-semibold', payTone)}><Clock className="size-3.5" />{payLabel}</p>
                {o.payment?.transaction_id && <p className="text-[12px] text-mute">TxnID {o.payment.transaction_id}</p>}
                {o.payment?.admin_note && o.payment.status === 'rejected' && <p className="text-[12px] text-rust">“{o.payment.admin_note}”</p>}
                {o.payment?.proof && own && <a href={o.payment.proof} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-tan underline">View uploaded file</a>}
              </>
            )}
        </div>
      </div>

      {canPay && <PaymentForm o={o} onDone={refresh} />}

      <ul className="divide-y divide-line border-b border-line">
        {o.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            {i.image ? <img src={i.image} alt={i.name} className="size-12 rounded object-cover" /> : <span className="size-12 rounded bg-tile" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-mute">{[i.variant_name, i.engraving_text && `Engraving “${i.engraving_text}”`, `Qty ${i.qty}`].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="text-sm font-bold">{tk(i.total)}</span>
          </li>
        ))}
      </ul>

      {settings?.store?.phone && <p className="rounded-md bg-sand px-4 py-3.5 text-[13px]">Problem with your delivery? Call <a href={`tel:${settings.store.phone.replace(/[^\d+]/g, '')}`} className="font-semibold"><Phone className="inline size-3.5" /> {settings.store.phone}</a> (10am–8pm).</p>}
    </section>
  )
}

export default function TrackOrder() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const number = (params.get('order') || '').toUpperCase()
  const [form, setForm] = useState({ order_number: number, phone: '' })
  const [lookup, setLookup] = useState(null) // { order_number, phone } for the public lookup

  // signed-in customers see their own order straight away
  const own = useQuery({
    queryKey: ['customer', 'orders', 'item', number],
    queryFn: () => api.get(`/me/orders/${number}`).then((r) => r.data),
    enabled: !!user && !!number,
    retry: false,
  })
  const pub = useQuery({
    queryKey: ['track', lookup],
    queryFn: () => api.get('/orders/track', lookup).then((r) => r.data),
    enabled: !!lookup,
    retry: false,
  })

  const submit = (e) => {
    e.preventDefault()
    const order_number = form.order_number.trim().toUpperCase()
    setParams(order_number ? { order: order_number } : {})
    if (user && order_number) return // the own-order query takes over
    setLookup({ order_number, phone: form.phone })
  }

  const order = own.data ?? pub.data
  const loading = (own.isFetching && !own.data) || (pub.isFetching && !pub.data)
  const notFound = (pub.error?.status === 404) || (own.error?.status === 404)

  return (
    <>
      <PageHero image="/images/messenger.jpg" crumbs={[{ label: 'Home', to: '/' }, { label: 'Track Order' }]} title="Track your order" sub={user ? 'Enter an order number from your account, or open it from My orders.' : 'Enter your order number and the phone number you used at checkout.'} />

      <div className="container-x space-y-4 py-6 sm:space-y-5 sm:py-10">
        <form onSubmit={submit} className={cx('grid gap-4 rounded-lg border border-line bg-white p-4 sm:items-end sm:p-5', user ? 'sm:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_1fr_auto]')}>
          <Field label="Order number" placeholder="XQ-24817" value={form.order_number} onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))} />
          {!user && <Field label="Phone number" inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))} />}
          <Button size="lg" className="sm:!py-[15px]" disabled={!form.order_number.trim() || (!user && form.phone.length < 11)}>Track</Button>
        </form>

        {loading && <div className="grid h-40 place-items-center rounded-lg bg-white"><Loader2 className="size-6 animate-spin text-tan" /></div>}
        {notFound && !loading && <p className="rounded-lg bg-white px-5 py-8 text-center text-sm text-mute">No order found with these details. Check the order number{user ? '' : ' and phone number'} and try again.</p>}
        {(pub.error || own.error) && !notFound && !loading && <ErrorState error={pub.error || own.error} />}
        {order && !loading && <OrderView o={order} own={!!own.data} refresh={() => qc.invalidateQueries({ queryKey: ['customer', 'orders'] })} />}
      </div>
    </>
  )
}
