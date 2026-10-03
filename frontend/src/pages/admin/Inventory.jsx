import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, Minus, Plus } from 'lucide-react'
import { Badge, Btn, Card, KPIs, PageHead, Select, Table, Two, Col, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, Paginator, SearchBox, Spin, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useAdminList, useAdminMutation, useCategoryOptions } from '../../lib/adminQueries'

const STATUS = { in_stock: ['In stock', 'green'], low_stock: ['Low stock', 'amber'], out_of_stock: ['Out of stock', 'red'] }
const tone = (s) => ({ in_stock: 'text-ok', low_stock: 'text-amber', out_of_stock: 'text-bad' }[s])
const TYPES = [{ value: 'add', label: 'Add (restock)' }, { value: 'subtract', label: 'Remove' }, { value: 'set', label: 'Set exact count' }]
const REASONS = ['New batch from workshop', 'Damaged', 'Return restocked', 'Stock count correction', 'Gift / sample', 'Other']
const MOVE_LABEL = { adjustment: 'Adjustment', order: 'Order', cancel: 'Cancelled order', return: 'Return', edit: 'Product edit' }
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const n = (x) => Number(x || 0).toLocaleString('en-IN')

function Stepper({ p, onStep, busy }) {
  const b = 'grid size-7 place-items-center rounded-md border border-aline bg-white hover:border-ink disabled:opacity-40'
  return (
    <div className="flex items-center justify-end gap-1.5">
      {p.variants.length === 0 && (
        <>
          <button type="button" disabled={busy || p.stock === 0} onClick={() => onStep(p, 'subtract')} className={b} aria-label={`Remove one ${p.name}`}><Minus className="size-3" /></button>
          <button type="button" disabled={busy} onClick={() => onStep(p, 'add')} className={b} aria-label={`Add one ${p.name}`}><Plus className="size-3" /></button>
        </>
      )}
      <Link to={`/admin/products/${p.id}/edit`} className="ml-1 text-[13px] font-semibold text-tan">Edit</Link>
    </div>
  )
}

