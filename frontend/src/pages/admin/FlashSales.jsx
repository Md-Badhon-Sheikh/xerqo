import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Pencil, Plus, Trash2, X, Zap } from 'lucide-react'
import { Badge, Btn, Card, PageHead, Select, Two, Col, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, MoneyInput, Spin, SwitchRow, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const STATUS = { live: ['Live', 'green'], scheduled: ['Scheduled', 'blue'], ended: ['Ended', 'gray'], disabled: ['Disabled', 'amber'] }
const Tk = (v) => `Tk ${Number(v || 0).toLocaleString('en-IN')}`
const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
// ISO -> value for <input type="datetime-local"> in the browser's time zone
const local = (iso) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const inHours = (h) => local(new Date(Date.now() + h * 3600000).toISOString())
const blank = () => ({ id: null, title: 'Flash Sale', starts_at: inHours(0), ends_at: inHours(72), is_active: true, items: [] })

function SaleForm({ initial, products, onDone }) {
  const { can } = useAdminAuth()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const byId = Object.fromEntries(products.map((p) => [String(p.id), p]))
  const inSale = new Set(form.items.map((i) => String(i.product_id)))

  const addProduct = (id) => {
    const p = byId[id]
    if (!p || inSale.has(id)) return
    set({ items: [...form.items, { product_id: p.id, name: p.name, sku: p.sku, image: p.image, price: p.price, sale_price: String(Math.round(p.price * 0.85)) }] })
  }
  const setItem = (i, patch) => set({ items: form.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) })

  const save = useAdminMutation((f) => {
    const body = {
      title: f.title, is_active: f.is_active,
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
      ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
      items: f.items.map((i) => ({ product_id: i.product_id, sale_price: Number(i.sale_price) || 0 })),
    }
    return f.id ? adminApi.put(`/admin/flash-sales/${f.id}`, body) : adminApi.post('/admin/flash-sales', body)
  }, { invalidate: ['flash-sales'], success: (_, f) => (f.id ? 'Flash sale saved' : 'Flash sale created'), onSuccess: onDone })

  const submit = (e) => { e.preventDefault(); setErrors({}); save.mutate(form, { onError: (err) => setErrors(err.fields || {}) }) }

  return (
    <Card title={form.id ? 'Edit flash sale' : 'New flash sale'} sub="Sale prices apply automatically between the start and end time">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Title *" error={errors.title} help="Shown as the section title on the homepage"><TextInput value={form.title} onChange={(e) => set({ title: e.target.value })} invalid={!!errors.title} /></FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Starts *" error={errors.starts_at}><TextInput type="datetime-local" value={form.starts_at} onChange={(e) => set({ starts_at: e.target.value })} invalid={!!errors.starts_at} /></FormField>
          <FormField label="Ends *" error={errors.ends_at}><TextInput type="datetime-local" value={form.ends_at} onChange={(e) => set({ ends_at: e.target.value })} invalid={!!errors.ends_at} /></FormField>
        </div>
        <SwitchRow label="Enabled" sub="Turn off to pause the sale without deleting it" checked={form.is_active} onChange={(is_active) => set({ is_active })} />

        <div className="space-y-2.5">
          <p className="text-xs font-semibold">Products in the sale ({form.items.length})</p>
          <Select key={form.items.length} search placeholder="Add a product…" variant="admin"
            options={products.filter((p) => !inSale.has(String(p.id))).map((p) => ({ value: String(p.id), label: `${p.name} — ${Tk(p.price)}` }))}
            onChange={addProduct} />
          {(errors.items) && <p className="text-[11px] text-bad">{errors.items}</p>}
          <div className="divide-y divide-aline rounded-lg border border-aline">
            {form.items.map((item, i) => {
              const off = item.price > 0 ? Math.round(((item.price - (Number(item.sale_price) || 0)) / item.price) * 100) : 0
              const err = errors[`items.${i}.sale_price`] || errors[`items.${i}.product_id`]
              return (
                <div key={item.product_id} className="flex items-center gap-3 p-2.5">
                  {item.image ? <img src={item.image} alt="" className="size-10 shrink-0 rounded-md object-cover" /> : <span className="size-10 shrink-0 rounded-md bg-asoft" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{item.name}</p>
                    <p className="text-[11px] text-amute">Regular {Tk(item.price)}{off > 0 && <span className="font-semibold text-ok"> · {off}% off</span>}</p>
                    {err && <p className="text-[11px] text-bad">{err}</p>}
                  </div>
                  <div className="w-28 shrink-0"><MoneyInput value={item.sale_price} onChange={(sale_price) => setItem(i, { sale_price })} invalid={!!err} aria-label={`Sale price for ${item.name}`} /></div>
                  <button type="button" onClick={() => set({ items: form.items.filter((_, j) => j !== i) })} aria-label={`Remove ${item.name}`} className="text-amute hover:text-bad"><X className="size-4" /></button>
                </div>
              )
            })}
            {!form.items.length && <p className="p-4 text-center text-[13px] text-amute">Pick products above to add them.</p>}
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2.5">
          <Btn v="white" type="button" onClick={onDone}>Cancel</Btn>
          <Btn disabled={save.isPending || !can('coupons', form.id ? 'edit' : 'create')}>{save.isPending && <Spin />}{form.id ? 'Save flash sale' : 'Create flash sale'}</Btn>
        </div>
      </form>
    </Card>
  )
}

export default function FlashSales() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending } = useAdminList('flash-sales')
  const { data: productList } = useAdminList('products', { per_page: 100 })
  const products = productList?.data ?? []
  const sales = data?.data ?? []
  const [editing, setEditing] = useState(null) // form initial state

  const open = async (sale) => {
    if (!sale) { setEditing(blank()); return }
    try {
      const d = (await qc.fetchQuery({ queryKey: ['admin', 'flash-sales', 'item', String(sale.id)], queryFn: () => adminApi.get(`/admin/flash-sales/${sale.id}`).then((r) => r.data) }))
      setEditing({ id: d.id, title: d.title, starts_at: local(d.starts_at), ends_at: local(d.ends_at), is_active: d.is_active, items: d.items.map((i) => ({ ...i, sale_price: String(i.sale_price) })) })
    } catch (e) { toast.error(e.message) }
  }
  const remove = async (s) => {
    const done = await confirmAndRun({ title: `Delete “${s.title}”?`, text: 'Its products go back to their regular prices.', confirmText: 'Delete', danger: true }, () => adminApi.del(`/admin/flash-sales/${s.id}`))
    if (done) { toast.success('Flash sale deleted'); qc.invalidateQueries({ queryKey: ['admin', 'flash-sales'] }); qc.invalidateQueries({ queryKey: ['home'] }) }
  }

  return (
    <>
      <PageHead title="Flash sales" sub="Time-limited sale prices with a countdown on the homepage" actions={can('coupons', 'create') && <Btn icon={Plus} onClick={() => open(null)}>New flash sale</Btn>} />
      <Two ratio="even">
        <Col>
          {isPending ? <LoadingBlock /> : !sales.length ? <EmptyBlock title="No flash sales yet" text="Create one to show a countdown sale on the homepage." /> : sales.map((s) => {
            const [label, tone] = STATUS[s.status]
            return (
              <div key={s.id} className={cx('flex items-center gap-3.5 rounded-xl border bg-white p-4', editing?.id === s.id ? 'border-tan ring-1 ring-tan' : 'border-aline')}>
                <span className={cx('grid size-11 shrink-0 place-items-center rounded-lg', s.status === 'live' ? 'bg-ok/10 text-ok' : 'bg-asoft text-amute')}>{s.status === 'live' ? <Zap className="size-5" /> : <CalendarClock className="size-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{s.title}<Badge tone={tone}>{label}</Badge></p>
                  <p className="text-xs text-amute">{fmt(s.starts_at)} → {fmt(s.ends_at)} · {s.items_count} products</p>
                </div>
                <div className="flex items-center gap-3 text-amute">
                  {can('coupons', 'edit') && <button type="button" onClick={() => open(s)} aria-label={`Edit ${s.title}`} className="hover:text-ink"><Pencil className="size-4" /></button>}
                  {can('coupons', 'delete') && <button type="button" onClick={() => remove(s)} aria-label={`Delete ${s.title}`} className="hover:text-bad"><Trash2 className="size-4" /></button>}
                </div>
              </div>
            )
          })}
        </Col>
        <Col>
          {editing
            ? <SaleForm key={editing.id ?? 'new'} initial={editing} products={products} onDone={() => setEditing(null)} />
            : <Card title="Flash sale"><p className="text-[13px] text-amute">Pick a sale to edit it, or create a new one. Only one live sale shows on the homepage at a time (the one ending soonest).</p></Card>}
        </Col>
      </Two>
    </>
  )
}
