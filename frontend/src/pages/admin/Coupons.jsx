import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Btn, Card, PageHead, KPIs, Two, Col, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, MoneyInput, Paginator, SearchBox, Spin, Switch, SwitchRow, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const Tk = (v) => `Tk ${Number(v || 0).toLocaleString('en-IN')}`
const short = (v) => (v >= 100000 ? `Tk ${(v / 100000).toFixed(1)}L` : Tk(Math.round(v)))
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry')
const dateInput = (iso) => (iso ? iso.slice(0, 10) : '')
const blank = { id: null, code: '', description: '', type: 'fixed', value: '', min_order: '', max_discount: '', max_uses: '', starts_at: '', ends_at: '', is_active: true }
const toForm = (c) => ({ id: c.id, code: c.code, description: c.description ?? '', type: c.type, value: String(c.value), min_order: c.min_order ? String(c.min_order) : '', max_discount: c.max_discount ? String(c.max_discount) : '', max_uses: c.max_uses ? String(c.max_uses) : '', starts_at: dateInput(c.starts_at), ends_at: dateInput(c.ends_at), is_active: c.is_active })

function status(c) {
  if (!c.is_active) return ['Paused', 'amber']
  if (c.ends_at && new Date(c.ends_at) < new Date()) return ['Expired', 'gray']
  if (c.max_uses && c.used >= c.max_uses) return ['Used up', 'gray']
  if (c.starts_at && new Date(c.starts_at) > new Date()) return ['Scheduled', 'blue']
  return ['Active', 'green']
}
const title = (c) => (c.type === 'percent' ? `${Number(c.value)}% off${c.max_discount ? ` (max ${Tk(c.max_discount)})` : ''}` : `${Tk(c.value)} off`)

const Code = ({ children }) => (
  <button type="button" onClick={() => navigator.clipboard?.writeText(children).then(() => toast.success(`Copied ${children}`))} title="Copy code"
    className="inline-flex items-center gap-2 rounded-md border border-dashed border-tan/50 bg-asoft px-2.5 py-1 text-xs font-bold tracking-wide hover:border-tan">
    {children}<Copy className="size-3 text-amute" />
  </button>
)

function Usage({ used, max_uses: limit, full }) {
  if (!limit) return <p className="text-[13px] font-semibold">{used} used</p>
  const pct = Math.min(100, (used / limit) * 100)
  return (
    <div className={full ? 'w-full' : 'w-[110px]'}>
      <p className="text-xs font-semibold">{used} / {limit}</p>
      <div className="mt-1.5 h-1 rounded-full bg-asoft"><div style={{ width: `${pct}%` }} className={cx('h-full rounded-full', pct >= 100 ? 'bg-amute' : 'bg-tan')} /></div>
    </div>
  )
}

function Segmented({ items, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-asoft p-1">
      {items.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={cx('flex-1 rounded-md py-2 text-xs', value === v ? 'bg-white font-semibold shadow-sm' : 'text-amute')}>{l}</button>
      ))}
    </div>
  )
}

