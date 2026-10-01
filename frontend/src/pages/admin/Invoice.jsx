import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, MessageCircle, Printer } from 'lucide-react'
import { Badge, Btn, Card, KV, Thumb } from '../../components/admin/ui'
import { orders, products } from '../../data/admin'

const ITEMS = [
  { p: products[5], name: 'Heritage Long Wallet', note: 'Cognac · Engraving “M.H.D”', qty: 1, price: 2450 },
  { p: products[15], name: 'Loop Key Holder', note: 'Tan', qty: 1, price: 590 },
]
const SLIP = [['Heritage Long Wallet · Cognac', 'Engrave: M.H.D'], ['Loop Key Holder · Tan'], ['Gift box + care card']]
const bdt = (n) => '৳' + n.toLocaleString('en-IN')

// Decorative QR-style block (deterministic pattern)
const QR = Array.from({ length: 49 }, (_, i) => [0, 1, 7, 8, 5, 6, 12, 13, 35, 36, 42, 43].includes(i) || (i * 7 + (i % 5)) % 3 === 0)

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #invoice-sheet, #invoice-sheet * { visibility: visible !important; }
  #invoice-sheet { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; box-shadow: none !important; }
  @page { size: A4; margin: 12mm; }
}`

const Label = ({ children }) => <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-tan">{children}</p>

export default function Invoice() {
  const { id } = useParams()
  const o = orders.find((x) => x.id === id || x.id === `XQ-${id}`) || orders[0]
  const num = o.id.replace('XQ-', '')

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="space-y-3">
        <Link to={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Order #{o.id}</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[22px] font-bold sm:text-[26px]">Invoice INV-{num}</h1>
            <p className="mt-1 text-[13px] text-amute">A4 print layout · auto-generated on confirmation</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <Btn v="white" icon={Printer} onClick={() => window.print()}>Print</Btn>
            <Btn v="white" icon={Download} onClick={() => window.print()}><span className="sm:hidden">PDF</span><span className="max-sm:hidden">Download PDF</span></Btn>
            <Btn v="green" icon={MessageCircle} className="max-sm:[&>svg]:hidden"><span className="sm:hidden">Send</span><span className="max-sm:hidden">Send on WhatsApp</span></Btn>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.9fr_1fr] xl:items-start">
        {/* A4 sheet */}
        <article id="invoice-sheet" className="min-w-0 rounded-md border border-aline bg-white p-4 shadow-[0_10px_30px_-20px_rgba(35,26,21,0.3)] sm:p-8 xl:p-10">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <img src="/images/logo-dark.png" alt="XERQO" className="h-9 w-auto sm:h-12" />
              <p className="mt-3 text-[13px] font-semibold">XERQO Leather Goods</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amute">Dhanmondi, Dhaka · +880 1XXX-XXXXXX<br />hello@xerqo.com · xerqo.com</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-[26px] font-semibold leading-none tracking-[0.12em] sm:text-[38px]">INVOICE</p>
              <p className="mt-2 text-[13px] font-bold">INV-{num}</p>
              <p className="mt-1 text-[11px] text-amute">Date: 1 Oct 2026</p>
              <div className="mt-1.5"><Badge tone="amber">Cash on Delivery</Badge></div>
            </div>
          </header>

          <div className="mt-6 grid gap-5 text-[13px] leading-relaxed sm:mt-8 sm:grid-cols-3">
            <div><Label>Bill to</Label><p>{o.customer}<br />{o.phone}<br />rahim@email.com</p></div>
            <div><Label>Ship to</Label><p>House 12, Road 5, Dhanmondi<br />Dhaka 1205 · Inside Dhaka</p></div>
            <div><Label>Order</Label><p>#{o.id} · 1 Oct 2026<br />Courier: Steadfast SF-88213457</p></div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-lg border border-aline">
            <table className="w-full min-w-[420px] text-[13px]">
              <thead className="bg-asoft text-left text-[10px] uppercase tracking-wider text-amute">
                <tr><th className="px-3 py-3 font-semibold sm:px-4">Item</th><th className="px-3 py-3 font-semibold">Qty</th><th className="px-3 py-3 font-semibold">Price</th><th className="px-3 py-3 font-semibold sm:px-4">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-aline">
                {ITEMS.map((it) => (
                  <tr key={it.name}>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-2.5">
                        <Thumb src={it.p.image} size={36} />
                        <div className="min-w-0"><p className="font-semibold">{it.name}</p><p className="text-[11px] text-amute">{it.note}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{it.qty}</td>
                    <td className="px-3 py-3">{bdt(it.price)}</td>
                    <td className="px-3 py-3 font-bold sm:px-4">{bdt(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <div className="w-full space-y-2 sm:max-w-[300px]">
              <KV k="Subtotal" v="৳3,040" />
              <KV k="Delivery (Inside Dhaka)" v="৳60" />
              <KV k="Discount (XERQO500)" v="− ৳500" />
              <div className="!mt-3 flex items-center justify-between rounded-md bg-espresso px-4 py-3.5 text-white">
                <span className="text-[13px] font-semibold">Amount due (COD)</span>
                <span className="text-xl font-bold text-gold">৳2,600</span>
              </div>
            </div>
          </div>

          <footer className="mt-7 flex flex-col gap-3 border-t border-aline pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold">Thank you for choosing XERQO!</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amute">7-day easy return · 1-year stitching warranty<br />Scan to track your order</p>
            </div>
            <div className="grid size-[62px] shrink-0 grid-cols-7 grid-rows-7 border border-ink p-1">
              {QR.map((on, i) => <span key={i} className={on ? 'bg-ink' : ''} />)}
            </div>
          </footer>
        </article>

        <Card title="Packing slip" sub="For warehouse — no prices">
          <KV k="Order" v={<b>#{o.id}</b>} />
          <ul className="divide-y divide-aline">
            {SLIP.map(([t, s]) => (
              <li key={t} className="flex items-start gap-3 py-3">
                <input type="checkbox" className="mt-0.5 size-4 accent-tan" aria-label={t} />
                <div><p className="text-[13px]">{t}</p><p className="text-[11px] text-violet">{s || '—'}</p></div>
              </li>
            ))}
          </ul>
          <div className="space-y-2.5 border-t border-aline pt-4">
            <KV k="Packed by" v="Rakib (Warehouse)" />
            <KV k="Courier" v="Steadfast · 0.3 kg" />
          </div>
          <Btn v="white" icon={Printer} className="w-full" onClick={() => window.print()}>Print packing slip</Btn>
        </Card>
      </div>
    </>
  )
}
