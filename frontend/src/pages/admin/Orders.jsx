import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Download, MoreHorizontal, Printer, Truck } from 'lucide-react'
import { Badge, Btn, PageHead, PayChip, Select, Table, Tabs, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox, Spin } from '../../components/admin/form'
import { ORDER_STATUS, OrderBadge, PayBadge, Tk as TkFmt, ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm, toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'

export const Tk = TkFmt
export const AGO = ['2m ago', '18m ago', '42m ago', '1h ago', '3h ago', '5h ago', '6h ago', '8h ago']
export const orderId = (id) => id

/* Mobile order card — accepts an API order (or the legacy demo shape used on the dashboard) */
export function OrderCard({ o, ago: when }) {
  const number = o.order_number ?? o.id
  const status = ORDER_STATUS[o.status] ? <OrderBadge s={o.status} /> : <Badge>{o.status}</Badge>
  return (
    <Link to={`/admin/orders/${number}`} className="block rounded-xl border border-aline bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold">#{number}</p>
        {status}
      </div>
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{o.name ?? o.customer}</p>
          <p className="truncate text-[11px] text-amute">{o.phone} · {o.district ?? o.city}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-[15px] font-bold">{Tk(o.total)}</p>
          <PayChip m={o.payment_method ?? o.pay} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-aline pt-2.5 text-xs">
        <span className="text-amute">{o.items_count ?? o.items} item(s) · {when ?? ago(o.created_at)}</span>
        <span className="flex items-center gap-1 font-semibold text-tan">View <ArrowRight className="size-3" /></span>
      </div>
    </Link>
  )
}

const TABS = [['All', 'all', ''], ['Pending', 'pending', 'pending'], ['Confirmed', 'confirmed', 'confirmed'], ['Processing', 'processing', 'processing'], ['Shipped', 'shipped', 'shipped'], ['Delivered', 'delivered', 'delivered'], ['Cancelled', 'cancelled', 'cancelled'], ['Returned', 'returned', 'returned']]
const METHODS = [{ value: '', label: 'Payment: All' }, { value: 'cod', label: 'COD' }, { value: 'bkash', label: 'bKash' }, { value: 'rocket', label: 'Rocket' }, { value: 'nagad', label: 'Nagad' }, { value: 'bank', label: 'Bank' }]
const PAID = [{ value: '', label: 'Paid: All' }, { value: 'pending', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }]
const isoDay = (d) => d.toISOString().slice(0, 10)
const RANGES = { '': null, today: 0, '7': 6, '30': 29 }
const DATES = [{ value: '', label: 'Date: Any time' }, { value: 'today', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }]

// statuses a bulk action can move orders into, with the statuses they must currently be in
const BULK = [['confirmed', 'Confirm', ['pending']], ['processing', 'Start processing', ['confirmed']]]

async function exportCsv(params) {
  try {
    const res = await adminApi.get('/admin/orders', { ...params, per_page: 100, page: 1 })
    const rows = [['Order', 'Date', 'Customer', 'Phone', 'District', 'Items', 'Total', 'Payment', 'Paid', 'Status', 'Courier', 'Tracking']]
    res.data.forEach((o) => rows.push([o.order_number, o.created_at?.slice(0, 10), o.name, o.phone, o.district, o.items_count, o.total, o.payment_method, o.payment_status, o.status, o.courier, o.tracking_code]))
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `xerqo-orders-${isoDay(new Date())}.csv` })
    a.click(); URL.revokeObjectURL(a.href)
  } catch (e) { toast.error(e.message) }
}

