import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Calendar, ClipboardList, Download, Plus, Tag, Truck } from 'lucide-react'
import { Badge, Btn, Card, PayChip, Table, Thumb, cx } from '../../components/admin/ui'
import { orders, products } from '../../data/admin'
import { AGO, OrderCard, Tk } from './Orders'

const KPI = [
  ['Today’s revenue', 'Tk 48,250', '12.4%', true, BarChart3],
  ['Orders today', '36', '8.1%', true, ClipboardList],
  ['Pending COD', 'Tk 1,12,400', '3.2%', false, Truck],
  ['Avg. order value', 'Tk 2,310', '4.6%', true, Tag],
]

// Daily revenue in thousands (Tk) for 1–30 Sep
const DAYS30 = [38, 55, 37, 60, 70, 52, 48, 66, 72, 58, 63, 80, 73, 69, 86, 77, 65, 90, 85, 77, 88, 95, 72, 92, 85, 98, 94, 100, 106, 109]
const DAYS7 = [['Sat', 76], ['Sun', 82], ['Mon', 78], ['Tue', 85], ['Wed', 80], ['Thu', 92], ['Fri', 109]]
const MONTHS = [['Oct', 980], ['Nov', 1120], ['Dec', 1640], ['Jan', 1190], ['Feb', 1260], ['Mar', 1580], ['Apr', 1850], ['May', 1420], ['Jun', 1510], ['Jul', 1690], ['Aug', 1880], ['Sep', 2140]]

const STATUS = [['Pending', 18, '#B7791F'], ['Confirmed', 24, '#2C5AA0'], ['Packed', 11, '#6B4FA0'], ['Shipped', 32, '#1F7A8C'], ['Delivered', 142, '#2F7A4B'], ['Returned', 4, '#7A6B60']]
const TOP = [[products[5], 214, 'Tk 5.2L'], [products[0], 188, 'Tk 2.7L'], [products[11], 96, 'Tk 1.2L'], [products[25], 41, 'Tk 2.4L']]
const LOW = [['Zip Long Wallet · Wine', 2], ['Slim Card Holder · Navy', 4], ['Crossbody Mini Bag · Tan', 1]]

function Kpi({ label, value, delta, up, Icon }) {
  return (
    <div className="rounded-xl border border-aline bg-white p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-amute sm:text-[13px]">{label}</p>
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-asoft text-tan sm:size-8"><Icon className="size-3.5 sm:size-4" /></span>
      </div>
      <p className="mt-1 text-lg font-bold sm:mt-3 sm:text-[26px]">{value}</p>
      <p className="mt-1 text-xs"><span className={cx('font-semibold', up ? 'text-ok' : 'text-bad')}>{up ? '▲' : '▼'} {delta}</span><span className="text-amute max-sm:hidden"> vs last week</span></p>
    </div>
  )
}

