import { Link } from 'react-router-dom'
import { Download, MessageSquare, MoreHorizontal, Search } from 'lucide-react'
import { Avatar, Badge, Btn, KPIs, PageHead, Pager, Select, Table, cx } from '../../components/admin/ui'
import { customers } from '../../data/admin'
import { Tk } from './Orders'

// Segment + courier success per customer (mock)
const EXTRA = { 1: ['VIP', 92], 2: ['VIP', 100], 3: ['New', null], 4: ['Regular', 100], 5: ['Regular', 75], 6: ['Risky', 33] }
const SEG_TONE = { VIP: 'tan', Regular: 'blue', New: 'green', Risky: 'red' }
export const successTone = (n) => (n === null ? 'text-amute' : n >= 90 ? 'text-ok' : n >= 60 ? 'text-amber' : 'text-bad')

const LIST = customers.map((c) => {
  const [segment, success] = EXTRA[c.id] || ['Regular', 100]
  return { ...c, segment, success }
})

export default function Customers() {
  const cols = [
    { h: 'Customer' }, { h: 'District', mute: true, className: 'max-lg:hidden' }, { h: 'Orders' }, { h: 'Total spent', b: true },
    { h: 'Courier success', className: 'max-xl:hidden' }, { h: 'Last order', mute: true, className: 'max-xl:hidden' }, { h: 'Segment' }, { h: '', right: true, className: 'w-10' },
  ]
  const rows = LIST.map((c) => [
    <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-2.5"><Avatar name={c.name} size={34} /><div className="min-w-0"><p className="font-semibold hover:text-tan">{c.name}</p><p className="text-[11px] text-amute">{c.phone}</p></div></Link>,
    c.city,
    c.orders,
    <span className="whitespace-nowrap">{Tk(c.spent)}</span>,
    <span className={cx('font-semibold', successTone(c.success))}>{c.success === null ? '—' : `${c.success}%`}</span>,
    <span className="whitespace-nowrap">{c.last}</span>,
    <Badge tone={SEG_TONE[c.segment]}>{c.segment}</Badge>,
    <Link to={`/admin/customers/${c.id}`} aria-label="Open" className="inline-grid text-amute hover:text-ink"><MoreHorizontal className="size-4" /></Link>,
  ])

  return (
    <>
      <PageHead
        title="Customers"
        sub="12,480 customers · 38% repeat rate"
        actions={<>
          <Btn v="white" icon={Download}>Export</Btn>
          <Btn icon={MessageSquare}><span className="sm:hidden">SMS</span><span className="max-sm:hidden">Send SMS campaign</span></Btn>
        </>}
      />

      <KPIs items={[
        ['Total customers', '12,480', '▲ 5.2%'],
        ['New this month', '640', '▲ 12%'],
        ['Repeat rate', '38%', '▲ 2.1%'],
        ['Flagged / blocked', '12', '▼ 3', 'red'],
      ]} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-aline bg-white px-3 py-2.5 text-[13px]">
          <Search className="size-4 text-amute" />
          <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-amute" placeholder="Search name, phone or email" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <Select options={['Segment: All', 'VIP', 'Regular', 'New', 'Risky']} className="sm:w-36" />
          <Select options={['District: All', 'Dhaka', 'Chattogram', 'Sylhet', 'Khulna']} className="sm:w-36" />
        </div>
      </div>

      <Table cols={cols} rows={rows} className="max-md:hidden" />

      <div className="space-y-3 md:hidden">
        {LIST.map((c) => (
          <Link key={c.id} to={`/admin/customers/${c.id}`} className="block rounded-xl border border-aline bg-white p-3.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={c.name} size={34} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{c.name}</p><p className="text-[11px] text-amute">{c.phone}</p></div>
              <Badge tone={SEG_TONE[c.segment]}>{c.segment}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 border-t border-aline pt-2.5 text-xs">
              <div><p className="text-amute">Orders</p><p className="mt-0.5 text-[13px] font-bold">{c.orders}</p></div>
              <div><p className="text-amute">Spent</p><p className="mt-0.5 text-[13px] font-bold">{Tk(c.spent)}</p></div>
              <div className="text-right"><p className="text-amute">Courier ✓</p><p className={cx('mt-0.5 text-[13px] font-bold', successTone(c.success))}>{c.success === null ? '—' : `${c.success}%`}</p></div>
            </div>
          </Link>
        ))}
        <button className="w-full rounded-xl border border-aline bg-white py-3 text-[13px] font-semibold">Load more</button>
      </div>

      <div className="max-md:hidden"><Pager text="Showing 1–6 of 12,480" /></div>
    </>
  )
}
