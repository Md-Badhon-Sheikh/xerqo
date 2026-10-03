import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Download, MoreHorizontal } from 'lucide-react'
import { Avatar, Badge, Btn, KPIs, PageHead, Select, Table, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox } from '../../components/admin/form'
import { Tk, ago } from '../../components/admin/orderUi'
import { adminApi } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'
import { DISTRICTS } from '../../lib/bd'

export const SEGMENT = { vip: ['VIP', 'tan'], regular: ['Regular', 'blue'], new: ['New', 'green'], risky: ['Risky', 'red'] }
export const SegmentBadge = ({ s }) => { const [l, t] = SEGMENT[s] ?? [s, 'gray']; return <Badge tone={t}>{l}</Badge> }
export const successTone = (n) => (n == null ? 'text-amute' : n >= 90 ? 'text-ok' : n >= 60 ? 'text-amber' : 'text-bad')
const success = (n) => (n == null ? '—' : `${n}%`)

const SEGMENTS = [{ value: '', label: 'Segment: All' }, ...Object.entries(SEGMENT).map(([value, [label]]) => ({ value, label }))]
const STATUSES = [{ value: '', label: 'Status: All' }, { value: 'active', label: 'Active' }, { value: 'cod_blocked', label: 'COD blocked' }, { value: 'blocked', label: 'Account disabled' }]
const DISTRICT_OPTIONS = [{ value: '', label: 'District: All' }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]

async function exportCsv(params) {
  try {
    const res = await adminApi.get('/admin/customers', { ...params, per_page: 100, page: 1 })
    const rows = [['Name', 'Phone', 'Email', 'District', 'Orders', 'Spent', 'Delivered', 'Returned', 'Courier success %', 'Segment', 'Last order', 'Joined', 'COD blocked', 'Active']]
    res.data.forEach((c) => rows.push([c.name, c.phone, c.email, c.district, c.orders_count, c.spent, c.delivered, c.returned, c.success_rate ?? '', SEGMENT[c.segment]?.[0], c.last_order_at?.slice(0, 10), c.created_at?.slice(0, 10), c.cod_blocked ? 'yes' : 'no', c.is_active ? 'yes' : 'no']))
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `xerqo-customers-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click(); URL.revokeObjectURL(a.href)
    if (res.meta.total > res.data.length) toast.info(`Exported the first ${res.data.length} of ${res.meta.total} — narrow the filters for the rest.`)
  } catch (e) { toast.error(e.message) }
}

const Flags = ({ c }) => (
  <>
    {!c.is_active && <span title="Account disabled" className="text-bad"><Ban className="size-3.5" /></span>}
    {c.cod_blocked && <span className="rounded bg-bad/10 px-1.5 py-0.5 text-[10px] font-bold text-bad">NO COD</span>}
  </>
)

export default function Customers() {
  const [f, setF] = useState({ q: '', segment: '', district: '', status: '', page: 1 })
  const set = (patch) => setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 }))
  const { data, isPending, isPlaceholderData } = useAdminList('customers', { ...f, per_page: 20 })
  const list = data?.data ?? []
  const s = data?.meta?.summary

  const cols = [
    { h: 'Customer' }, { h: 'District', mute: true, className: 'max-lg:hidden' }, { h: 'Orders' }, { h: 'Total spent', b: true },
    { h: 'Courier success', className: 'max-xl:hidden' }, { h: 'Last order', mute: true, className: 'max-xl:hidden' }, { h: 'Segment' }, { h: '', right: true, className: 'w-10' },
  ]
  const rows = list.map((c) => [
    <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-2.5"><Avatar name={c.name || '?'} size={34} /><div className="min-w-0"><p className="flex items-center gap-1.5 font-semibold hover:text-tan">{c.name}<Flags c={c} /></p><p className="text-[11px] text-amute">{c.phone}</p></div></Link>,
    c.district ?? '—',
    c.orders_count,
    <span className="whitespace-nowrap">{Tk(c.spent)}</span>,
    <span className={cx('font-semibold', successTone(c.success_rate))} title={`${c.delivered} delivered · ${c.returned} returned`}>{success(c.success_rate)}</span>,
    <span className="whitespace-nowrap">{c.last_order_at ? ago(c.last_order_at) : '—'}</span>,
    <SegmentBadge s={c.segment} />,
    <Link to={`/admin/customers/${c.id}`} aria-label="Open" className="inline-grid text-amute hover:text-ink"><MoreHorizontal className="size-4" /></Link>,
  ])

  return (
    <>
      <PageHead
        title="Customers"
        sub={s ? `${s.total.toLocaleString()} customers · ${s.repeat_rate}% repeat rate` : 'Loading…'}
        actions={<Btn v="white" icon={Download} onClick={() => exportCsv(f)}>Export</Btn>}
      />

      <KPIs items={s ? [
        ['Total customers', s.total.toLocaleString()],
        ['New this month', s.new_this_month.toLocaleString(), 'Signed up since the 1st', 'gray'],
        ['Repeat rate', `${s.repeat_rate}%`, 'Customers with 2+ orders', 'gray'],
        ['Flagged / blocked', String(s.flagged), s.flagged ? 'COD blocked or disabled' : 'None', s.flagged ? 'red' : 'gray'],
      ] : [['Total customers', '…'], ['New this month', '…'], ['Repeat rate', '…'], ['Flagged / blocked', '…']]} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search name, phone or email" />
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2.5">
          <Select options={SEGMENTS} search={false} value={f.segment} onChange={(segment) => set({ segment })} className="sm:w-36" aria-label="Segment" />
          <Select options={DISTRICT_OPTIONS} value={f.district} onChange={(district) => set({ district })} className="sm:w-40" aria-label="District" />
          <Select options={STATUSES} search={false} value={f.status} onChange={(status) => set({ status })} className="sm:w-40" aria-label="Status" />
        </div>
      </div>

      {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title="No customers found" text="Try another search or filter." /> : (
        <div className={cx('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <Table cols={cols} rows={rows} className="max-md:hidden" />
          <div className="space-y-3 md:hidden">
            {list.map((c) => (
              <Link key={c.id} to={`/admin/customers/${c.id}`} className="block rounded-xl border border-aline bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name || '?'} size={34} />
                  <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 truncate text-[13px] font-semibold">{c.name}<Flags c={c} /></p><p className="text-[11px] text-amute">{c.phone}{c.district ? ` · ${c.district}` : ''}</p></div>
                  <SegmentBadge s={c.segment} />
                </div>
                <div className="mt-3 grid grid-cols-3 border-t border-aline pt-2.5 text-xs">
                  <div><p className="text-amute">Orders</p><p className="mt-0.5 text-[13px] font-bold">{c.orders_count}</p></div>
                  <div><p className="text-amute">Spent</p><p className="mt-0.5 text-[13px] font-bold">{Tk(c.spent)}</p></div>
                  <div className="text-right"><p className="text-amute">Courier ✓</p><p className={cx('mt-0.5 text-[13px] font-bold', successTone(c.success_rate))}>{success(c.success_rate)}</p></div>
                </div>
              </Link>
            ))}
          </div>
          <Paginator meta={data?.meta} onPage={(page) => set({ page })} />
        </div>
      )}
    </>
  )
}