/* Simple bar chart drawn with flex + inline heights (no chart library) */
function Bars({ data, max, ticks, labelEvery = 1 }) {
  return (
    <div className="flex gap-2">
      <div className="flex h-[200px] flex-col justify-between pb-0 text-right text-[10px] text-amute sm:h-[220px]">
        {ticks.map((t) => <span key={t} className="-translate-y-1/2 leading-none">{t}</span>)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-[200px] sm:h-[220px]">
          <div className="absolute inset-0 flex flex-col justify-between">{ticks.map((t) => <span key={t} className="h-px bg-aline" />)}</div>
          <div className="relative flex h-full items-end gap-[3px] px-1 sm:gap-1.5 lg:gap-2">
            {data.map(([l, v], i) => (
              <div key={i} title={`${l}: ৳${v}k`} style={{ height: `${(v / max) * 100}%` }}
                className={cx('flex-1 rounded-t-[3px] transition hover:opacity-80', i === data.length - 1 ? 'bg-tan' : 'bg-[#DCC6AA]')} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-[3px] px-1 text-[10px] text-amute sm:gap-1.5 lg:gap-2">
          {data.map(([l], i) => <span key={i} className="flex-1 whitespace-nowrap text-center">{i % labelEvery === 0 ? l : ''}</span>)}
        </div>
      </div>
    </div>
  )
}

function RevenueChart() {
  const [range, setRange] = useState('30D')
  const d30 = DAYS30.map((v, i) => [`${i + 1} Sep`, v])
  return (
    <Card
      title="Revenue"
      right={
        <div className="flex rounded-lg bg-asoft p-1 text-xs">
          {['7D', '30D', '12M'].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={cx('rounded-md px-2.5 py-1', range === r ? 'bg-white font-semibold shadow-sm' : 'text-amute')}>{r}</button>
          ))}
        </div>
      }
    >
      {range === '7D' && <Bars data={DAYS7} max={120} ticks={['৳120k', '৳90k', '৳60k', '৳30k', '0']} />}
      {range === '12M' && <Bars data={MONTHS} max={2400} ticks={['৳24L', '৳18L', '৳12L', '৳6L', '0']} />}
      {range === '30D' && <>
        <div className="sm:hidden"><Bars data={DAYS7} max={120} ticks={['৳120k', '৳90k', '৳60k', '৳30k', '0']} /></div>
        <div className="max-sm:hidden"><Bars data={d30} max={120} ticks={['৳120k', '৳90k', '৳60k', '৳30k', '0']} labelEvery={5} /></div>
      </>}
      <div className="flex gap-7 pt-1 sm:gap-8">
        {[['Total', 'Tk 21.4L'], ['Orders', '938'], ['Returns', '1.8%']].map(([k, v]) => (
          <div key={k}><p className="text-xs text-amute">{k}</p><p className="text-base font-bold">{v}</p></div>
        ))}
      </div>
    </Card>
  )
}

function OrderStatus() {
  const max = 230
  return (
    <Card title="Order status">
      {STATUS.map(([s, n, c]) => (
        <div key={s}>
          <div className="flex justify-between text-[13px]"><span>{s}</span><span className="font-semibold">{n}</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-asoft"><div className="h-full rounded-full" style={{ width: `${Math.max((n / max) * 100, 3)}%`, background: c }} /></div>
        </div>
      ))}
    </Card>
  )
}

function RecentOrders() {
  const recent = orders.slice(0, 5)
  const cols = [{ h: 'Order', b: true }, { h: 'Customer' }, { h: 'Payment', className: 'max-xl:hidden' }, { h: 'Total' }, { h: 'Status' }]
  const rows = recent.map((o) => [
    <Link to={`/admin/orders/${o.id}`} className="whitespace-nowrap hover:text-tan">#{o.id}</Link>,
    <span className="whitespace-nowrap">{o.customer}</span>, <PayChip m={o.pay} />, <span className="whitespace-nowrap">{Tk(o.total)}</span>, <Badge>{o.status}</Badge>,
  ])
  return (
    <Card title="Recent orders" right={<Link to="/admin/orders" className="flex items-center gap-1 text-[13px] font-semibold text-tan">View all <ArrowRight className="size-3.5" /></Link>}>
      <Table cols={cols} rows={rows} className="rounded-none border-0 max-sm:hidden" />
      <div className="space-y-3 sm:hidden">{recent.slice(0, 3).map((o, i) => <OrderCard key={o.id} o={o} ago={AGO[i]} />)}</div>
    </Card>
  )
}

export default function Dashboard() {
  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold sm:text-[26px]">Good morning, Dip 👋</h1>
          <p className="mt-1 text-[13px] text-amute">Here’s what’s happening at XERQO today.</p>
        </div>
        <div className="flex gap-2 max-sm:hidden">
          <Btn v="white" icon={Calendar}>Last 30 days</Btn>
          <Btn v="white" icon={Download}>Export</Btn>
          <Btn to="/admin/products/new" icon={Plus}>Add product</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {KPI.map(([l, v, d, up, I]) => <Kpi key={l} label={l} value={v} delta={d} up={up} Icon={I} />)}
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.9fr_1fr]">
        <RevenueChart />
        <OrderStatus />
      </div>

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.7fr_1fr] xl:items-start">
        <RecentOrders />
        <div className="space-y-4 sm:space-y-5">
          <Card title="Top products">
            {TOP.map(([p, sold, rev]) => (
              <div key={p.id} className="flex items-center gap-3">
                <Thumb src={p.image} size={44} />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{p.name}</p><p className="text-[11px] text-amute">{sold} sold</p></div>
                <p className="text-[13px] font-bold">{rev}</p>
              </div>
            ))}
          </Card>
          <Card title="Low stock alert" right={<Badge tone="red">3 items</Badge>}>
            {LOW.map(([n, left]) => (
              <div key={n} className="flex justify-between gap-3 text-[13px]"><span className="truncate">{n}</span><span className="shrink-0 font-semibold text-bad">{left} left</span></div>
            ))}
            <Btn to="/admin/inventory" v="soft" className="w-full">Restock now</Btn>
          </Card>
        </div>
      </div>
    </>
  )
}