function AdjustCard({ products }) {
  const [f, setF] = useState({ product_id: '', variant_id: '', type: 'add', quantity: '', reason: REASONS[0] })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const product = products.find((p) => String(p.id) === f.product_id)
  const variant = product?.variants.find((v) => String(v.id) === f.variant_id)
  const current = variant ? variant.stock : product?.stock ?? 0
  const qty = Number(f.quantity) || 0
  const next = f.type === 'add' ? current + qty : f.type === 'subtract' ? Math.max(0, current - qty) : qty
  const needsVariant = product?.variants.length > 0 && !variant

  const adjust = useAdminMutation((body) => adminApi.post('/admin/inventory/adjust', body), {
    invalidate: ['inventory', 'products', 'inventory/movements'],
    success: (res) => `Stock updated: ${res.data.before} → ${res.data.after}`,
    onSuccess: () => set({ quantity: '' }),
  })
  const submit = (e) => {
    e.preventDefault()
    adjust.mutate({ product_id: Number(f.product_id), variant_id: f.variant_id ? Number(f.variant_id) : null, type: f.type, quantity: qty, reason: f.reason })
  }

  return (
    <Card title="Quick stock adjustment" sub="Every change is logged with reason & staff" className="md:col-span-2 xl:col-span-1">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Product">
          <Select placeholder="Search a product…" search options={products.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }))}
            value={f.product_id} onChange={(product_id) => set({ product_id, variant_id: '' })} />
        </FormField>
        {product?.variants.length > 0 && (
          <FormField label="Colour" help="Products with colours are counted per colour">
            <Select placeholder="Choose a colour" search={false} options={product.variants.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.stock} in stock` }))} value={f.variant_id} onChange={(variant_id) => set({ variant_id })} />
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type"><Select options={TYPES} search={false} value={f.type} onChange={(type) => set({ type })} /></FormField>
          <FormField label="Quantity"><TextInput inputMode="numeric" value={f.quantity} onChange={(e) => set({ quantity: e.target.value.replace(/\D/g, '') })} placeholder="0" /></FormField>
        </div>
        <FormField label="Reason"><Select options={REASONS} search={false} value={f.reason} onChange={(reason) => set({ reason })} /></FormField>
        {product && !needsVariant && <div className="flex justify-between text-[13px]"><span className="text-amute">New stock</span><b className={next > current ? 'text-ok' : next < current ? 'text-bad' : ''}>{current} → {next}</b></div>}
        <Btn className="w-full" disabled={!product || needsVariant || (f.type !== 'set' && qty === 0) || adjust.isPending}>{adjust.isPending && <Spin />}Save adjustment</Btn>
      </form>
    </Card>
  )
}

function MovementLog() {
  const [all, setAll] = useState(false)
  const { data, isPending } = useAdminList('inventory/movements', { per_page: all ? 50 : 6 })
  const items = data?.data ?? []
  return (
    <Card title="Stock movement log" right={data?.total > 6 && <button type="button" onClick={() => setAll(!all)} className="text-xs font-semibold text-tan">{all ? 'Show less' : `View all (${data.total})`}</button>}>
      {isPending ? <div className="h-24 animate-pulse rounded-md bg-asoft" /> : !items.length ? <p className="text-[13px] text-amute">No stock changes yet.</p> : (
        <div className={cx('divide-y divide-aline', all && 'max-h-[480px] overflow-y-auto')}>{items.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0">
            <span className={cx('grid h-7 min-w-9 place-items-center rounded-md px-1.5 text-xs font-bold', m.change > 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}>{m.change > 0 ? `+${m.change}` : m.change}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{m.product}{m.variant && <span className="font-normal text-amute"> · {m.variant}</span>}</p>
              <p className="truncate text-[11px] text-amute">{[m.reference ? `${MOVE_LABEL[m.type]} #${m.reference}` : MOVE_LABEL[m.type], m.reason && m.reason !== 'Order placed' ? m.reason : null, m.by, when(m.created_at)].filter(Boolean).join(' · ')} · now {m.stock_after}</p>
            </div>
          </div>
        ))}</div>
      )}
    </Card>
  )
}

async function exportCsv() {
  try {
    const res = await adminApi.get('/admin/inventory', { per_page: 100 })
    const rows = [['Product', 'SKU', 'Colour', 'Category', 'Stock', 'Status', 'Stock value']]
    for (const p of res.data) {
      if (p.variants.length) p.variants.forEach((v) => rows.push([p.name, v.sku || p.sku, v.name, p.category, v.stock, '', '']))
      rows.push([p.name, p.sku, p.variants.length ? 'All colours' : '', p.category, p.stock, STATUS[p.stock_status][0], p.stock_value])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `xerqo-inventory-${new Date().toISOString().slice(0, 10)}.csv` })
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) { toast.error(e.message) }
}

