import { useState } from 'react'
import { Download, Package } from 'lucide-react'
import { Btn, Card, Col, PageHead, Thumb, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock } from '../../components/admin/form'
import { METHOD_LABEL, Tk, shortTk } from '../../components/admin/orderUi'
import DateRange, { fmtRange, rangeFor } from '../../components/admin/DateRange'
import { useAdminList } from '../../lib/adminQueries'

const PAY_COLOR = { cod: 'bg-ink', bkash: 'bg-bkash', nagad: 'bg-nagad', rocket: 'bg-violet', bank: 'bg-info', card: 'bg-info' }
const change = (now, before) => (before > 0 ? ((now - before) / before) * 100 : null)

function Kpi({ label, value, now, before, invert, note }) {
  const d = change(now, before)
  const good = d == null ? null : invert ? d <= 0 : d >= 0
  return (
    <div className="rounded-xl border border-aline bg-white p-3.5 sm:p-[18px]">
      <p className="text-xs text-amute">{label}</p>
      <p className="mt-1.5 text-xl font-bold sm:text-2xl">{value}</p>
      <p className={cx('mt-1 text-xs font-semibold', good == null ? 'text-amute' : good ? 'text-ok' : 'text-bad')}>
        {d == null ? note ?? 'No earlier data' : `${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}% vs previous period`}
      </p>
    </div>
  )
}

function Bar({ label, value, pct, color = 'bg-tan', sub }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-amute">{label}{sub && <span className="text-[11px]"> · {sub}</span>}</span><b className="font-semibold">{value}</b></div>
      <div className="h-1.5 rounded-full bg-asoft"><div style={{ width: `${Math.max(pct, 2)}%` }} className={cx('h-full rounded-full', color)} /></div>
    </div>
  )
}

function RevenueChart({ points }) {
  const max = Math.max(1, ...points.map((p) => p.revenue))
  const total = points.reduce((s, p) => s + p.revenue, 0)
  const every = Math.ceil(points.length / 8)
  return (
    <Card title="Revenue over time" right={<span className="text-[13px] font-semibold text-tan">{shortTk(total)} total</span>}>
      <div className="relative h-[150px] sm:h-[190px]">
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ top: `${i * 25}%` }} className="absolute inset-x-0 border-t border-aline/70" />)}
        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-aline sm:gap-1">
          {points.map((p, i) => (
            <div key={p.key} title={`${p.label}: ${Tk(p.revenue)} · ${p.orders} order${p.orders === 1 ? '' : 's'}`} style={{ height: `${(p.revenue / max) * 100}%` }}
              className={cx('min-h-px flex-1 rounded-t-sm', i === points.length - 1 ? 'bg-tan' : 'bg-[#DCC6AE] hover:bg-[#cdb093]')} />
          ))}
        </div>
      </div>
      <div className="flex gap-[2px] text-[10px] text-amute sm:gap-1">
        {points.map((p, i) => <span key={p.key} className="flex-1 overflow-visible whitespace-nowrap">{i % every === 0 ? p.label : ''}</span>)}
      </div>
    </Card>
  )
}

function download(name, rows) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: name })
  a.click(); URL.revokeObjectURL(a.href)
}

