import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BarChart3, ClipboardList, Package, Plus, Star, Tag, Truck, Undo2, Wallet } from 'lucide-react'
import { Badge, Btn, Card, PayChip, Table, Thumb, cx } from '../../components/admin/ui'
import { LoadingBlock } from '../../components/admin/form'
import { ORDER_STATUS, OrderBadge, Tk, ago, shortTk } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { useAdminList } from '../../lib/adminQueries'
import { OrderCard } from './Orders'

const STATUS_COLOR = { pending: '#B7791F', confirmed: '#2C5AA0', processing: '#6B4FA0', shipped: '#1F7A8C', delivered: '#2F7A4B', cancelled: '#B83A3A', returned: '#7A6B60' }
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

// % change vs the previous period; null when there is nothing to compare with
const change = (now, before) => (before > 0 ? ((now - before) / before) * 100 : null)

function Kpi({ label, value, delta, vs, note, Icon, to }) {
  const up = delta == null || delta >= 0
  return (
    <Link to={to} className="rounded-xl border border-aline bg-white p-3.5 transition hover:border-tan/40 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-amute sm:text-[13px]">{label}</p>
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-asoft text-tan sm:size-8"><Icon className="size-3.5 sm:size-4" /></span>
      </div>
      <p className="mt-1 text-lg font-bold sm:mt-3 sm:text-[26px]">{value}</p>
      <p className="mt-1 text-xs">
        {delta != null
          ? <><span className={cx('font-semibold', up ? 'text-ok' : 'text-bad')}>{up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%</span><span className="text-amute max-sm:hidden"> vs {vs}</span></>
          : <span className="text-amute">{note}</span>}
      </p>
    </Link>
  )
}

// a round-number top for the y axis
function niceMax(v) {
  if (v <= 0) return 1000
  const pow = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((n) => n >= v)
}
const axis = (v) => (v >= 100000 ? `৳${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `৳${+(v / 1000).toFixed(1)}k` : `৳${v}`)

/* Simple bar chart drawn with flex + inline heights (no chart library) */
function Bars({ points, labelEvery = 1 }) {
  const max = niceMax(Math.max(...points.map((p) => p.revenue)))
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0]
  return (
    <div className="flex gap-2">
      <div className="flex h-[200px] flex-col justify-between text-right text-[10px] text-amute sm:h-[220px]">
        {ticks.map((t) => <span key={t} className="-translate-y-1/2 leading-none">{t ? axis(t) : '0'}</span>)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-[200px] sm:h-[220px]">
          <div className="absolute inset-0 flex flex-col justify-between">{ticks.map((t) => <span key={t} className="h-px bg-aline" />)}</div>
          <div className="relative flex h-full items-end gap-[3px] px-1 sm:gap-1.5 lg:gap-2">
            {points.map((p, i) => (
              <div key={p.key} title={`${p.label}: ${Tk(p.revenue)} · ${p.orders} order${p.orders === 1 ? '' : 's'}`} style={{ height: `${Math.max((p.revenue / max) * 100, p.revenue ? 1.5 : 0)}%` }}
                className={cx('flex-1 rounded-t-[3px] transition hover:opacity-80', i === points.length - 1 ? 'bg-tan' : 'bg-[#DCC6AA]')} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-[3px] px-1 text-[10px] text-amute sm:gap-1.5 lg:gap-2">
          {points.map((p, i) => <span key={p.key} className="flex-1 whitespace-nowrap text-center">{i % labelEvery === 0 ? (p.day && points.length <= 7 ? p.day : p.label) : ''}</span>)}
        </div>
      </div>
    </div>
  )
}

function RevenueChart({ range, setRange, chart, loading }) {
  return (
    <Card
      title="Revenue"
      sub="Orders placed, excluding cancelled and returned"
      right={
        <div className="flex rounded-lg bg-asoft p-1 text-xs">
          {[['7d', '7D'], ['30d', '30D'], ['12m', '12M']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setRange(k)} className={cx('rounded-md px-2.5 py-1', range === k ? 'bg-white font-semibold shadow-sm' : 'text-amute')}>{l}</button>
          ))}
        </div>
      }
    >
      <div className={cx('transition-opacity', loading && 'opacity-50')}>
        {chart.range === '30d' ? <>
          <div className="sm:hidden"><Bars points={chart.points.slice(-7)} /></div>
          <div className="max-sm:hidden"><Bars points={chart.points} labelEvery={5} /></div>
        </> : <Bars points={chart.points} />}
      </div>
      <div className="flex gap-7 pt-1 sm:gap-8">
        {[['Total', shortTk(chart.revenue)], ['Orders', chart.orders.toLocaleString()], ['Returns', `${chart.return_rate}%`]].map(([k, v]) => (
          <div key={k}><p className="text-xs text-amute">{k}</p><p className="text-base font-bold">{v}</p></div>
        ))}
      </div>
    </Card>
  )
}

function OrderStatus({ counts }) {
  const max = Math.max(1, ...Object.values(counts))
  return (
    <Card title="Order status" sub="All orders" right={<Link to="/admin/orders" className="text-[13px] font-semibold text-tan">Open</Link>}>
      {Object.entries(ORDER_STATUS).map(([key, [label]]) => (
        <Link key={key} to={`/admin/orders?status=${key}`} className="block">
          <div className="flex justify-between text-[13px]"><span>{label}</span><span className="font-semibold">{counts[key] ?? 0}</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-asoft"><div className="h-full rounded-full" style={{ width: `${Math.max(((counts[key] ?? 0) / max) * 100, 3)}%`, background: STATUS_COLOR[key] }} /></div>
        </Link>
      ))}
    </Card>
  )
}

function Tasks({ tasks }) {
  const { can } = useAdminAuth()
  const items = [
    ['orders', ClipboardList, tasks.orders_pending, 'orders to confirm', '/admin/orders'],
    ['payments', Wallet, tasks.payments_to_verify, 'payments to verify', '/admin/payments'],
    ['shipments', Truck, tasks.to_ship, 'orders to ship', '/admin/shipments'],
    ['returns', Undo2, tasks.returns_pending, 'return requests', '/admin/returns'],
    ['reviews', Star, tasks.reviews_pending, 'reviews to moderate', '/admin/reviews'],
  ].filter(([m, , n]) => can(m) && n > 0)
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([m, Icon, n, label, to]) => (
        <Link key={m} to={to} className="flex items-center gap-2 rounded-full border border-tan/30 bg-tan/10 px-3 py-1.5 text-[13px] hover:bg-tan/15">
          <Icon className="size-3.5 text-tan" /><b>{n}</b> {label}<ArrowRight className="size-3 text-tan" />
        </Link>
      ))}
    </div>
  )
}

function RecentOrders({ orders }) {
  const cols = [{ h: 'Order', b: true }, { h: 'Customer' }, { h: 'Payment', className: 'max-xl:hidden' }, { h: 'Total' }, { h: 'Status' }, { h: 'Placed', mute: true, className: 'max-lg:hidden' }]
  const rows = orders.map((o) => [
    <Link to={`/admin/orders/${o.order_number}`} className="whitespace-nowrap hover:text-tan">#{o.order_number}</Link>,
    <span className="whitespace-nowrap">{o.name}</span>, <PayChip m={o.payment_method} />, <span className="whitespace-nowrap">{Tk(o.total)}</span>, <OrderBadge s={o.status} />,
    <span className="whitespace-nowrap">{ago(o.created_at)}</span>,
  ])
  return (
    <Card title="Recent orders" right={<Link to="/admin/orders" className="flex items-center gap-1 text-[13px] font-semibold text-tan">View all <ArrowRight className="size-3.5" /></Link>}>
      {!orders.length ? <p className="text-[13px] text-amute">No orders yet.</p> : <>
        <Table cols={cols} rows={rows} className="rounded-none border-0 max-sm:hidden" />
        <div className="space-y-3 sm:hidden">{orders.slice(0, 3).map((o) => <OrderCard key={o.id} o={o} />)}</div>
      </>}
    </Card>
  )
}

export default function Dashboard() {
  const { user, can } = useAdminAuth()
  const [range, setRange] = useState('30d')
  const { data, isPending, isPlaceholderData } = useAdminList('dashboard', { range })
  const d = data?.data

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold sm:text-[26px]">{greeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
          <p className="mt-1 text-[13px] text-amute">Here’s what’s happening at XERQO today.</p>
        </div>
        <div className="flex gap-2 max-sm:hidden">
          {can('reports') && <Btn v="white" icon={BarChart3} to="/admin/reports">Reports</Btn>}
          {can('products', 'create') && <Btn to="/admin/products/new" icon={Plus}>Add product</Btn>}
        </div>
      </div>

      {isPending || !d ? <LoadingBlock rows={8} /> : <>
        <Tasks tasks={d.tasks} />

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          <Kpi label="Today’s revenue" value={Tk(d.kpis.revenue_today.value)} delta={change(d.kpis.revenue_today.value, d.kpis.revenue_today.previous)} vs="yesterday" note={`Yesterday ${Tk(d.kpis.revenue_today.previous)}`} Icon={BarChart3} to="/admin/orders" />
          <Kpi label="Orders today" value={d.kpis.orders_today.value} delta={change(d.kpis.orders_today.value, d.kpis.orders_today.previous)} vs="yesterday" note={`Yesterday ${d.kpis.orders_today.previous}`} Icon={ClipboardList} to="/admin/orders" />
          <Kpi label="COD to collect" value={shortTk(d.kpis.cod_pending.value)} note={`${d.kpis.cod_pending.orders} parcel${d.kpis.cod_pending.orders === 1 ? '' : 's'} not yet paid`} Icon={Truck} to="/admin/shipments" />
          <Kpi label="Avg. order value" value={Tk(Math.round(d.kpis.average_order.value))} delta={change(d.kpis.average_order.value, d.kpis.average_order.previous)} vs="last month" note="This month" Icon={Tag} to="/admin/orders" />
        </div>

        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.9fr_1fr]">
          <RevenueChart range={range} setRange={setRange} chart={d.chart} loading={isPlaceholderData} />
          <OrderStatus counts={d.orders_by_status} />
        </div>

        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.7fr_1fr] xl:items-start">
          <RecentOrders orders={d.recent_orders} />
          <div className="space-y-4 sm:space-y-5">
            <Card title="Top products" sub="Last 30 days">
              {!d.top_products.length ? <p className="text-[13px] text-amute">No sales in the last 30 days.</p> : d.top_products.map((p) => (
                <div key={p.product_id} className="flex items-center gap-3">
                  {p.image ? <Thumb src={p.image} size={44} /> : <span className="grid size-11 place-items-center rounded-md bg-asoft"><Package className="size-4 text-amute" /></span>}
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{p.name}</p><p className="text-[11px] text-amute">{p.sold} sold</p></div>
                  <p className="text-[13px] font-bold">{shortTk(p.revenue)}</p>
                </div>
              ))}
            </Card>
            <Card title="Low stock alert" right={d.low_stock.count > 0 ? <Badge tone="red">{d.low_stock.count} item{d.low_stock.count === 1 ? '' : 's'}</Badge> : <Badge tone="green">All good</Badge>}>
              {!d.low_stock.items.length ? <p className="text-[13px] text-amute">Every product is above its low-stock level.</p> : d.low_stock.items.map((p) => (
                <div key={p.id} className="flex justify-between gap-3 text-[13px]">
                  <span className="flex min-w-0 items-center gap-1.5 truncate">{p.stock === 0 && <AlertTriangle className="size-3.5 shrink-0 text-bad" />}<span className="truncate">{p.name}</span></span>
                  <span className={cx('shrink-0 font-semibold', p.stock === 0 ? 'text-bad' : 'text-amber')}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                </div>
              ))}
              {can('inventory') && <Btn to="/admin/inventory?stock=low" v="soft" className="w-full">Restock now</Btn>}
            </Card>
          </div>
        </div>
      </>}
    </>
  )
}
