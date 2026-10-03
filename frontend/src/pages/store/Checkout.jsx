import { useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Copy, FileUp, Loader2, Lock, X } from 'lucide-react'
import { tk } from '../../data/store'
import { Button, Checkbox, Field, cx } from '../../components/store/ui'
import Select2 from '../../components/common/Select2'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { api } from '../../lib/api'
import { alertError, toast } from '../../lib/alert'
import { DISTRICTS, prettyPhone, zoneFor } from '../../lib/bd'
import { useCouponCheck, useSettings } from '../../lib/queries'

const STEPS = ['Cart', 'Information', 'Payment', 'Done']
// chip colours are static class strings so Tailwind can see them
const METHOD_STYLE = {
  cod: { chip: 'COD', cls: 'bg-leaf', sub: 'Pay the rider when you receive it' },
  bkash: { chip: 'bKash', cls: 'bg-bkash', sub: 'Pay now, then enter the Transaction ID' },
  rocket: { chip: 'Rocket', cls: 'bg-[#8C3494]', sub: 'Pay now, then enter the TxnId' },
  nagad: { chip: 'Nagad', cls: 'bg-nagad', sub: 'Pay now, then enter the TxnID' },
  bank: { chip: 'Bank', cls: 'bg-[#2B3240]', sub: 'Bank transfer or card via internet banking — upload the slip' },
}
const WALLETS = ['bkash', 'rocket', 'nagad']

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

function RadioCard({ checked, onChange, title, sub, right, name }) {
  return (
    <label className={cx('flex cursor-pointer items-center gap-4 rounded border bg-white px-4 py-4 transition sm:px-5', checked ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-mute')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={cx('grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]', checked ? 'border-ink' : 'border-mute')}>
        {checked && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{title}</b><span className="text-xs text-mute">{sub}</span></span>
      {right}
    </label>
  )
}

const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => toast.success(`${what} copied`))

function ProofPicker({ file, onChange, required, error }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-[13px] font-semibold text-ink">{required ? 'Deposit slip / transfer receipt *' : 'Payment screenshot (optional)'}</span>
      {file ? (
        <div className="flex items-center gap-3 rounded border border-line bg-white px-3 py-2.5 text-[13px]">
          <FileUp className="size-4 text-tan" /><span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove file"><X className="size-4 text-mute hover:text-ink" /></button>
        </div>
      ) : (
        <label className={cx('flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed bg-white px-3 py-3.5 text-[13px] font-semibold text-tan hover:border-tan', error ? 'border-rust' : 'border-line')}>
          <FileUp className="size-4" />Upload JPG, PNG or PDF (max 5 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = '' }} />
        </label>
      )}
      {error && <span className="block text-xs text-rust">{error}</span>}
    </div>
  )
}

// What to pay and where, for the chosen manual method
function PaymentDetails({ method, cfg, total, pay, setPay, errors }) {
  if (method === 'cod') return <p className="rounded bg-leaf/8 px-4 py-3 text-[13px] text-leaf">Pay <b>{tk(total)}</b> in cash to the rider. Our team calls to confirm the order first.</p>
  if (WALLETS.includes(method)) {
    return (
      <div className="space-y-4 rounded border border-line bg-cream p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>Amount <b className="text-base">{tk(total)}</b></span>
          <span className="flex items-center gap-2">{cfg.label} {cfg.account_type || ''} number <b className="text-base">{cfg.number}</b>
            <button type="button" onClick={() => copy(cfg.number, 'Number')} aria-label="Copy number" className="text-tan"><Copy className="size-3.5" /></button></span>
        </div>
        {cfg.instructions && <p className="text-xs leading-relaxed text-mute">{cfg.instructions}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your wallet number *" inputMode="tel" placeholder="01XXXXXXXXX" value={pay.sender_number} onChange={(e) => setPay({ sender_number: e.target.value.replace(/\D/g, '').slice(0, 11) })} error={errors.sender_number} />
          <Field label="Transaction ID *" placeholder="e.g. 9BK7XQ2LMN" value={pay.transaction_id} onChange={(e) => setPay({ transaction_id: e.target.value.toUpperCase().replace(/\s/g, '') })} error={errors.transaction_id} />
        </div>
        <ProofPicker file={pay.proof} onChange={(proof) => setPay({ proof })} />
      </div>
    )
  }
  // bank transfer / card
  const rows = [['Bank', cfg.bank_name], ['Account name', cfg.account_name], ['Account number', cfg.account_number], ['Branch', cfg.branch], ['Routing number', cfg.routing_number]].filter(([, v]) => v)
  return (
    <div className="space-y-4 rounded border border-line bg-cream p-4 sm:p-5">
      <p className="text-sm">Transfer <b className="text-base">{tk(total)}</b> to:</p>
      <dl className="divide-y divide-line rounded bg-white text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5"><dt className="text-mute">{k}</dt>
            <dd className="flex items-center gap-2 font-semibold">{v}{k === 'Account number' && <button type="button" onClick={() => copy(v, 'Account number')} aria-label="Copy account number" className="text-tan"><Copy className="size-3.5" /></button>}</dd></div>
        ))}
      </dl>
      {cfg.instructions && <p className="text-xs leading-relaxed text-mute">{cfg.instructions}</p>}
      <Field label="Transfer reference (optional)" placeholder="Reference / transaction no." value={pay.transaction_id} onChange={(e) => setPay({ transaction_id: e.target.value.toUpperCase() })} error={errors.transaction_id} />
      <ProofPicker required file={pay.proof} onChange={(proof) => setPay({ proof })} error={errors.proof} />
    </div>
  )
}