export default function AdminReports() {
  const [range, setRange] = useState(() => rangeFor('this_month'))
  const { data: d, isPending, isPlaceholderData } = useAdminList('reports/sales', { from: range.from, to: range.to })

  const exportCsv = () => {
    if (!d) return
    const tag = `${d.range.from}_${d.range.to}`
    download(`xerqo-sales-${tag}.csv`, [
      ['Date', 'Orders', 'Revenue'], ...d.series.map((p) => [p.key, p.orders, p.revenue]),
      [], ['Product', 'Units', 'Revenue', 'Returned'], ...d.products.map((p) => [p.name, p.units, p.revenue, p.returned]),
      [], ['Category', 'Units', 'Revenue'], ...d.categories.map((c) => [c.name, c.units, c.revenue]),
      [], ['Payment method', 'Orders', 'Revenue'], ...d.payments.map((p) => [METHOD_LABEL[p.method] ?? p.method, p.orders, p.revenue]),
      [], ['District', 'Orders', 'Revenue'], ...d.districts.map((x) => [x.district, x.orders, x.revenue]),
    ])
  }

  const k = d?.kpis
  const p = d?.previous
  const catMax = Math.max(1, ...(d?.categories ?? []).map((c) => c.revenue))
  const payTotal = (d?.payments ?? []).reduce((s, x) => s + x.revenue, 0) || 1
  const distMax = Math.max(1, ...(d?.districts ?? []).map((x) => x.orders))

  return (
    <>
      <PageHead
        title="Reports & analytics"
        sub={d ? `${fmtRange(d.range.from, d.range.to)} · compared with ${fmtRange(d.range.previous.from, d.range.previous.to)}` : 'Sales by order date — cancelled and returned orders are left out'}
        actions={<Btn v="white" icon={Download} onClick={exportCsv} disabled={!d}>Export CSV</Btn>}
      />
      <DateRange value={range} onChange={setRange} />

      {isPending || !d ? <LoadingBlock rows={8} /> : (
        <div className={cx('space-y-4 transition-opacity sm:space-y-5', isPlaceholderData && 'opacity-60')}>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <Kpi label="Revenue" value={shortTk(k.revenue)} now={k.revenue} before={p.revenue} />
            <Kpi label="Orders" value={k.orders.toLocaleString()} now={k.orders} before={p.orders} />
            <Kpi label="Avg order value" value={Tk(Math.round(k.average_order))} now={k.average_order} before={p.average_order} />
            <Kpi label="Return rate" value={`${k.return_rate}%`} now={k.return_rate} before={p.return_rate} invert note={`${k.cancelled} cancelled (${k.cancel_rate}%)`} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {[['Units sold', k.units.toLocaleString()], ['New customers', k.new_customers.toLocaleString()], ['Discounts given', Tk(k.discounts)], ['Delivery charges', Tk(k.delivery_charges)]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-asoft px-3.5 py-3"><p className="text-[11px] text-amute">{l}</p><p className="text-base font-bold">{v}</p></div>
            ))}
          </div>

          {!k.orders ? <EmptyBlock title="No sales in this period" text="Pick another date range." /> : (
            <Two ratio="main">
              <Col>
                <RevenueChart points={d.series} />
                <Card title="Sales by category">
                  {d.categories.map((c) => <Bar key={c.name} label={c.name} sub={`${c.units} pcs`} value={shortTk(c.revenue)} pct={(c.revenue / catMax) * 100} />)}
                </Card>
                <Card title="Top products">
                  <div className="overflow-hidden rounded-lg">
                    <table className="w-full text-[13px]">
                      <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
                        <tr><th className="px-3.5 py-3 font-semibold">Product</th><th className="px-3.5 py-3 font-semibold max-sm:hidden">Units</th><th className="px-3.5 py-3 font-semibold">Revenue</th><th className="px-3.5 py-3 font-semibold max-sm:hidden">Returned</th></tr>
                      </thead>
                      <tbody className="divide-y divide-aline border-b border-aline">
                        {d.products.map((x) => (
                          <tr key={x.product_id}>
                            <td className="px-3.5 py-3"><div className="flex items-center gap-2.5">{x.image ? <Thumb src={x.image} size={32} /> : <span className="grid size-8 place-items-center rounded-md bg-asoft"><Package className="size-3.5 text-amute" /></span>}<span className="font-medium">{x.name}</span></div></td>
                            <td className="px-3.5 py-3 max-sm:hidden">{x.units}</td>
                            <td className="px-3.5 py-3 font-semibold">{shortTk(x.revenue)}</td>
                            <td className={cx('px-3.5 py-3 max-sm:hidden', x.returned ? 'text-bad' : 'text-amute')}>{x.returned ? `${x.returned} (${Math.round((x.returned / x.units) * 100)}%)` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Col>
              <Col className="md:max-xl:grid md:max-xl:grid-cols-2 md:max-xl:gap-5 md:max-xl:space-y-0!">
                <Card title="Payment methods">
                  <div className="flex h-3 overflow-hidden rounded-full">{d.payments.map((x) => <div key={x.method} style={{ width: `${(x.revenue / payTotal) * 100}%` }} className={PAY_COLOR[x.method] ?? 'bg-tan'} />)}</div>
                  <div className="space-y-2.5">
                    {d.payments.map((x) => (
                      <div key={x.method} className="flex items-center gap-2.5 text-[13px]">
                        <span className={cx('size-2.5 rounded-full', PAY_COLOR[x.method] ?? 'bg-tan')} /><span className="flex-1">{METHOD_LABEL[x.method] ?? x.method} <span className="text-[11px] text-amute">· {x.orders} order{x.orders === 1 ? '' : 's'}</span></span>
                        <b className="font-semibold">{Math.round((x.revenue / payTotal) * 100)}%</b>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Top districts">
                  {d.districts.map((x) => <Bar key={x.district} label={x.district} sub={shortTk(x.revenue)} value={`${x.orders} order${x.orders === 1 ? '' : 's'}`} pct={(x.orders / distMax) * 100} color="bg-info" />)}
                </Card>
                <Card title="Coupons used" className="md:max-xl:col-span-2">
                  {!d.coupons.length ? <p className="text-[13px] text-amute">No coupons used in this period.</p> : d.coupons.map((c) => (
                    <div key={c.code} className="flex justify-between text-[13px]"><span className="font-mono font-semibold">{c.code}</span><span className="text-amute">{c.orders} order{c.orders === 1 ? '' : 's'} · <b className="text-ink">−{Tk(c.discount)}</b></span></div>
                  ))}
                </Card>
              </Col>
            </Two>
          )}
        </div>
      )}
    </>
  )
}
