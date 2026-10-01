import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessageCircle, Pencil, Phone, Printer, Truck } from 'lucide-react'
import { Badge, Btn, Card, Col, Field, KV, Avatar, PayChip, Select, Thumb, Two, cx } from '../../components/admin/ui'
import { orders, products } from '../../data/admin'
import { Tk } from './Orders'

const ITEMS = [
  { p: products[5], sku: 'XQ-LW-COG', variant: 'Cognac', qty: 1, price: 2450, engrave: 'M.H.D' },
  { p: products[15], name: 'Loop Key Holder', sku: 'XQ-KH-TAN', variant: 'Tan', qty: 1, price: 590 },
]

const TIMELINE = [
  ['Order placed by customer', '1 Oct, 2:14 AM', 'done'],
  ['SMS confirmation sent to 01712-XXXXXX', '1 Oct, 2:14 AM', 'done'],
  ['Call verification pending', 'Assigned to Nabila (CS)', 'now'],
  ['Engraving queue', 'Waiting for confirmation', 'todo'],
]
const DOT = { done: 'bg-ok', now: 'bg-amber', todo: 'bg-aline' }

export default function OrderDetail() {
  const { id } = useParams()
  const o = orders.find((x) => x.id === id || x.id === `XQ-${id}`) || orders[0]
  const [notify, setNotify] = useState(true)

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Back to orders</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-bold sm:text-[26px]">Order #{o.id}</h1>
              <Badge>{o.status}</Badge><PayChip m={o.pay} />
            </div>
            <p className="mt-1 text-[13px] text-amute">{o.date.includes(',') ? o.date : `${o.date}, 2:14 AM`} · via Website</p>
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 sm:flex">
            <Btn to={`/admin/invoice/${o.id}`} v="white" icon={Printer} aria-label="Print invoice"><span className="max-sm:hidden">Print invoice</span></Btn>
            <Btn v="danger">Cancel order</Btn>
            <Btn v="green" icon={Check}>Confirm order</Btn>
          </div>
        </div>
      </div>

      <Two ratio="main">
        <Col>
          <Card title="Items (2)" right={<Badge tone="purple">Engraving required</Badge>}>
            <div className="divide-y divide-aline">
              {ITEMS.map((it) => (
                <div key={it.sku} className="flex gap-3 py-3.5 first:pt-0">
                  <Thumb src={it.p.image} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold sm:text-sm">{it.name || it.p.name}</p>
                    <p className="text-[11px] text-amute sm:text-xs">SKU {it.sku} · {it.variant}</p>
                    {it.engrave && <span className="mt-1.5 inline-block rounded bg-violet/10 px-2 py-0.5 text-[11px] font-semibold text-violet">Engrave: “{it.engrave}”</span>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{Tk(it.price * it.qty)}</p>
                    <p className="text-[11px] text-amute">{it.qty} × {Tk(it.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-aline pt-4">
              <KV k="Subtotal" v="Tk 3,040" />
              <KV k="Delivery · Inside Dhaka" v="Tk 60" />
              <KV k="Coupon XERQO500" v="− Tk 500" />
              <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>Tk 2,600</span></div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-asoft px-3.5 py-3 text-[13px] font-semibold text-tan">
                <span>Cash on Delivery — collect on delivery</span><span className="shrink-0">Tk 2,600</span>
              </div>
            </div>
          </Card>

          <Card title="Timeline & activity">
            <ol className="relative space-y-4">
              <span className="absolute bottom-3 left-[4px] top-2 w-px bg-aline" />
              {TIMELINE.map(([t, s, st]) => (
                <li key={t} className="relative flex gap-3.5">
                  <span className={cx('relative mt-1 size-[9px] shrink-0 rounded-full ring-4 ring-white', DOT[st])} />
                  <div><p className="text-[13px] font-medium">{t}</p><p className="text-[11px] text-amute">{s}</p></div>
                </li>
              ))}
            </ol>
            <input className="ainput" placeholder="Add an internal note…" />
          </Card>
        </Col>

        <Col className="md:grid md:grid-cols-2 md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          <Card title="Customer" right={<Link to="/admin/customers/1" className="text-xs font-semibold text-tan">View profile</Link>}>
            <div className="flex items-center gap-3">
              <Avatar name={o.customer} size={40} />
              <div><p className="text-sm font-semibold">{o.customer}</p><p className="text-xs text-amute">3 orders · Tk 7,230 lifetime</p></div>
            </div>
            <div className="space-y-2.5"><KV k="Phone" v={o.phone} /><KV k="Email" v="rahim@email.com" /></div>
            <div className="grid grid-cols-2 gap-2.5"><Btn v="white" icon={Phone}>Call</Btn><Btn v="white" icon={MessageCircle}>WhatsApp</Btn></div>
            <div className="rounded-lg bg-ok/8 px-3.5 py-3">
              <p className="text-[13px] font-semibold text-ok">Courier success rate · 92%</p>
              <p className="mt-0.5 text-[11px] text-amute">11 delivered · 1 returned (Steadfast, Pathao)</p>
            </div>
          </Card>

          <Card title="Shipping address" right={<button aria-label="Edit address" className="text-amute hover:text-ink"><Pencil className="size-3.5" /></button>}>
            <p className="text-[13px] leading-relaxed">House 12, Road 5, Dhanmondi<br />Dhaka 1205, Bangladesh</p>
            <KV k="Zone" v="Inside Dhaka" />
          </Card>

          <Card title="Courier booking">
            <Field label="Courier"><Select options={['Steadfast Courier', 'Pathao Courier', 'RedX']} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight" defaultValue="0.3 kg" />
              <Field label="COD amount" defaultValue="Tk 2,600" />
            </div>
            <Btn icon={Truck} className="w-full">Book courier &amp; print label</Btn>
          </Card>

          <Card title="Update status">
            <Field label="Order status"><Select options={['Confirmed', 'Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled']} /></Field>
            <label className="flex items-center gap-2.5 text-[13px]"><input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} className="size-4 accent-tan" />Notify customer by SMS</label>
            <Btn className="w-full">Save changes</Btn>
          </Card>
        </Col>
      </Two>
    </>
  )
}