function CouponForm({ form, setForm, onDone }) {
  const { can } = useAdminAuth()
  const [errors, setErrors] = useState({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const save = useAdminMutation((f) => {
    const body = {
      code: f.code, description: f.description || null, type: f.type, value: Number(f.value) || 0, min_order: Number(f.min_order) || 0,
      max_discount: f.type === 'percent' && f.max_discount ? Number(f.max_discount) : null, max_uses: f.max_uses ? Number(f.max_uses) : null,
      starts_at: f.starts_at || null, ends_at: f.ends_at ? `${f.ends_at} 23:59:59` : null, is_active: f.is_active,
    }
    return f.id ? adminApi.put(`/admin/coupons/${f.id}`, body) : adminApi.post('/admin/coupons', body)
  }, { invalidate: ['coupons'], success: (_, f) => (f.id ? 'Coupon saved' : 'Coupon created'), onSuccess: onDone })

  const submit = (e) => { e.preventDefault(); setErrors({}); save.mutate(form, { onError: (err) => setErrors(err.fields || {}) }) }
  return (
    <Card title={form.id ? `Edit ${form.code}` : 'Create coupon'} sub={form.id ? 'Changes apply to the next checkout' : 'Customers type the code at checkout'}>
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Coupon code *" error={errors.code}><TextInput value={form.code} invalid={!!errors.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} placeholder="EID500" /></FormField>
        <FormField label="Description" error={errors.description} help="Shown to the customer when applied"><TextInput value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="৳500 off orders over ৳3,000" /></FormField>
        <div className="space-y-1.5"><p className="text-xs font-semibold">Discount type</p><Segmented items={[['fixed', 'Flat ৳'], ['percent', 'Percent']]} value={form.type} onChange={(type) => set({ type })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={form.type === 'percent' ? 'Percent *' : 'Amount *'} error={errors.value}>
            {form.type === 'percent'
              ? <span className="relative block"><TextInput value={form.value} inputMode="numeric" invalid={!!errors.value} onChange={(e) => set({ value: e.target.value.replace(/[^\d.]/g, '') })} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-amute">%</span></span>
              : <MoneyInput value={form.value} onChange={(value) => set({ value })} invalid={!!errors.value} />}
          </FormField>
          <FormField label="Min. order" error={errors.min_order}><MoneyInput value={form.min_order} onChange={(min_order) => set({ min_order })} placeholder="0" /></FormField>
          {form.type === 'percent' && <FormField label="Max discount" error={errors.max_discount} help="Optional cap"><MoneyInput value={form.max_discount} onChange={(max_discount) => set({ max_discount })} /></FormField>}
          <FormField label="Usage limit" error={errors.max_uses} help="Blank = unlimited"><TextInput value={form.max_uses} inputMode="numeric" onChange={(e) => set({ max_uses: e.target.value.replace(/\D/g, '') })} /></FormField>
          <FormField label="Starts" error={errors.starts_at}><TextInput type="date" value={form.starts_at} onChange={(e) => set({ starts_at: e.target.value })} /></FormField>
          <FormField label="Valid until" error={errors.ends_at} help="Blank = no expiry"><TextInput type="date" value={form.ends_at} onChange={(e) => set({ ends_at: e.target.value })} /></FormField>
        </div>
        <SwitchRow label="Active" sub="Paused coupons are rejected at checkout" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
        <div className="grid grid-cols-[auto_1fr] gap-2.5">
          <Btn v="white" type="button" onClick={onDone}>{form.id ? 'Cancel' : 'Clear'}</Btn>
          <Btn disabled={save.isPending || !can('coupons', form.id ? 'edit' : 'create')}>{save.isPending && <Spin />}{form.id ? 'Save coupon' : 'Create coupon'}</Btn>
        </div>
      </form>
    </Card>
  )
}

export default function AdminCoupons() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [f, setF] = useState({ q: '', page: 1 })
  const [form, setForm] = useState(blank)
  const { data, isPending } = useAdminList('coupons', { ...f, per_page: 15 })
  const coupons = data?.data ?? []
  const s = data?.summary

  const toggle = useAdminMutation(({ id, is_active }) => adminApi.put(`/admin/coupons/${id}`, { is_active }), {
    invalidate: ['coupons'], success: (_, v) => (v.is_active ? 'Coupon activated' : 'Coupon paused'),
  })
  const remove = async (c) => {
    const done = await confirmAndRun({ title: `Delete ${c.code}?`, text: c.used ? `It was used ${c.used} times. Past orders keep their discount.` : undefined, confirmText: 'Delete', danger: true },
      () => adminApi.del(`/admin/coupons/${c.id}`))
    if (done) { toast.success('Coupon deleted'); if (form.id === c.id) setForm(blank); qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }) }
  }
  const edit = (c) => { setForm(toForm(c)); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const canEdit = can('coupons', 'edit')
  const actions = (c) => (
    <div className="flex items-center justify-end gap-3 text-amute">
      <Switch checked={c.is_active} disabled={!canEdit} onChange={(is_active) => toggle.mutate({ id: c.id, is_active })} label={`${c.code} active`} />
      {canEdit && <button type="button" onClick={() => edit(c)} aria-label={`Edit ${c.code}`} className="hover:text-ink"><Pencil className="size-3.5" /></button>}
      {can('coupons', 'delete') && <button type="button" onClick={() => remove(c)} aria-label={`Delete ${c.code}`} className="hover:text-bad"><Trash2 className="size-3.5" /></button>}
    </div>
  )

  return (
    <>
      <PageHead title="Coupons & offers" sub={s ? `${s.active} active · ${short(s.discount_given)} discount given` : 'Loading…'} actions={can('coupons', 'create') && <Btn icon={Plus} onClick={() => setForm(blank)}>Create coupon</Btn>} />
      <KPIs items={s ? [['Active coupons', String(s.active)], ['Redemptions', s.redemptions.toLocaleString('en-IN')], ['Discount given', short(s.discount_given)], ['Revenue with coupons', short(s.revenue_with_coupons)]] : [['Active coupons', '…'], ['Redemptions', '…'], ['Discount given', '…'], ['Revenue with coupons', '…']]} />
      <Two ratio="main">
        <Col>
          <SearchBox value={f.q} onChange={(q) => setF({ q, page: 1 })} placeholder="Search coupon code" className="flex-none" />
          {isPending ? <LoadingBlock /> : !coupons.length ? <EmptyBlock title="No coupons" text="Create your first coupon on the right." /> : (
            <>
              <div className="overflow-hidden rounded-xl border border-aline bg-white max-sm:hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
                      <tr><th className="px-4 py-3 font-semibold">Code</th><th className="px-4 py-3 font-semibold">Discount</th><th className="px-4 py-3 font-semibold">Usage</th><th className="px-4 py-3 font-semibold max-md:hidden">Expires</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3" /></tr>
                    </thead>
                    <tbody className="divide-y divide-aline">
                      {coupons.map((c) => {
                        const [label, t] = status(c)
                        return (
                          <tr key={c.id} className={cx('hover:bg-abg/60', form.id === c.id && 'bg-abg')}>
                            <td className="px-4 py-3.5"><Code>{c.code}</Code></td>
                            <td className="px-4 py-3.5"><p className="font-semibold">{title(c)}</p><p className="text-[11px] text-amute">Min {c.min_order > 0 ? Tk(c.min_order) : '—'}</p></td>
                            <td className="px-4 py-3.5"><Usage {...c} /></td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-amute max-md:hidden">{day(c.ends_at)}</td>
                            <td className="px-4 py-3.5"><Badge tone={t}>{label}</Badge></td>
                            <td className="px-4 py-3.5">{actions(c)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2.5 sm:hidden">
                {coupons.map((c) => {
                  const [label, t] = status(c)
                  return (
                    <div key={c.id} className="space-y-2.5 rounded-xl border border-aline bg-white p-3.5">
                      <div className="flex items-center justify-between gap-2"><Code>{c.code}</Code><Badge tone={t}>{label}</Badge></div>
                      <p className="text-xs text-amute">{title(c)} · Min {c.min_order > 0 ? Tk(c.min_order) : '—'} · {day(c.ends_at)}</p>
                      <Usage {...c} full />
                      {actions(c)}
                    </div>
                  )
                })}
              </div>
              <Paginator meta={data?.meta} onPage={(page) => setF((x) => ({ ...x, page }))} />
            </>
          )}
        </Col>
        <Col>{(can('coupons', 'create') || form.id) && <CouponForm key={form.id ?? 'new'} form={form} setForm={setForm} onDone={() => setForm(blank)} />}</Col>
      </Two>
    </>
  )
}
