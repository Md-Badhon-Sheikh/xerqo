import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, Printer } from 'lucide-react'
import { Badge, Btn, Card, KV, Thumb } from '../../components/admin/ui'
import { LoadingBlock } from '../../components/admin/form'
import { fmtDate } from '../../components/admin/orderUi'
import { adminApi, api } from '../../lib/api'

const bdt = (n) => '৳' + Number(n || 0).toLocaleString('en-IN')
const METHOD = { cod: 'Cash on Delivery', bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', bank: 'Bank transfer' }
const waNumber = (p) => `880${String(p || '').replace(/^0/, '')}`

// body[data-print] picks which block is printed: the invoice sheet or the packing slip
const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  body[data-print="invoice"] #invoice-sheet, body[data-print="invoice"] #invoice-sheet *,
  body[data-print="slip"] #packing-slip, body[data-print="slip"] #packing-slip * { visibility: visible !important; }
  #invoice-sheet, #packing-slip { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; }
  .no-print { display: none !important; }
  @page { size: A4; margin: 12mm; }
}`
const printPart = (part) => {
  document.body.dataset.print = part
  window.print()
  setTimeout(() => { delete document.body.dataset.print }, 500)
}

const Label = ({ children }) => <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-tan">{children}</p>

export default function Invoice() {
  const { id: number } = useParams()
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'orders', 'item', number], queryFn: () => adminApi.get(`/admin/orders/${number}`) })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  if (isPending) return <LoadingBlock rows={8} />
  if (error) return <div className="rounded-xl border border-aline bg-white p-8 text-center text-[13px] text-amute">{error.message} <Link to="/admin/orders" className="font-semibold text-tan">Back to orders</Link></div>

  const o = data.data
  const store = settings?.store ?? {}
  const num = o.order_number.replace(/^XQ-/, '')
  const paid = o.payment_status === 'paid'
  const due = paid ? 0 : o.total
  const trackUrl = `${window.location.origin}/track?order=${o.order_number}`
  const sendWhatsApp = () => window.open(`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hello ${o.name}, here is your XERQO invoice INV-${num} for order ${o.order_number}: total ${bdt(o.total)}${due ? `, ${bdt(due)} due` : ', paid'}. Track: ${trackUrl}`)}`, '_blank')

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="no-print space-y-3">
        <Link to={`/admin/orders/${o.order_number}`} className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Order #{o.order_number}</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold sm:text-[26px]">Invoice INV-{num}</h1>
            <p className="mt-1 text-[13px] text-amute">A4 print layout · use “Save as PDF” in the print dialog for a PDF</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Btn v="white" icon={Printer} onClick={() => printPart('invoice')}>Print / PDF</Btn>
            <Btn v="green" icon={MessageCircle} onClick={sendWhatsApp}><span className="sm:hidden">WhatsApp</span><span className="max-sm:hidden">Send on WhatsApp</span></Btn>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.9fr_1fr] xl:items-start">
        <article id="invoice-sheet" className="min-w-0 rounded-md border border-aline bg-white p-4 shadow-[0_10px_30px_-20px_rgba(35,26,21,0.3)] sm:p-8 xl:p-10">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <img src="/images/logo-dark.png" alt="XERQO" className="h-9 w-auto sm:h-12" />
              <p className="mt-3 text-[13px] font-semibold">{store.name || 'XERQO'} Leather Goods</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amute">{store.address}<br />{[store.phone, store.email].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-[26px] font-semibold leading-none tracking-[0.12em] sm:text-[38px]">INVOICE</p>
              <p className="mt-2 text-[13px] font-bold">INV-{num}</p>
              <p className="mt-1 text-[11px] text-amute">Date: {fmtDate(o.created_at)}</p>
              <div className="mt-1.5"><Badge tone={paid ? 'green' : 'amber'}>{paid ? `Paid · ${METHOD[o.payment_method]}` : METHOD[o.payment_method]}</Badge></div>
            </div>
          </header>

          <div className="mt-6 grid gap-5 text-[13px] leading-relaxed sm:mt-8 sm:grid-cols-3">
            <div><Label>Bill to</Label><p>{o.billing ? <>{o.billing.name}<br />{o.billing.phone}<br />{o.billing.address}</> : <>{o.name}<br />{o.phone}{o.email && <><br />{o.email}</>}</>}</p></div>
            <div><Label>Ship to</Label><p>{o.name}<br />{[o.address_line, o.area].filter(Boolean).join(', ')}<br />{o.district} · {o.delivery_zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p></div>
            <div><Label>Order</Label><p>#{o.order_number} · {fmtDate(o.created_at)}{o.courier && <><br />Courier: {o.courier}{o.tracking_code ? ` ${o.tracking_code}` : ''}</>}{o.payment?.transaction_id && <><br />TxnID: {o.payment.transaction_id}</>}</p></div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-aline">
            <table className="w-full min-w-[420px] text-[13px]">
              <thead className="bg-asoft text-left text-[10px] uppercase tracking-wider text-amute">
                <tr><th className="px-3 py-3 font-semibold sm:px-4">Item</th><th className="px-3 py-3 font-semibold">Qty</th><th className="px-3 py-3 font-semibold">Price</th><th className="px-3 py-3 font-semibold sm:px-4">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-aline">
                {o.items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <Thumb src={it.image || '/images/logo.png'} size={36} />
                        <div className="min-w-0"><p className="font-semibold">{it.name}</p><p className="text-[11px] text-amute">{[it.variant_name, it.engraving_text && `Engraving “${it.engraving_text}”`, it.sku].filter(Boolean).join(' · ')}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{it.qty}</td>
                    <td className="px-3 py-3">{bdt(it.price)}</td>
                    <td className="px-3 py-3 font-bold sm:px-4">{bdt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <div className="w-full space-y-2 sm:max-w-[300px]">
              <KV k="Subtotal" v={bdt(o.subtotal)} />
              <KV k={`Delivery (${o.delivery_zone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`} v={o.delivery_charge ? bdt(o.delivery_charge) : 'Free'} />
              {o.discount > 0 && <KV k={`Discount (${o.coupon_code})`} v={`− ${bdt(o.discount)}`} />}
              <KV k="Total" v={bdt(o.total)} strong />
              <div className="!mt-3 flex items-center justify-between rounded-md bg-espresso px-4 py-3.5 text-white">
                <span className="text-[13px] font-semibold">{paid ? 'Paid in full' : o.payment_method === 'cod' ? 'Amount due (COD)' : 'Amount due'}</span>
                <span className="text-xl font-bold text-gold">{bdt(due)}</span>
              </div>
            </div>
          </div>

          <footer className="mt-7 flex flex-col gap-2 border-t border-aline pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold">Thank you for choosing XERQO!</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amute">{settings?.returns?.window_days ?? 7}-day easy return · Track your order at</p>
              <p className="text-[11px] font-semibold">{trackUrl}</p>
            </div>
          </footer>
        </article>

        <Card title="Packing slip" sub="For the warehouse — no prices" className="no-print-card">
          <div id="packing-slip" className="space-y-4">
            <KV k="Order" v={<b>#{o.order_number}</b>} />
            <KV k="Ship to" v={`${o.name} · ${o.district}`} />
            <ul className="divide-y divide-aline">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-start gap-3 py-3">
                  <input type="checkbox" className="mt-0.5 size-4 accent-tan" aria-label={it.name} />
                  <div><p className="text-[13px]">{it.qty} × {it.name}{it.variant_name ? ` · ${it.variant_name}` : ''}</p><p className="text-[11px] text-violet">{it.engraving_text ? `Engrave: ${it.engraving_text}` : '—'}</p></div>
                </li>
              ))}
              <li className="flex items-start gap-3 py-3"><input type="checkbox" className="mt-0.5 size-4 accent-tan" aria-label="Gift box" /><p className="text-[13px]">Gift box + care card</p></li>
            </ul>
            <div className="space-y-2.5 border-t border-aline pt-4">
              <KV k="Collect" v={paid ? 'Nothing (paid)' : bdt(o.total)} />
              <KV k="Courier" v={o.courier ? `${o.courier}${o.tracking_code ? ` · ${o.tracking_code}` : ''}` : 'Not assigned'} />
            </div>
          </div>
          <Btn v="white" icon={Printer} className="no-print w-full" onClick={() => printPart('slip')}>Print packing slip</Btn>
        </Card>
      </div>
    </>
  )
}