export default function Orders() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [f, setF] = useState({ status: '', q: '', payment_method: '', payment_status: '', range: '', from: '', page: 1 })
  const [selected, setSelected] = useState([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const set = (patch) => { setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 })); setSelected([]) }

  const params = { status: f.status, q: f.q, payment_method: f.payment_method, payment_status: f.payment_status, from: f.from, page: f.page, per_page: 20 }
  // date range -> first day included (worked out when the filter changes)
  const setRange = (range) => {
    const days = RANGES[range]
    set({ range, from: days != null ? isoDay(new Date(Date.now() - days * 86400000)) : '' })
  }
  const { data, isPending, isPlaceholderData } = useAdminList('orders', params)
  const orders = data?.data ?? []
  const counts = data?.counts
  const s = data?.summary

  const toggle = (n) => setSelected((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]))
  const allOnPage = orders.length > 0 && orders.every((o) => selected.includes(o.order_number))
  const chosen = orders.filter((o) => selected.includes(o.order_number))

  const bulk = async (status, label, from) => {
    const eligible = chosen.filter((o) => from.includes(o.status))
    if (!eligible.length) { toast.error(`None of the selected orders can be moved to ${label.toLowerCase()}.`); return }
    if (!(await confirm({ title: `${label} ${eligible.length} order${eligible.length > 1 ? 's' : ''}?`, text: `Customers get an SMS update.${eligible.length < chosen.length ? ` ${chosen.length - eligible.length} selected order(s) are skipped (wrong status).` : ''}`, confirmText: label, danger: status === 'cancelled' }))) return
    setBulkBusy(true)
    let ok = 0
    for (const o of eligible) {
      try { await adminApi.patch(`/admin/orders/${o.order_number}/status`, { status }); ok++ } catch (e) { toast.error(`${o.order_number}: ${e.message}`) }
    }
    setBulkBusy(false); setSelected([])
    qc.invalidateQueries({ queryKey: ['admin'] })
    if (ok) toast.success(`${ok} order${ok > 1 ? 's' : ''} updated`)
  }
  const printSelected = () => chosen.forEach((o) => window.open(`/admin/invoice/${o.order_number}`, '_blank'))

  const cols = [
    { h: <input type="checkbox" checked={allOnPage} onChange={() => setSelected(allOnPage ? [] : orders.map((o) => o.order_number))} className="size-4 accent-tan" aria-label="Select all on this page" />, className: 'w-10 !pr-0' },
    { h: 'Order', b: true }, { h: 'Customer' }, { h: 'Items', className: 'max-xl:hidden' }, { h: 'Total' },
    { h: 'Payment', className: 'max-xl:hidden' }, { h: 'Status' }, { h: 'District', mute: true, className: 'max-xl:hidden' }, { h: 'Date', mute: true, className: 'max-lg:hidden' }, { h: '', className: 'w-10', right: true },
  ]
  const rows = orders.map((o) => [
    <input type="checkbox" checked={selected.includes(o.order_number)} onChange={() => toggle(o.order_number)} className="size-4 accent-tan" aria-label={`Select ${o.order_number}`} />,
    <Link to={`/admin/orders/${o.order_number}`} className="whitespace-nowrap hover:text-tan">#{o.order_number}</Link>,
    <div><p className="font-semibold">{o.name}</p><p className="text-[11px] text-amute">{o.phone}</p></div>,
    o.items_count,
    <span className="whitespace-nowrap">{Tk(o.total)}</span>,
    <div className="flex flex-col items-start gap-1"><PayChip m={o.payment_method} />{o.payment_method !== 'cod' && <PayBadge s={o.payment_status} />}</div>,
    <OrderBadge s={o.status} />,
    o.district,
    <span className="whitespace-nowrap" title={new Date(o.created_at).toLocaleString()}>{ago(o.created_at)}</span>,
    <Link to={`/admin/orders/${o.order_number}`} aria-label="Open order" className="flex justify-end text-amute hover:text-ink"><MoreHorizontal className="size-4" /></Link>,
  ])

  return (
    <>
      <PageHead
        title="Orders"
        sub={counts ? `${counts.all} orders · ${counts.pending} pending · ${s?.payments_to_verify ?? 0} payments to verify · ${s?.today ?? 0} today` : 'Loading…'}
        actions={<Btn v="white" icon={Download} onClick={() => exportCsv(params)}><span className="sm:hidden">Export</span><span className="max-sm:hidden">Export CSV</span></Btn>}
      />

      <Tabs items={TABS.map(([label, key, value]) => [label, counts?.[key], value])} active={f.status} onChange={(status) => set({ status })} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search by order number, name or phone" />
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2.5">
          <Select options={METHODS} search={false} value={f.payment_method} onChange={(payment_method) => set({ payment_method })} className="sm:w-36" aria-label="Payment method" />
          <Select options={PAID} search={false} value={f.payment_status} onChange={(payment_status) => set({ payment_status })} className="sm:w-32" aria-label="Payment status" />
          <Select options={DATES} search={false} value={f.range} onChange={setRange} className="sm:w-40" aria-label="Date range" />
        </div>
      </div>

      {chosen.length > 0 && can('orders', 'edit') && (
        <div className="hidden flex-wrap items-center gap-2.5 rounded-xl border border-tan/25 bg-tan/10 px-4 py-3 md:flex">
          <span className="mr-1 text-[13px] font-semibold">{chosen.length} selected</span>
          {BULK.map(([status, label, from]) => <Btn key={status} v="white" sm disabled={bulkBusy} onClick={() => bulk(status, label, from)}>{label}</Btn>)}
          <Btn v="white" sm icon={Printer} onClick={printSelected}>Print invoices</Btn>
          <Btn v="white" sm icon={Truck} to="/admin/shipments">Add tracking</Btn>
          <Btn v="danger" sm disabled={bulkBusy} onClick={() => bulk('cancelled', 'Cancel', ['pending', 'confirmed', 'processing'])}>Cancel</Btn>
          {bulkBusy && <Spin className="text-tan" />}
        </div>
      )}

      {isPending ? <LoadingBlock /> : !orders.length ? <EmptyBlock title="No orders here" text="Try another tab or filter." /> : (
        <div className={cx('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <Table cols={cols} rows={rows} className="max-md:hidden" />
          <div className="space-y-3 md:hidden">{orders.map((o) => <OrderCard key={o.id} o={o} />)}</div>
          <Paginator meta={data?.meta} onPage={(page) => set({ page })} />
        </div>
      )}
    </>
  )
}