export default function Inventory() {
  const { can } = useAdminAuth()
  const [search] = useSearchParams()
  const [f, setF] = useState({ q: '', category_id: '', stock: search.get('stock') ?? '', page: 1 })
  const set = (patch) => setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 }))
  const { data, isPending, isPlaceholderData } = useAdminList('inventory', { ...f, per_page: 20 })
  const { data: all } = useAdminList('inventory', { per_page: 100 }) // options for the adjustment form
  const { options: catOptions } = useCategoryOptions()
  const items = data?.data ?? []
  const s = data?.summary

  const step = useAdminMutation(({ p, type }) => adminApi.post('/admin/inventory/adjust', { product_id: p.id, type, quantity: 1, reason: 'Quick +/- from inventory list' }), {
    invalidate: ['inventory', 'products', 'inventory/movements'],
    success: (res, { p }) => `${p.name}: ${res.data.before} → ${res.data.after}`,
  })

  const cols = [{ h: 'Product' }, { h: 'SKU', mute: true, className: 'max-lg:hidden' }, { h: 'Stock', b: true }, { h: 'Status' }, { h: '', right: true }]
  const rows = items.map((p) => [
    <div className="flex items-center gap-3">
      {p.image ? <img src={p.image} alt="" className="size-9 shrink-0 rounded-md object-cover" /> : <span className="size-9 shrink-0 rounded-md bg-asoft" />}
      <div className="min-w-0">
        <p className="font-semibold">{p.name}</p>
        {p.variants.length > 0
          ? <p className="flex flex-wrap gap-x-2.5 text-[11px] text-amute">{p.variants.map((v) => <span key={v.id} className="inline-flex items-center gap-1"><span className="size-2 rounded-full ring-1 ring-black/10" style={{ background: v.color_hex || '#ccc' }} />{v.name} <b className={v.stock === 0 ? 'text-bad' : 'text-ink'}>{v.stock}</b></span>)}</p>
          : <p className="text-[11px] text-amute">{p.category}<span className="lg:hidden"> · {p.sku}</span></p>}
      </div>
    </div>,
    p.sku,
    <span className={tone(p.stock_status)}>{p.stock}</span>,
    <Badge tone={STATUS[p.stock_status][1]}>{STATUS[p.stock_status][0]}</Badge>,
    can('inventory', 'edit') ? <Stepper p={p} onStep={(prod, type) => step.mutate({ p: prod, type })} busy={step.isPending} /> : null,
  ])

  return (
    <>
      <PageHead
        title="Inventory"
        sub="Stock by product & colour · low-stock alert level is set per product"
        actions={<Btn v="white" icon={Download} onClick={exportCsv}>Export CSV</Btn>}
      />

      <KPIs items={s ? [
        ['Products', n(s.products), `${n(s.variants)} colour options`, 'gray'],
        ['Units in stock', n(s.units), `Value Tk ${n(Math.round(s.stock_value))}`, 'gray'],
        ['Low stock', n(s.low_stock), s.low_stock ? 'Reorder soon' : 'All good', s.low_stock ? 'amber' : 'green'],
        ['Out of stock', n(s.out_of_stock), s.out_of_stock ? 'Shown as sold out' : 'None', s.out_of_stock ? 'red' : 'green'],
      ] : [['Products', '…'], ['Units in stock', '…'], ['Low stock', '…'], ['Out of stock', '…']]} />

      <div className="flex flex-col gap-2.5 lg:flex-row">
        <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search product, SKU or colour SKU…" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <Select options={[{ value: '', label: 'All categories' }, ...catOptions]} value={f.category_id} onChange={(category_id) => set({ category_id })} className="sm:w-44" aria-label="Filter by category" />
          <Select options={[{ value: '', label: 'All status' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} search={false} value={f.stock} onChange={(stock) => set({ stock })} className="sm:w-36" aria-label="Filter by stock status" />
        </div>
      </div>

      <Two ratio="main">
        <Col>
          {isPending ? <LoadingBlock /> : !items.length ? <EmptyBlock title="Nothing matches" text="Try another search or filter." /> : (
            <div className={cx('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
              <Table cols={cols} rows={rows} className="max-md:hidden" />
              <div className="space-y-2.5 md:hidden">
                {items.map((p) => (
                  <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 rounded-xl border border-aline bg-white p-3">
                    {p.image ? <img src={p.image} alt="" className="size-12 shrink-0 rounded-md object-cover" /> : <span className="size-12 shrink-0 rounded-md bg-asoft" />}
                    <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{p.name}</p><p className="truncate text-[11px] text-amute">{p.sku}{p.variants.length ? ` · ${p.variants.length} colours` : ''}</p></div>
                    <div className="shrink-0 space-y-1 text-right"><p className={cx('text-sm font-bold', tone(p.stock_status))}>{p.stock} pcs</p><Badge tone={STATUS[p.stock_status][1]}>{STATUS[p.stock_status][0]}</Badge></div>
                  </Link>
                ))}
              </div>
              <Paginator meta={data} onPage={(page) => set({ page })} />
            </div>
          )}
        </Col>

        <Col className="md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          {can('inventory', 'edit') && <AdjustCard products={all?.data ?? []} />}
          <MovementLog />
        </Col>
      </Two>
    </>
  )
}
