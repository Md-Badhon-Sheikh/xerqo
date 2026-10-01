import { Link } from 'react-router-dom'
import { ArrowRight, Download, Plus, Search, SlidersHorizontal, Truck, Printer, MoreHorizontal } from 'lucide-react'
import { Badge, Btn, PageHead, PayChip, Pager, Select, Table, Tabs } from '../../components/admin/ui'
import { orders } from '../../data/admin'

export const Tk = (n) => 'Tk ' + Number(n).toLocaleString('en-IN')
export const AGO = ['2m ago', '18m ago', '42m ago', '1h ago', '3h ago', '5h ago', '6h ago', '8h ago']
export const orderId = (id) => id

/* Mobile order card — used by Orders, Dashboard and Customer detail */
export function OrderCard({ o, ago }) {
  return (
    <Link to={`/admin/orders/${orderId(o.id)}`} className="block rounded-xl border border-aline bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold">#{o.id}</p>
        <Badge>{o.status}</Badge>
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{o.customer}</p>
          <p className="truncate text-[11px] text-amute">{o.phone} · {o.city}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-[15px] font-bold">{Tk(o.total)}</p>
          <PayChip m={o.pay} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-aline pt-2.5 text-xs">
        <span className="text-amute">{o.items} item(s) · {ago}</span>
        <span className="flex items-center gap-1 font-semibold text-tan">View <ArrowRight className="size-3" /></span>
      </div>
    </Link>
  )
}

const TABS = [['All', '938'], ['Pending', '18'], ['Confirmed', '24'], ['Packed', '11'], ['Shipped', '32'], ['Delivered', '842'], ['Cancelled', '7'], ['Returned', '4']]
const SELECTED = 3

export default function Orders() {
  const cols = [
    { h: '', className: 'w-10 !pr-0' },
    { h: 'Order', b: true },
    { h: 'Customer' },
    { h: 'Items', className: 'max-xl:hidden' },
    { h: 'Total' },
    { h: 'Payment', className: 'max-xl:hidden' },
    { h: 'Status' },
    { h: 'District', mute: true, className: 'max-xl:hidden' },
    { h: 'Date', mute: true, className: 'max-lg:hidden' },
    { h: '', className: 'w-10', right: true },
  ]
  const rows = orders.map((o, i) => [
    <input type="checkbox" defaultChecked={i < SELECTED} className="size-4 accent-tan" aria-label={`Select ${o.id}`} />,
    <Link to={`/admin/orders/${orderId(o.id)}`} className="whitespace-nowrap hover:text-tan">#{o.id}</Link>,
    <div><p className="font-semibold">{o.customer}</p><p className="text-[11px] text-amute">{o.phone}</p></div>,
    o.items,
    <span className="whitespace-nowrap">{Tk(o.total)}</span>,
    <PayChip m={o.pay} />,
    <Badge>{o.status}</Badge>,
    o.city,
    <span className="whitespace-nowrap">{AGO[i]}</span>,
    <Link to={`/admin/orders/${orderId(o.id)}`} aria-label="Open order" className="flex justify-end text-amute hover:text-ink"><MoreHorizontal className="size-4" /></Link>,
  ])

  return (
    <>
      <PageHead
        title="Orders"
        sub="938 orders · 24 need action"
        actions={<>
          <Btn v="white" icon={Download}><span className="sm:hidden">Export</span><span className="max-sm:hidden">Export CSV</span></Btn>
          <Btn icon={Plus}><span className="sm:hidden">Create</span><span className="max-sm:hidden">Create order</span></Btn>
        </>}
      />

      <Tabs items={TABS} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-aline bg-white px-3 py-2.5 text-[13px]">
          <Search className="size-4 text-amute" />
          <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-amute" placeholder="Search by order ID, name or phone" />
        </label>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2.5">
          <Select options={['Payment: All', 'COD', 'bKash', 'Nagad', 'Card']} className="sm:w-40" />
          <Select options={['District: All', 'Dhaka', 'Chattogram', 'Sylhet', 'Khulna']} className="sm:w-40" />
          <Select options={['Date: Last 7 days', 'Today', 'Last 30 days']} className="sm:w-44 md:max-lg:hidden" />
          <button aria-label="More filters" className="hidden size-[42px] shrink-0 place-items-center rounded-lg border border-aline bg-white sm:grid"><SlidersHorizontal className="size-4" /></button>
        </div>
      </div>

      {/* Bulk actions (tablet + desktop) */}
      <div className="hidden flex-wrap items-center gap-2.5 rounded-xl border border-tan/25 bg-tan/10 px-4 py-3 md:flex">
        <label className="mr-1 flex items-center gap-2.5 text-[13px] font-semibold"><input type="checkbox" defaultChecked className="size-4 accent-tan" />{SELECTED} selected</label>
        <Btn v="white" sm>Confirm</Btn>
        <Btn v="white" sm icon={Truck}>Send to Steadfast</Btn>
        <Btn v="white" sm icon={Printer}>Print invoices</Btn>
        <Btn v="danger" sm>Cancel</Btn>
      </div>

      <Table cols={cols} rows={rows} className="max-md:hidden" />

      <div className="space-y-3 md:hidden">
        {orders.map((o, i) => <OrderCard key={o.id} o={o} ago={AGO[i]} />)}
        <button className="w-full rounded-xl border border-aline bg-white py-3 text-[13px] font-semibold">Load more</button>
      </div>

      <div className="max-md:hidden"><Pager text="Showing 1–8 of 938" /></div>
    </>
  )
}
