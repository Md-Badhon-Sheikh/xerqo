import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, Eye, Package, X } from 'lucide-react'
import { Badge, Btn, Card, PageHead, Select, Two, Col, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, Paginator, SearchBox, Spin, Switch, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { toast } from '../../lib/alert'
import { adminApi } from '../../lib/api'
import { useAdminList, useAdminMutation, useCategoryOptions } from '../../lib/adminQueries'

/*
 * Admin › Top Selling: which products the homepage "Top Selling Products" section shows, in what order,
 * and whether the section is shown at all. Nothing picked = best sellers by units sold, automatically.
 */

const tk = (n) => `৳${Number(n || 0).toLocaleString('en-IN')}`
const Thumb = ({ src }) => (
  src ? <img src={src} alt="" className="size-11 shrink-0 rounded-md border border-aline object-cover" />
    : <span className="grid size-11 shrink-0 place-items-center rounded-md bg-asoft text-amute"><Package className="size-4" /></span>
)

// Picked products, in homepage order
function Picked({ list, setList, canEdit }) {
  const move = (i, d) => setList((l) => { const n = [...l]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n })
  if (!list.length) {
    return <p className="rounded-lg bg-asoft px-4 py-6 text-center text-[13px] text-amute">Nothing picked — the homepage shows the best sellers automatically (by units sold).</p>
  }
  return (
    <ol className="space-y-2">
      {list.map((p, i) => (
        <li key={p.id} className="flex items-center gap-3 rounded-lg border border-aline bg-white p-2.5">
          <span className="w-5 shrink-0 text-center text-xs font-bold text-amute">{i + 1}</span>
          <Thumb src={p.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{p.name}</p>
            <p className="text-[11px] text-amute">{tk(p.price)}{p.status !== 'active' && <span className="text-bad"> · {p.status} — hidden on the website</span>}</p>
          </div>
          {canEdit && (
            <div className="flex shrink-0 items-center">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-ink disabled:opacity-30"><ArrowUp className="size-4" /></button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-ink disabled:opacity-30"><ArrowDown className="size-4" /></button>
              <button type="button" onClick={() => setList((l) => l.filter((x) => x.id !== p.id))} aria-label="Remove" className="grid size-8 place-items-center rounded-md text-amute hover:bg-asoft hover:text-bad"><X className="size-4" /></button>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

// Every product, searchable; tick to add / remove
function AllProducts({ picked, toggle, canEdit }) {
  const [f, setF] = useState({ q: '', category_id: '', page: 1 })
  const { data, isPending, isPlaceholderData } = useAdminList('products', { ...f, per_page: 20 })
  const { options: categories } = useCategoryOptions()
  const list = data?.data ?? []
  const ids = new Set(picked.map((p) => p.id))
  return (
    <Card title="All products" sub="Tick a product to add it to the section">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <SearchBox value={f.q} onChange={(q) => setF({ ...f, q, page: 1 })} placeholder="Search name or SKU…" />
        <Select className="sm:w-52" search options={[{ value: '', label: 'All categories' }, ...categories]} value={f.category_id} onChange={(category_id) => setF({ ...f, category_id, page: 1 })} />
      </div>
      {isPending ? <LoadingBlock rows={6} /> : !list.length ? <EmptyBlock title="No products found" text="Try another search or category." /> : (
        <div className={cx('space-y-3 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <ul className="divide-y divide-aline rounded-lg border border-aline">
            {list.map((p) => {
              const on = ids.has(p.id)
              return (
                <li key={p.id}>
                  <button type="button" disabled={!canEdit} onClick={() => toggle(p)} aria-pressed={on}
                    className={cx('flex w-full items-center gap-3 p-2.5 text-left transition', on ? 'bg-tan/8' : 'hover:bg-asoft', !canEdit && 'cursor-default')}>
                    <span className={cx('grid size-5 shrink-0 place-items-center rounded border', on ? 'border-ink bg-ink text-white' : 'border-aline bg-white')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                    <Thumb src={p.image} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                      <span className="block text-[11px] text-amute">{p.sku} · {tk(p.price)} · {p.stock} in stock</span>
                    </span>
                    {p.status !== 'active' && <Badge tone="gray">{p.status === 'draft' ? 'Draft' : p.status}</Badge>}
                  </button>
                </li>
              )
            })}
          </ul>
          <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} />
        </div>
      )}
    </Card>
  )
}

function Editor({ initial }) {
  const { can } = useAdminAuth()
  const canEdit = can('products', 'edit')
  const [form, setForm] = useState(null)
  const v = form ?? { enabled: initial.enabled, eyebrow: initial.eyebrow ?? '', title: initial.title ?? '', products: initial.products ?? [] }
  const set = (patch) => setForm({ ...v, ...patch })
  const setList = (fn) => set({ products: typeof fn === 'function' ? fn(v.products) : fn })
  const save = useAdminMutation((body) => adminApi.put('/admin/top-selling', body), { invalidate: ['top-selling'], success: 'Top selling section saved', onSuccess: () => setForm(null) })
  const err = (k) => save.error?.fields?.[k]
  const max = initial.max ?? 12

  const toggle = (p) => {
    if (v.products.some((x) => x.id === p.id)) { setList((l) => l.filter((x) => x.id !== p.id)); return }
    if (v.products.length >= max) { toast.error(`You can pick up to ${max} products.`); return }
    setList((l) => [...l, { id: p.id, name: p.name, sku: p.sku, price: p.price, status: p.status, image: p.image }])
  }
  const submit = () => save.mutate({ enabled: !!v.enabled, eyebrow: v.eyebrow || null, title: v.title, product_ids: v.products.map((p) => p.id) })

  return (
    <>
      <Two ratio="main">
        <Col>
          <Card title="Section" sub="“Top Selling Products” on the homepage" right={<Switch checked={!!v.enabled} onChange={(enabled) => set({ enabled })} label="Show on the homepage" disabled={!canEdit} />}>
            {!v.enabled && <p className="rounded-lg bg-amber/10 px-3.5 py-2.5 text-[13px] text-amber">Hidden — the homepage doesn't show this section.</p>}
            <div className="grid gap-3.5 md:grid-cols-2">
              <FormField label="Small heading" error={err('eyebrow')}><TextInput value={v.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} maxLength={40} placeholder="Best sellers" disabled={!canEdit} /></FormField>
              <FormField label="Title *" error={err('title')}><TextInput value={v.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} disabled={!canEdit} /></FormField>
            </div>
          </Card>
          <AllProducts picked={v.products} toggle={toggle} canEdit={canEdit} />
        </Col>
        <Col>
          <Card title={`Shown on the homepage (${v.products.length}/${max})`} sub="In this order · drafts and archived products are skipped">
            <Picked list={v.products} setList={setList} canEdit={canEdit} />
            {(err('product_ids') || err('product_ids.0')) && <p className="text-xs text-bad">{err('product_ids') || err('product_ids.0')}</p>}
            {v.products.length > 0 && canEdit && <Btn v="white" sm onClick={() => set({ products: [] })}>Clear — show best sellers automatically</Btn>}
          </Card>
        </Col>
      </Two>
      {canEdit && (
        <div className={cx('sticky bottom-0 z-10 flex items-center justify-end gap-2 rounded-xl border border-aline bg-white/95 p-3 backdrop-blur', !form && 'opacity-80')}>
          {form && <span className="mr-auto text-xs text-amute">Unsaved changes</span>}
          {form && <Btn v="white" sm onClick={() => { setForm(null); save.reset() }}>Discard</Btn>}
          <Btn sm disabled={!form || save.isPending || !v.title.trim()} onClick={submit}>{save.isPending && <Spin />}Save</Btn>
        </div>
      )}
    </>
  )
}

export default function AdminTopSelling() {
  const { data, isPending } = useAdminList('top-selling')
  return (
    <>
      <PageHead title="Top Selling" sub="Pick the products for the homepage “Top Selling Products” section" actions={<Btn v="white" icon={Eye} onClick={() => window.open('/', '_blank')}>View store</Btn>} />
      {isPending || !data ? <LoadingBlock rows={6} /> : <Editor key={data.data.products.map((p) => p.id).join(',') + data.data.enabled} initial={data.data} />}
    </>
  )
}
