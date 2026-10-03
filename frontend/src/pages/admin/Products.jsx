import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, List, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { Badge, Btn, PageHead, Select, Table, Tabs, Thumb, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox, Switch } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation, useBrandOptions, useCategoryOptions } from '../../lib/adminQueries'

export const Tk = (n) => 'Tk ' + Number(n || 0).toLocaleString('en-IN')

const TABS = [['All', 'total', ''], ['Active', 'active', 'active'], ['Draft', 'draft', 'draft'], ['Hidden', 'hidden', 'hidden'], ['Low stock', 'low_stock', 'low'], ['Out of stock', 'out_of_stock', 'out']]
const STOCK = [{ value: '', label: 'Stock: All' }, { value: 'in', label: 'In stock' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]

export function StockBadge({ p }) {
  if (p.stock === 0) return <Badge tone="red">Out of stock</Badge>
  if (p.is_low_stock) return <Badge tone="amber">Low stock</Badge>
  return <Badge tone="green">In stock</Badge>
}

const StatusBadge = ({ s }) => <Badge tone={{ active: 'green', draft: 'gray', hidden: 'amber' }[s]}>{s?.[0].toUpperCase() + s?.slice(1)}</Badge>

export default function Products() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [view, setView] = useState('list')
  const [tab, setTab] = useState('')
  const [f, setF] = useState({ q: '', category_id: '', brand_id: '', stock: '', page: 1 })
  const set = (patch) => setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 }))

  const tabStatus = ['active', 'draft', 'hidden'].includes(tab) ? tab : ''
  const tabStock = ['low', 'out'].includes(tab) ? tab : f.stock
  const { data, isPending, isPlaceholderData } = useAdminList('products', { ...f, status: tabStatus, stock: tabStock, per_page: 15 })
  const { options: catOptions } = useCategoryOptions()
  const { options: brandOptions } = useBrandOptions()
  const items = data?.data ?? []
  const counts = data?.counts

  const toggle = useAdminMutation(({ id, status }) => adminApi.put(`/admin/products/${id}`, { status }), {
    invalidate: ['products'],
    success: (_, v) => (v.status === 'active' ? 'Product is now live on the store' : 'Product hidden from the store'),
  })
  const remove = async (p) => {
    const done = await confirmAndRun(
      { title: `Delete “${p.name}”?`, text: 'The product and its images are removed permanently. Past orders keep their details.', confirmText: 'Delete', danger: true },
      () => adminApi.del(`/admin/products/${p.id}`),
    )
    if (!done) return
    toast.success('Product deleted')
    qc.invalidateQueries({ queryKey: ['admin'] })
  }

  const canEdit = can('products', 'edit')
  const canDelete = can('products', 'delete')
  const activeSwitch = (p) => <Switch checked={p.status === 'active'} disabled={!canEdit || toggle.isPending} label={`Show ${p.name} on store`} onChange={(on) => toggle.mutate({ id: p.id, status: on ? 'active' : 'hidden' })} />
  const actions = (p) => (
    <div className="flex items-center justify-end gap-3 text-amute">
      {canEdit && <Link to={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`} className="hover:text-ink"><Pencil className="size-3.5" /></Link>}
      {canDelete && <button type="button" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="hover:text-bad"><Trash2 className="size-3.5" /></button>}
    </div>
  )

  const cols = [
    { h: 'Product' }, { h: 'Category', mute: true, className: 'max-xl:hidden' }, { h: 'Price', b: true },
    { h: 'Stock' }, { h: 'Variants', className: 'max-lg:hidden' }, { h: 'Status', className: 'max-lg:hidden' }, { h: 'Live' }, { h: '', right: true, className: 'w-20' },
  ]
  const rows = items.map((p) => [
    <Link to={`/admin/products/${p.id}/edit`} className="flex items-center gap-3"><Thumb src={p.image || '/images/logo.png'} size={40} /><div className="min-w-0"><p className="flex items-center gap-1.5 font-semibold hover:text-tan">{p.name}{p.is_featured && <Star className="size-3 fill-amber text-amber" aria-label="Featured" />}</p><p className="text-[11px] text-amute">{p.sku}{p.brand ? ` · ${p.brand.name}` : ''}</p></div></Link>,
    p.category?.name,
    <span className="whitespace-nowrap">{Tk(p.price)}{p.compare_price > p.price && <span className="ml-1.5 text-[11px] font-normal text-amute line-through">{Tk(p.compare_price)}</span>}</span>,
    <div className="space-y-0.5"><StockBadge p={p} /><p className="text-[11px] text-amute">{p.stock} units</p></div>,
    <span className="whitespace-nowrap">{p.variants_count ? `${p.variants_count} colours` : '—'}</span>,
    <StatusBadge s={p.status} />,
    activeSwitch(p),
    actions(p),
  ])

  return (
    <>
      <PageHead
        title="Products"
        sub={counts ? `${counts.total} products · ${counts.active} live on the store` : 'Loading…'}
        actions={can('products', 'create') && <Btn to="/admin/products/new" icon={Plus}>Add product</Btn>}
      />
      <Tabs items={TABS.map(([label, key, value]) => [label, counts?.[key], value])} active={tab} onChange={(k) => { setTab(k); set({}) }} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search products or SKU" />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <Select options={[{ value: '', label: 'Category: All' }, ...catOptions]} value={f.category_id} onChange={(v) => set({ category_id: v })} className="sm:w-44" aria-label="Filter by category" />
          <Select options={[{ value: '', label: 'Brand: All' }, ...brandOptions]} value={f.brand_id} onChange={(v) => set({ brand_id: v })} className="sm:w-40" aria-label="Filter by brand" />
          {!['low', 'out'].includes(tab) && <Select options={STOCK} search={false} value={f.stock} onChange={(v) => set({ stock: v })} className="sm:w-36" aria-label="Filter by stock" />}
          <div className="hidden shrink-0 rounded-lg border border-aline bg-white p-1 md:flex">
            {[['grid', LayoutGrid], ['list', List]].map(([k, I]) => (
              <button key={k} type="button" onClick={() => setView(k)} aria-label={`${k} view`} aria-pressed={view === k} className={cx('grid size-8 place-items-center rounded-md', view === k ? 'bg-asoft text-ink' : 'text-amute')}><I className="size-4" /></button>
            ))}
          </div>
        </div>
      </div>

      {isPending ? <LoadingBlock /> : items.length === 0 ? (
        <EmptyBlock title="No products found" text="Try another filter, or add your first product." action={can('products', 'create') && <Btn to="/admin/products/new" sm icon={Plus}>Add product</Btn>} />
      ) : (
        <div className={cx('space-y-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {view === 'list'
            ? <Table cols={cols} rows={rows} className="max-md:hidden" />
            : (
              <div className="grid gap-4 max-md:hidden md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-xl border border-aline bg-white">
                    <Link to={`/admin/products/${p.id}/edit`}><img src={p.image || '/images/logo.png'} alt="" className="aspect-[4/3] w-full object-cover" /></Link>
                    <div className="space-y-2 p-3.5">
                      <div className="flex items-start justify-between gap-2"><Link to={`/admin/products/${p.id}/edit`} className="text-[13px] font-semibold hover:text-tan">{p.name}</Link>{activeSwitch(p)}</div>
                      <p className="text-[11px] text-amute">{p.category?.name} · {p.sku}</p>
                      <div className="flex items-center justify-between"><b className="text-sm">{Tk(p.price)}</b><StockBadge p={p} /></div>
                      {actions(p)}
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border border-aline bg-white p-3">
                <Link to={`/admin/products/${p.id}/edit`}><Thumb src={p.image || '/images/logo.png'} size={64} /></Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${p.id}/edit`} className="block truncate text-sm font-semibold">{p.name}</Link>
                  <p className="truncate text-[11px] text-amute">{p.category?.name} · {p.sku}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2"><b className="text-sm">{Tk(p.price)}</b><StockBadge p={p} /></div>
                </div>
                <div className="flex flex-col items-end justify-between">{activeSwitch(p)}{actions(p)}</div>
              </div>
            ))}
          </div>

          <Paginator meta={data?.meta} onPage={(page) => set({ page })} />
        </div>
      )}
    </>
  )
}