function Summary({ cart, fee, discount, total, couponQ, placing, onPlace }) {
  return (
    <div className="space-y-5 rounded-lg bg-white p-5 sm:p-7">
      <h2 className="h-display text-[26px] sm:text-[30px]">Order summary ({cart.count})</h2>
      <ul className="space-y-4">
        {cart.items.map((i) => (
          <li key={i.key} className="flex items-center gap-3.5">
            <span className="relative shrink-0">
              <img src={i.image} alt="" className="size-16 rounded object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-mute text-[10px] font-bold text-white">{i.qty}</span>
            </span>
            <span className="min-w-0 flex-1"><b className="block text-sm font-semibold">{i.name}</b><span className="block truncate text-xs text-mute">{[i.color, i.engraving_text && `“${i.engraving_text}”`].filter(Boolean).join(' · ')}</span></span>
            <span className="text-sm font-semibold">{tk(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{tk(cart.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-mute">Delivery</dt><dd className={fee ? '' : 'font-medium text-leaf'}>{fee ? tk(fee) : 'Free'}</dd></div>
        {cart.coupon && (couponQ.data
          ? <div className="flex justify-between"><dt className="text-mute">Coupon {couponQ.data.code}</dt><dd className="text-tan">− {tk(discount)}</dd></div>
          : couponQ.error && <div className="flex justify-between text-xs text-rust"><dt>Coupon {cart.coupon}: {couponQ.error.fields?.coupon_code || couponQ.error.message}</dt><dd><button type="button" onClick={() => cart.setCoupon('')} className="underline">Remove</button></dd></div>)}
      </dl>
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="font-display text-[34px] font-semibold leading-none">{tk(total)}</span>
      </div>
      <Button size="lg" className="w-full max-sm:hidden" disabled={placing} onClick={onPlace}>{placing && <Loader2 className="size-4 animate-spin" />}{placing ? 'Placing order…' : `Place order — ${tk(total)}`}</Button>
      <p className="text-center text-xs leading-relaxed text-mute">By placing your order you agree to our <Link to="/policy" className="underline">Terms</Link> &amp; <Link to="/policy" className="underline">Return Policy</Link>. You'll receive an SMS confirmation.</p>
    </div>
  )
}

export default function Checkout() {
  const { user } = useAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: settings } = useSettings()
  const { data: addresses = [], isPending: addressesLoading } = useQuery({ queryKey: ['customer', 'addresses'], queryFn: () => api.get('/me/addresses').then((r) => r.data) })
  const paymentRef = useRef(null)

  const [contact, setContact] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '' })
  const [addressId, setAddressId] = useState(null) // saved address id, or 'new'
  const [addr, setAddr] = useState({ district: '', area: '', address_line: '' })
  const [saveAddress, setSaveAddress] = useState(true)
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState({ billing_name: '', billing_phone: '', billing_address: '' })
  const [picked, setMethod] = useState('cod')
  const [pay, setPayState] = useState({ transaction_id: '', sender_number: '', proof: null })
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const setPay = (patch) => setPayState((p) => ({ ...p, ...patch }))

  // pre-select the saved default address once it loads — unless the customer already picked something
  if (addressId === null && addresses.length) {
    setAddressId((addresses.find((a) => a.is_default) ?? addresses[0]).id)
  }
  const saved = addresses.find((a) => a.id === addressId)
  const usingNew = !saved
  const delivery = usingNew ? addr : saved
  const zone = delivery?.district ? zoneFor(delivery.district) : 'inside_dhaka'

  const methods = useMemo(() => Object.entries(settings?.payments ?? {}).filter(([, c]) => c?.enabled).map(([k, c]) => ({ id: k, ...c })), [settings])
  // fall back to the first enabled method if the chosen one is switched off
  const method = methods.some((m) => m.id === picked) ? picked : methods[0]?.id ?? 'cod'
  const cfg = methods.find((m) => m.id === method)

  const couponQ = useCouponCheck(cart.coupon, cart.orderLines, zone)
  const d = settings?.delivery
  const freeAt = d?.free_delivery_threshold ?? 0
  const localFee = !d ? 0 : freeAt && cart.subtotal >= freeAt ? 0 : d[zone] ?? 0
  const discount = couponQ.data?.discount ?? 0
  const fee = couponQ.data?.delivery_charge ?? localFee
  const total = couponQ.data?.total ?? Math.max(0, cart.subtotal - discount + fee)

  if (!cart.items.length && !placing) return <Navigate to="/cart" replace />

  const pickMethod = (m) => { setMethod(m); setErrors({}); paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  const place = async () => {
    const local = {}
    if (!delivery?.district) local.district = 'Choose a district.'
    if (usingNew && !addr.address_line.trim()) local.address_line = 'Enter the full address.'
    if (method === 'bank' && !pay.proof) local.proof = 'Upload the deposit slip or transfer receipt.'
    if (Object.keys(local).length) { setErrors(local); toast.error('Please complete the highlighted fields.'); return }

    setPlacing(true); setErrors({})
    try {
      if (usingNew && saveAddress) {
        await api.post('/me/addresses', { label: 'Home', name: contact.name, phone: contact.phone, ...addr, is_default: addresses.length === 0 }).catch(() => {})
        qc.invalidateQueries({ queryKey: ['customer', 'addresses'] })
      }
      const res = await api.post('/orders', {
        ...contact, email: contact.email || null,
        district: delivery.district, area: delivery.area || null, address_line: delivery.address_line,
        billing_same: billingSame, ...(billingSame ? {} : billing),
        payment_method: method,
        ...(method !== 'cod' ? { transaction_id: pay.transaction_id || null, sender_number: pay.sender_number || null } : {}),
        coupon_code: couponQ.data ? cart.coupon : null,
        note: note || null,
        items: cart.orderLines,
      })
      const number = res.data.order_number
      if (pay.proof && method !== 'cod') {
        const fd = new FormData()
        fd.append('proof', pay.proof)
        await api.post(`/me/orders/${number}/payment`, fd).catch((e) => toast.error(`Order placed, but the file upload failed: ${e.message}. You can upload it from the order page.`))
      }
      cart.clear()
      qc.invalidateQueries({ queryKey: ['customer', 'orders'] })
      navigate(`/order-success?order=${number}`, { replace: true })
    } catch (err) {
      setPlacing(false)
      const fields = err.fields || {}
      setErrors(fields)
      const itemErrors = Object.entries(fields).filter(([k]) => k.startsWith('items')).map(([, v]) => v)
      if (itemErrors.length) alertError('Some items need attention', itemErrors.join(' '))
      else if (Object.keys(fields).length) toast.error('Please check the highlighted fields.')
      else alertError('Could not place the order', err.message)
    }
  }

  return (
    <div className="pb-20 sm:pb-0">
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
            <button type="button" onClick={() => setShowItems(!showItems)} className="flex w-full items-center justify-between px-4 py-3.5 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-tan"><ChevronDown className={cx('size-4 transition', showItems && 'rotate-180')} /> {showItems ? 'Hide' : 'Show'} order summary ({cart.count})</span>
              <b>{tk(total)}</b>
            </button>
            {showItems && (
              <ul className="space-y-3 border-t border-line px-4 py-3.5">
                {cart.items.map((i) => <li key={i.key} className="flex items-center gap-3 text-sm"><img src={i.image} alt="" className="size-12 rounded object-cover" /><span className="flex-1"><b className="block font-semibold">{i.name}</b><span className="text-xs text-mute">{i.color} · Qty {i.qty}</span></span>{tk(i.price * i.qty)}</li>)}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <h1 className="h-display text-[34px] max-sm:hidden sm:text-5xl lg:text-[56px]">Checkout</h1>
            {methods.some((m) => m.id === 'bkash' || m.id === 'nagad') && (
              <>
                <p className="eyebrow !text-mute">Express checkout</p>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {methods.some((m) => m.id === 'bkash') && <button type="button" onClick={() => pickMethod('bkash')} className="rounded bg-bkash py-3.5 text-sm font-semibold text-white transition hover:opacity-90">Pay with bKash</button>}
                  {methods.some((m) => m.id === 'nagad') && <button type="button" onClick={() => pickMethod('nagad')} className="rounded bg-nagad py-3.5 text-sm font-semibold text-white transition hover:opacity-90">Pay with Nagad</button>}
                </div>
              </>
            )}
          </div>

          {/* 1. Contact */}
          <fieldset className="space-y-4">
            <SectionTitle n={1}>Contact</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *" autoComplete="name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} error={errors.name} />
              <Field label="Mobile number *" placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))} error={errors.phone} help="We'll call this number to confirm your order" />
              <Field label="Email (optional)" type="email" placeholder="For order updates" className="sm:col-span-2" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} error={errors.email} />
            </div>
          </fieldset>

          {/* 2. Delivery */}
          <fieldset className="space-y-4">
            <SectionTitle n={2}>Delivery address</SectionTitle>
            {addressesLoading && <div className="h-20 animate-pulse rounded border border-line bg-white" />}
            {addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <RadioCard key={a.id} name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} title={`${a.label || 'Address'} · ${a.name}`}
                    sub={`${[a.address_line, a.area, a.district].filter(Boolean).join(', ')} · ${prettyPhone(a.phone)}`} />
                ))}
                <RadioCard name="address" checked={usingNew} onChange={() => setAddressId('new')} title="Use a new address" sub="Deliver somewhere else" />
              </div>
            )}
            {usingNew && !addressesLoading && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="District *" error={errors.district}><Select2 variant="store" search placeholder="Select district" options={DISTRICTS} value={addr.district} onChange={(district) => setAddr((x) => ({ ...x, district }))} invalid={!!errors.district} /></Field>
                <Field label="Area / Thana" placeholder="e.g. Dhanmondi" value={addr.area} onChange={(e) => setAddr((x) => ({ ...x, area: e.target.value }))} error={errors.area} />
                <Field label="Full address *" placeholder="House, road, block, landmark" className="sm:col-span-2" value={addr.address_line} onChange={(e) => setAddr((x) => ({ ...x, address_line: e.target.value }))} error={errors.address_line} />
                <Checkbox label="Save this address to my account" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              </div>
            )}
            {delivery?.district && d && (
              <p className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-white px-4 py-3 text-sm">
                <span><b>{zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</b> <span className="text-mute">· {zone === 'inside_dhaka' ? d.inside_dhaka_eta : d.outside_dhaka_eta}</span></span>
                <b className={fee ? '' : 'text-leaf'}>{fee ? tk(fee) : 'Free delivery'}</b>
              </p>
            )}
          </fieldset>

          {/* 3. Billing */}
          <fieldset className="space-y-4">
            <SectionTitle n={3}>Billing address</SectionTitle>
            <Checkbox label="Same as the delivery address" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
            {!billingSame && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Billing name *" value={billing.billing_name} onChange={(e) => setBilling((b) => ({ ...b, billing_name: e.target.value }))} error={errors.billing_name} />
                <Field label="Billing phone *" inputMode="tel" placeholder="01XXXXXXXXX" value={billing.billing_phone} onChange={(e) => setBilling((b) => ({ ...b, billing_phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))} error={errors.billing_phone} />
                <Field label="Billing address *" className="sm:col-span-2" value={billing.billing_address} onChange={(e) => setBilling((b) => ({ ...b, billing_address: e.target.value }))} error={errors.billing_address} />
              </div>
            )}
          </fieldset>

          {/* 4. Payment */}
          <fieldset ref={paymentRef} className="scroll-mt-28 space-y-4">
            <SectionTitle n={4}>Payment method</SectionTitle>
            <div className="space-y-3">
              {methods.map((m) => {
                const st = METHOD_STYLE[m.id] ?? { chip: m.label, cls: 'bg-ink', sub: '' }
                return (
                  <RadioCard key={m.id} name="payment" checked={method === m.id} onChange={() => { setMethod(m.id); setErrors({}) }} title={m.label} sub={st.sub}
                    right={<span className={cx('rounded px-2.5 py-1 text-[11px] font-bold text-white', st.cls)}>{st.chip}</span>} />
                )
              })}
            </div>
            {errors.payment_method && <p className="text-xs text-rust">{errors.payment_method}</p>}
            {cfg && <PaymentDetails method={method} cfg={cfg} total={total} pay={pay} setPay={setPay} errors={errors} />}
            <Field label="Order note (optional)">
              <textarea rows={3} className="input resize-none" placeholder="Special instruction for delivery or engraving" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-28"><Summary cart={cart} fee={fee} discount={discount} total={total} couponQ={couponQ} placing={placing} onPlace={place} /></aside>
      </section>

      {/* Mobile sticky place-order bar above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[70px] z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
        <Button className="w-full !py-3.5" disabled={placing} onClick={place}>{placing && <Loader2 className="size-4 animate-spin" />}Place order · {tk(total)}</Button>
      </div>
    </div>
  )
}
