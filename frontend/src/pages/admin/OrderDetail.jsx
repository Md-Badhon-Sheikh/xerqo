import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import { ArrowLeft, Check, ExternalLink, MessageCircle, Pencil, Phone, Printer, Truck, X } from 'lucide-react'
import { Badge, Btn, Card, Col, KV, Avatar, PayChip, Select, Textarea, Thumb, Two, cx } from '../../components/admin/ui'
import { FormField, LoadingBlock, Spin, TextInput } from '../../components/admin/form'
import { COURIERS, ORDER_STATUS, OrderBadge, PayBadge, PaymentBadge, STATUS_ACTION, Tk, fmtDateTime } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm, toast } from '../../lib/alert'
import { DISTRICTS } from '../../lib/bd'
import { useAdminMutation } from '../../lib/adminQueries'

const METHOD_NAME = { cod: 'Cash on Delivery', bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', bank: 'Bank transfer / card' }
const isImage = (url) => /\.(jpe?g|png|webp|gif)$/i.test(url || '')
const waNumber = (p) => `880${String(p || '').replace(/^0/, '')}`

function useOrder(number) {
  return useQuery({
    queryKey: ['admin', 'orders', 'item', number],
    queryFn: () => adminApi.get(`/admin/orders/${number}`),
  })
}

function PaymentCard({ order, payments, canEdit, onChange }) {
  const p = order.payment
  const run = async (action) => {
    let body = {}
    if (action === 'reject') {
      const res = await Swal.fire({
        icon: 'warning', title: 'Reject this payment?', input: 'textarea', inputLabel: 'Reason (sent to the customer by SMS)', inputPlaceholder: 'e.g. Transaction ID not found in bKash statement',
        showCancelButton: true, confirmButtonText: 'Reject payment', reverseButtons: true, buttonsStyling: false,
        customClass: { confirmButton: 'xq-swal-btn xq-swal-danger', cancelButton: 'xq-swal-btn xq-swal-cancel', input: 'ainput !mx-6 !w-auto' },
        inputValidator: (v) => (!v?.trim() ? 'Tell the customer why' : undefined),
      })
      if (!res.isConfirmed) return
      body = { note: res.value }
    } else if (!(await confirm({ title: 'Mark this payment as received?', text: `${Tk(p.amount)} via ${METHOD_NAME[p.method]}${p.transaction_id ? ` · TxnID ${p.transaction_id}` : ''}. ${order.status === 'pending' ? 'The order is confirmed at the same time.' : ''}`, confirmText: 'Verify payment' }))) return
    try {
      await adminApi.patch(`/admin/payments/${p.id}/${action}`, body)
      toast.success(action === 'verify' ? 'Payment verified — customer notified' : 'Payment rejected — customer notified')
      onChange()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <Card title="Payment" right={<PayBadge s={order.payment_status} />}>
      {order.payment_method === 'cod' ? (
        <p className="text-[13px] text-amute">{order.payment_status === 'paid' ? 'Cash collected on delivery.' : `Collect ${Tk(order.total)} cash on delivery.`}</p>
      ) : !p ? (
        <p className="text-[13px] text-amute">The customer hasn't sent payment details yet.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2"><PayChip m={p.method} /><PaymentBadge s={p.status} /></div>
          <div className="space-y-2.5">
            <KV k="Amount" v={Tk(p.amount)} strong />
            {p.transaction_id && <KV k="Transaction ID" v={p.transaction_id} />}
            {p.sender_number && <KV k="Paid from" v={p.sender_number} />}
            <KV k="Sent" v={fmtDateTime(p.created_at)} />
            {p.verified_by && <KV k={p.status === 'verified' ? 'Verified by' : 'Checked by'} v={`${p.verified_by} · ${fmtDateTime(p.verified_at)}`} />}
          </div>
          {p.proof && (isImage(p.proof)
            ? <a href={p.proof} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-aline"><img src={p.proof} alt="Payment proof" className="max-h-56 w-full object-contain bg-asoft" /></a>
            : <a href={p.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-tan">Open the uploaded file <ExternalLink className="size-3.5" /></a>)}
          {p.admin_note && <p className={cx('rounded-lg px-3 py-2 text-xs', p.status === 'rejected' ? 'bg-bad/8 text-bad' : 'bg-asoft text-amute')}>“{p.admin_note}”</p>}
          {p.status === 'pending' && canEdit && (
            <div className="grid grid-cols-2 gap-2.5">
              <Btn v="danger" icon={X} onClick={() => run('reject')}>Reject</Btn>
              <Btn v="green" icon={Check} onClick={() => run('verify')}>Verify</Btn>
            </div>
          )}
          {payments.length > 1 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-tan">Earlier submissions ({payments.length - 1})</summary>
              <ul className="mt-2 space-y-1.5">{payments.slice(1).map((x) => <li key={x.id} className="flex justify-between gap-2 text-amute"><span>{x.transaction_id || 'File upload'} · {fmtDateTime(x.created_at)}</span><PaymentBadge s={x.status} /></li>)}</ul>
            </details>
          )}
        </>
      )}
    </Card>
  )
}

function AddressCard({ order, canEdit, save }) {
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({ name: order.name, phone: order.phone, district: order.district, area: order.area ?? '', address_line: order.address_line })
  const locked = ['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)
  return (
    <Card title="Shipping address" right={canEdit && !locked && !edit && <button type="button" onClick={() => setEdit(true)} aria-label="Edit address" className="text-amute hover:text-ink"><Pencil className="size-3.5" /></button>}>
      {edit ? (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate({ ...f, area: f.area || null }, { onSuccess: () => setEdit(false) }) }}>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Name" error={save.error?.fields?.name}><TextInput value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} /></FormField>
            <FormField label="Phone" error={save.error?.fields?.phone}><TextInput value={f.phone} onChange={(e) => setF((x) => ({ ...x, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))} /></FormField>
          </div>
          <FormField label="District"><Select search options={DISTRICTS} value={f.district} onChange={(district) => setF((x) => ({ ...x, district }))} /></FormField>
          <FormField label="Area"><TextInput value={f.area} onChange={(e) => setF((x) => ({ ...x, area: e.target.value }))} /></FormField>
          <FormField label="Address" error={save.error?.fields?.address_line}><TextInput value={f.address_line} onChange={(e) => setF((x) => ({ ...x, address_line: e.target.value }))} /></FormField>
          <p className="text-[11px] text-amute">The delivery charge is not recalculated when the district changes.</p>
          <div className="flex justify-end gap-2"><Btn v="white" sm type="button" onClick={() => setEdit(false)}>Cancel</Btn><Btn sm disabled={save.isPending}>{save.isPending && <Spin />}Save</Btn></div>
        </form>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed">{order.name}<br />{[order.address_line, order.area].filter(Boolean).join(', ')}<br />{order.district}</p>
          <KV k="Zone" v={order.delivery_zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'} />
          {order.billing && <div className="rounded-lg bg-asoft px-3 py-2.5 text-xs"><p className="font-semibold">Billing address</p><p className="text-amute">{order.billing.name} · {order.billing.phone}<br />{order.billing.address}</p></div>}
        </>
      )}
    </Card>
  )
}

export default function OrderDetail() {
  const { id: number } = useParams()
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending, error, refetch } = useOrder(number)
  const o = data?.data
  const next = data?.next_statuses ?? []
  const canEdit = can('orders', 'edit')
  const [statusTo, setStatusTo] = useState('')
  const [note, setNote] = useState('')
  const [courier, setCourier] = useState(null)
  const [internal, setInternal] = useState('')
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin'] }); refetch() }

  const save = useAdminMutation((body) => adminApi.put(`/admin/orders/${number}`, body), { invalidate: ['orders'], success: 'Order updated', onSuccess: refresh })
  const status = useAdminMutation((body) => adminApi.patch(`/admin/orders/${number}/status`, body), {
    invalidate: ['orders', 'inventory'],
    success: (r) => `Order is now ${ORDER_STATUS[r.data.status]?.[0].toLowerCase()} — customer notified`,
    onSuccess: () => { setNote(''); setStatusTo(''); refresh() },
  })

  if (isPending) return <LoadingBlock rows={8} />
  if (error) return <div className="rounded-xl border border-aline bg-white p-8 text-center text-[13px] text-amute">{error.status === 404 ? 'Order not found.' : error.message} <Link to="/admin/orders" className="font-semibold text-tan">Back to orders</Link></div>

  const c = courier ?? { courier: o.courier ?? '', tracking_code: o.tracking_code ?? '' }
  const primary = next.find((s) => !['cancelled', 'returned'].includes(s))
  const paymentPending = o.payment_method !== 'cod' && o.payment_status !== 'paid'
  const move = async (to) => {
    if (to === 'cancelled' && !(await confirm({ title: `Cancel order #${o.order_number}?`, text: 'Stock goes back to inventory and the customer gets an SMS.', confirmText: 'Cancel order', danger: true }))) return
    if (to === 'shipped' && !c.tracking_code && !(await confirm({ title: 'Ship without a tracking number?', text: 'You can add the courier and tracking number later.', confirmText: 'Mark as shipped' }))) return
    status.mutate({ status: to, ...(to === 'shipped' ? { courier: c.courier || null, tracking_code: c.tracking_code || null } : {}), note: note || null })
  }

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Back to orders</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-bold sm:text-[26px]">Order #{o.order_number}</h1>
              <OrderBadge s={o.status} /><PayChip m={o.payment_method} />{o.payment_method !== 'cod' && <PayBadge s={o.payment_status} />}
            </div>
            <p className="mt-1 text-[13px] text-amute">{fmtDateTime(o.created_at)} · via Website{o.coupon_code ? ` · coupon ${o.coupon_code}` : ''}</p>
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 sm:flex">
            <Btn to={`/admin/invoice/${o.order_number}`} v="white" icon={Printer} aria-label="Print invoice"><span className="max-sm:hidden">Print invoice</span></Btn>
            {canEdit && next.includes('cancelled') && <Btn v="danger" disabled={status.isPending} onClick={() => move('cancelled')}>Cancel order</Btn>}
            {canEdit && primary && <Btn v="green" icon={Check} disabled={status.isPending} onClick={() => move(primary)}>{status.isPending && <Spin />}{STATUS_ACTION[primary]}</Btn>}
          </div>
        </div>
        {paymentPending && o.status === 'pending' && <p className="rounded-lg bg-amber/10 px-4 py-2.5 text-[13px] text-amber">Payment not verified yet — check it in the Payment card before confirming.</p>}
      </div>

      <Two ratio="main">
        <Col>
          <Card title={`Items (${o.items.length})`} right={o.items.some((i) => i.engraving_text) && <Badge tone="purple">Engraving required</Badge>}>
            <div className="divide-y divide-aline">
              {o.items.map((it) => (
                <div key={it.id} className="flex gap-3 py-3.5 first:pt-0">
                  <Thumb src={it.image || '/images/logo.png'} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold sm:text-sm">{it.product_slug ? <a href={`/product/${it.product_slug}`} target="_blank" rel="noreferrer" className="hover:text-tan">{it.name}</a> : it.name}</p>
                    <p className="text-[11px] text-amute sm:text-xs">SKU {it.sku}{it.variant_name ? ` · ${it.variant_name}` : ''}</p>
                    {it.engraving_text && <span className="mt-1.5 inline-block rounded bg-violet/10 px-2 py-0.5 text-[11px] font-semibold text-violet">Engrave: “{it.engraving_text}”</span>}
                  </div>
                  <div className="shrink-0 text-right"><p className="text-sm font-bold">{Tk(it.total)}</p><p className="text-[11px] text-amute">{it.qty} × {Tk(it.price)}</p></div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-aline pt-4">
              <KV k="Subtotal" v={Tk(o.subtotal)} />
              <KV k={`Delivery · ${o.delivery_zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}`} v={o.delivery_charge ? Tk(o.delivery_charge) : 'Free'} />
              {o.discount > 0 && <KV k={`Coupon ${o.coupon_code}`} v={`− ${Tk(o.discount)}`} />}
              <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{Tk(o.total)}</span></div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-asoft px-3.5 py-3 text-[13px] font-semibold text-tan">
                <span>{o.payment_method === 'cod' ? (o.payment_status === 'paid' ? 'Cash collected' : 'Cash on Delivery — collect on delivery') : o.payment_status === 'paid' ? `Paid by ${METHOD_NAME[o.payment_method]}` : `${METHOD_NAME[o.payment_method]} — waiting for verification`}</span>
                <span className="shrink-0">{Tk(o.payment_status === 'paid' ? 0 : o.total)} due</span>
              </div>
            </div>
            {o.note && <p className="rounded-lg bg-amber/8 px-3.5 py-2.5 text-[13px]"><b>Customer note:</b> {o.note}</p>}
          </Card>

          <Card title="Timeline & activity">
            <ol className="relative space-y-4">
              <span className="absolute bottom-3 left-[4px] top-2 w-px bg-aline" />
              {[...(o.status_history ?? [])].reverse().map((h) => (
                <li key={h.id} className="relative flex gap-3.5">
                  <span className={cx('relative mt-1 size-[9px] shrink-0 rounded-full ring-4 ring-white', h.status === o.status ? 'bg-amber' : 'bg-ok')} />
                  <div>
                    <p className="text-[13px] font-medium">{ORDER_STATUS[h.status]?.[0] ?? h.status}{h.note && <span className="font-normal text-amute"> — {h.note}</span>}</p>
                    <p className="text-[11px] text-amute">{fmtDateTime(h.created_at)}{h.changed_by ? ` · ${h.changed_by}` : ''}</p>
                  </div>
                </li>
              ))}
            </ol>
            {canEdit && (
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (internal.trim()) save.mutate({ admin_note: internal.trim() }, { onSuccess: () => setInternal('') }) }}>
                <input className="ainput" value={internal} onChange={(e) => setInternal(e.target.value)} placeholder="Add an internal note (not sent to the customer)…" />
                <Btn sm disabled={!internal.trim() || save.isPending}>Add</Btn>
              </form>
            )}
          </Card>
        </Col>

        <Col className="md:grid md:grid-cols-2 md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          <PaymentCard order={o} payments={data.payments ?? []} canEdit={can('payments', 'edit')} onChange={refresh} />

          <Card title="Customer" right={o.user_id && <Link to={`/admin/customers/${o.user_id}`} className="text-xs font-semibold text-tan">View profile</Link>}>
            <div className="flex items-center gap-3">
              <Avatar name={o.name} size={40} />
              <div><p className="text-sm font-semibold">{o.name}</p><p className="text-xs text-amute">{o.customer ? `Customer since ${new Date(o.customer.created_at).getFullYear()}` : 'Customer account removed'}</p></div>
            </div>
            <div className="space-y-2.5"><KV k="Phone" v={o.phone} />{o.email && <KV k="Email" v={o.email} />}</div>
            <div className="grid grid-cols-2 gap-2.5">
              <Btn v="white" icon={Phone} onClick={() => { window.location.href = `tel:${o.phone}` }}>Call</Btn>
              <Btn v="white" icon={MessageCircle} onClick={() => window.open(`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hello ${o.name}, about your XERQO order ${o.order_number}`)}`, '_blank')}>WhatsApp</Btn>
            </div>
          </Card>

          <AddressCard key={`${o.id}-${o.updated_at}`} order={o} canEdit={canEdit} save={save} />

          <Card title="Courier" sub="Courier API booking comes later — add the courier and tracking number by hand">
            <FormField label="Courier"><Select search={false} placeholder="Choose courier" options={COURIERS} value={c.courier} onChange={(v) => setCourier({ ...c, courier: v })} /></FormField>
            <FormField label="Tracking / consignment number"><TextInput value={c.tracking_code} onChange={(e) => setCourier({ ...c, tracking_code: e.target.value.trim() })} placeholder="e.g. SF-88213457" /></FormField>
            {canEdit && <Btn icon={Truck} className="w-full" disabled={save.isPending || (!courier)} onClick={() => save.mutate({ courier: c.courier || null, tracking_code: c.tracking_code || null }, { onSuccess: () => setCourier(null) })}>Save courier details</Btn>}
          </Card>

          {canEdit && next.length > 0 && (
            <Card title="Update status" sub="The customer gets an SMS for each step">
              <FormField label="Move to"><Select search={false} placeholder="Choose the next step" options={next.map((s) => ({ value: s, label: ORDER_STATUS[s]?.[0] ?? s }))} value={statusTo} onChange={setStatusTo} /></FormField>
              <FormField label="Note (optional)"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shown in the order timeline" /></FormField>
              <Btn className="w-full" disabled={!statusTo || status.isPending} onClick={() => move(statusTo)}>{status.isPending && <Spin />}Save status</Btn>
            </Card>
          )}
        </Col>
      </Two>
    </>
  )
}
