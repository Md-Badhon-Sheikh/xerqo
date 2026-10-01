import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pencil, Phone, Plus } from 'lucide-react'
import { Avatar, Badge, Btn, Card, Col, KPIs, KV, Thumb, Toggle, Two } from '../../components/admin/ui'
import { customers, products } from '../../data/admin'

const ORDERS = [
  ['XQ-24817', '1 Oct 2026 · ৳2,600', 'Pending', products[5].image],
  ['XQ-23102', '12 Sep 2026 · ৳1,450', 'Delivered', products[0].image],
  ['XQ-21877', '20 Aug 2026 · ৳3,180', 'Delivered', products[11].image],
]
const ACTIVITY = [
  ['Placed order #XQ-24817', '1 Oct, 2:14 AM'],
  ['Left a 5★ review on Classic Bifold Wallet', '28 Jul'],
  ['Delivery feedback: 5★ speed, 4★ courier', '23 Aug'],
  ['Added Everyday Tote Bag to wishlist', '18 Aug'],
  ['Used coupon XERQO500', '1 Oct'],
]

export default function CustomerDetail() {
  const { id } = useParams()
  const c = customers.find((x) => String(x.id) === id) || customers[0]
  const [blocked, setBlocked] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Customers</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="max-sm:hidden"><Avatar name={c.name} size={58} /></span>
            <span className="sm:hidden"><Avatar name={c.name} size={44} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-[22px] font-bold sm:text-[26px]">{c.name}</h1><Badge tone="tan">VIP</Badge></div>
              <p className="text-[13px] text-amute">Customer since Mar 2025 · Dhanmondi, {c.city}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <Btn v="white" icon={Phone}>Call</Btn>
            <Btn v="white" icon={MessageSquare}>SMS</Btn>
            <Btn icon={Plus} to="/admin/orders"><span className="sm:hidden">Order</span><span className="max-sm:hidden">Create order</span></Btn>
          </div>
        </div>
      </div>

      <KPIs items={[
        ['Total spent', '৳7,230', '3 orders'],
        ['Avg order', '৳2,410'],
        ['Courier success', '92%', '11 of 12 delivered'],
        ['Reward points', '120', '≈ ৳120'],
      ]} />

      <Two ratio="main">
        <Col>
          <Card title="Orders" right={<Link to="/admin/orders" className="text-xs font-semibold text-tan">View all</Link>} >
            <div className="divide-y divide-aline">{ORDERS.map(([oid, meta, st, img]) => (
              <Link key={oid} to={`/admin/orders/${oid}`} className="flex items-center gap-3 py-3 first:pt-0 hover:bg-abg/50">
                <Thumb src={img} size={40} />
                <div className="min-w-0 flex-1"><p className="text-[13px] font-bold">#{oid}</p><p className="text-xs text-amute">{meta}</p></div>
                <Badge>{st}</Badge>
              </Link>
            ))}</div>
          </Card>

          <Card title="Activity timeline">
            <ol className="space-y-3.5">
              {ACTIVITY.map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 size-[7px] shrink-0 rounded-full bg-tan" />
                  <div><p className="text-[13px]">{t}</p><p className="text-[11px] text-amute">{d}</p></div>
                </li>
              ))}
            </ol>
          </Card>
        </Col>

        <Col className="md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          <Card title="Contact" right={<button aria-label="Edit contact" className="text-amute hover:text-ink"><Pencil className="size-3.5" /></button>}>
            <KV k="Phone" v={c.phone} />
            <KV k="Email" v={c.email} />
            <KV k="Birthday" v="12 Apr" />
            <KV k="Gender" v="Male" />
          </Card>

          <Card title="Addresses">
            <div><p className="text-[13px] font-semibold">Home (default)</p><p className="text-xs text-amute">House 12, Road 5, Dhanmondi, Dhaka</p></div>
            <div><p className="text-[13px] font-semibold">Office</p><p className="text-xs text-amute">Level 7, Gulshan Avenue, Dhaka</p></div>
          </Card>

          <Card title="Risk & notes" className="md:col-span-2 xl:col-span-1">
            <div className="rounded-lg bg-ok/8 px-3.5 py-3">
              <p className="text-[13px] font-semibold text-ok">Low risk · 92% delivery success</p>
              <p className="mt-0.5 text-[11px] text-amute">Steadfast 8/8 · Pathao 3/4</p>
            </div>
            <div className="flex flex-wrap gap-1.5">{['VIP', 'Gift buyer', 'Engraving'].map((t) => <Badge key={t} tone="purple">{t}</Badge>)}</div>
            <input className="ainput" placeholder="Add internal note…" />
            <div className="flex items-center justify-between text-[13px]">
              <span>Block this customer (COD)</span>
              <button type="button" onClick={() => setBlocked(!blocked)} aria-label="Block customer" className="inline-flex"><Toggle on={blocked} /></button>
            </div>
          </Card>
        </Col>
      </Two>
    </>
  )
}
