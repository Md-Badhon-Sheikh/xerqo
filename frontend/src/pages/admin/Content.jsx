import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { Badge, Btn, Card, PageHead, Select, cx } from '../../components/admin/ui'
import { FormField, ImagePicker, Spin, Switch, SwitchRow, TextInput, toFormData } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi, api } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const POSITIONS = {
  home_hero: { title: 'Hero slider', sub: 'Recommended 1983×793 · autoplay 5s · lower “Order” shows first', max: 8 },
  home_side: { title: 'Promo tiles (right of the slider)', sub: 'Two tiles · square-ish photos look best', max: 2 },
}
const local = (iso) => { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const blank = (position, sort) => ({ id: null, position, title: '', eyebrow: '', subtitle: '', link: '/shop', button_text: 'Shop now', show_text: true, is_active: true, sort_order: String(sort), starts_at: '', ends_at: '', image: null })
const toForm = (b) => ({ id: b.id, position: b.position, title: b.title, eyebrow: b.eyebrow ?? '', subtitle: b.subtitle ?? '', link: b.link ?? '', button_text: b.button_text ?? '', show_text: b.show_text !== false, is_active: b.is_active, sort_order: String(b.sort_order ?? 0), starts_at: local(b.starts_at), ends_at: local(b.ends_at), image: b.image })

function bannerStatus(b) {
  const now = Date.now()
  if (!b.is_active) return ['Hidden', 'gray']
  if (b.starts_at && new Date(b.starts_at) > now) return [`From ${new Date(b.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, 'blue']
  if (b.ends_at && new Date(b.ends_at) < now) return ['Ended', 'gray']
  return ['Live', 'green']
}

function Announcement() {
  const { can } = useAdminAuth()
  const { data, isPending } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  const current = data?.announcement
  const [form, setForm] = useState(null)
  const f = form ?? { enabled: true, text: '', mobile_text: '', link_text: '', link: '', ...current }
  const set = (patch) => setForm({ ...f, ...patch })
  const save = useAdminMutation((body) => adminApi.put('/admin/content/announcement', body), { success: 'Announcement bar updated', onSuccess: () => setForm(null) })
  // wait for the saved values, so typing early can't overwrite them with blanks
  if (isPending) return <Card title="Announcement bar"><div className="h-24 animate-pulse rounded-md bg-asoft" /></Card>
  return (
    <Card title="Announcement bar" sub="The strip above the store header" right={<Switch checked={!!f.enabled} onChange={(enabled) => set({ enabled })} label="Show announcement bar" />}>
      <FormField label="Text (desktop)" error={save.error?.fields?.text}><TextInput value={f.text} onChange={(e) => set({ text: e.target.value })} maxLength={200} /></FormField>
      <div className="grid gap-3.5 md:grid-cols-3">
        <FormField label="Short text (mobile)"><TextInput value={f.mobile_text ?? ''} onChange={(e) => set({ mobile_text: e.target.value })} maxLength={80} /></FormField>
        <FormField label="Link text"><TextInput value={f.link_text ?? ''} onChange={(e) => set({ link_text: e.target.value })} /></FormField>
        <FormField label="Link"><TextInput value={f.link ?? ''} onChange={(e) => set({ link: e.target.value })} placeholder="/shop" /></FormField>
      </div>
      {form && <div className="flex justify-end gap-2"><Btn v="white" sm onClick={() => setForm(null)}>Discard</Btn><Btn sm disabled={save.isPending || !can('content', 'edit')} onClick={() => save.mutate(f)}>{save.isPending && <Spin />}Save</Btn></div>}
    </Card>
  )
}

const DEFAULT_HIGHLIGHTS = [
  { title: '100% Genuine Leather', subtitle: 'Full-grain & top-grain' },
  { title: 'Hand-stitched', subtitle: 'Built to last' },
  { title: 'Cash on Delivery', subtitle: 'Plus bKash, Rocket & Nagad' },
  { title: '7-Day Easy Return', subtitle: 'Free exchange' },
]

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({ value: String(n), label: `${n} review${n > 1 ? 's' : ''}` }))
const SOURCE_OPTIONS = [{ value: 'auto', label: 'Featured first, then the latest' }, { value: 'featured', label: 'Only featured reviews' }]
const RATING_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: n === 5 ? '5★ only' : `${n}★ and up` }))

// "What our customers say" on the homepage — the reviews themselves come from Reviews (approved, with text)
function Testimonials() {
  const { can } = useAdminAuth()
  const canEdit = can('content', 'edit')
  const { data, isPending } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  const current = data?.testimonials
  const [form, setForm] = useState(null)
  const f = form ?? { enabled: true, eyebrow: 'Verified buyers', title: 'What our customers say', count: 3, source: 'auto', min_rating: 4, ...current }
  const set = (patch) => setForm({ ...f, ...patch })
  const save = useAdminMutation((body) => adminApi.put('/admin/content/testimonials', body), { success: 'Testimonials updated', onSuccess: () => setForm(null) })
  const fieldErr = (k) => save.error?.fields?.[k]
  if (isPending) return <Card title="Testimonials"><div className="h-24 animate-pulse rounded-md bg-asoft" /></Card>
  return (
    <Card title="Testimonials" sub="“What our customers say” on the homepage · built from approved reviews that have text" right={<Switch checked={!!f.enabled} onChange={(enabled) => set({ enabled })} label="Show testimonials" disabled={!canEdit} />}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <FormField label="Small heading" error={fieldErr('eyebrow')}><TextInput value={f.eyebrow ?? ''} onChange={(e) => set({ eyebrow: e.target.value })} maxLength={40} disabled={!canEdit} /></FormField>
        <FormField label="Title *" error={fieldErr('title')}><TextInput value={f.title ?? ''} onChange={(e) => set({ title: e.target.value })} maxLength={80} disabled={!canEdit} /></FormField>
      </div>
      <div className="grid gap-3.5 md:grid-cols-3">
        <FormField label="Which reviews" error={fieldErr('source')}><Select search={false} options={SOURCE_OPTIONS} value={f.source} onChange={(source) => set({ source })} disabled={!canEdit} /></FormField>
        <FormField label="How many" error={fieldErr('count')}><Select search={false} options={COUNT_OPTIONS} value={String(f.count)} onChange={(v) => set({ count: Number(v) })} disabled={!canEdit} /></FormField>
        <FormField label="Minimum rating" error={fieldErr('min_rating')}><Select search={false} options={RATING_OPTIONS} value={String(f.min_rating)} onChange={(v) => set({ min_rating: Number(v) })} disabled={!canEdit} /></FormField>
      </div>
      <p className="text-[11px] text-amute">Pick the reviews to show with the “Feature” button in <Link to="/admin/reviews" className="font-semibold text-tan">Reviews</Link>. The section hides itself when no review matches.</p>
      {form && <div className="flex justify-end gap-2"><Btn v="white" sm onClick={() => setForm(null)}>Discard</Btn><Btn sm disabled={save.isPending || !canEdit} onClick={() => save.mutate(f)}>{save.isPending && <Spin />}Save</Btn></div>}
    </Card>
  )
}

function Highlights() {
  const { can } = useAdminAuth()
  const canEdit = can('content', 'edit')
  const { data, isPending } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  const current = data?.highlights
  const [form, setForm] = useState(null)
  const f = form ?? { enabled: current?.enabled !== false, items: current?.items?.length ? current.items : DEFAULT_HIGHLIGHTS }
  const set = (patch) => setForm({ ...f, ...patch })
  const setItem = (i, patch) => set({ items: f.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  const save = useAdminMutation((body) => adminApi.put('/admin/content/highlights', body), { success: 'Homepage highlights updated', onSuccess: () => setForm(null) })
  const fieldErr = (k) => save.error?.fields?.[k]
  if (isPending) return <Card title="Homepage highlights"><div className="h-24 animate-pulse rounded-md bg-asoft" /></Card>
  return (
    <Card title="Homepage highlights" sub="The numbered strip under “Featured categories” · up to 4 · numbers follow the order" right={<Switch checked={!!f.enabled} onChange={(enabled) => set({ enabled })} label="Show highlights" disabled={!canEdit} />}>
      <div className="space-y-2.5">
        {f.items.map((it, i) => (
          <div key={i} className="grid gap-2.5 rounded-xl border border-aline p-3 sm:grid-cols-[32px_1fr_1fr_32px] sm:items-start">
            <span className="font-display text-xl italic text-tan sm:pt-1.5">{String(i + 1).padStart(2, '0')}</span>
            <FormField label="Title" error={fieldErr(`items.${i}.title`)}><TextInput value={it.title ?? ''} onChange={(e) => setItem(i, { title: e.target.value })} maxLength={40} placeholder="e.g. Hand-stitched" disabled={!canEdit} /></FormField>
            <FormField label="Subtitle" error={fieldErr(`items.${i}.subtitle`)}><TextInput value={it.subtitle ?? ''} onChange={(e) => setItem(i, { subtitle: e.target.value })} maxLength={60} placeholder="e.g. Built to last" disabled={!canEdit} /></FormField>
            {canEdit && f.items.length > 1 && <button type="button" onClick={() => set({ items: f.items.filter((_, j) => j !== i) })} aria-label={`Remove highlight ${i + 1}`} className="grid size-8 place-items-center justify-self-end rounded-lg text-amute hover:bg-asoft hover:text-bad sm:mt-6"><Trash2 className="size-4" /></button>}
          </div>
        ))}
      </div>
      {fieldErr('items') && <p className="text-xs text-bad">{fieldErr('items')}</p>}
      {canEdit && f.items.length < 4 && <Btn v="white" sm icon={Plus} onClick={() => set({ items: [...f.items, { title: '', subtitle: '' }] })}>Add highlight</Btn>}
      {form && <div className="flex justify-end gap-2"><Btn v="white" sm onClick={() => setForm(null)}>Discard</Btn><Btn sm disabled={save.isPending || !canEdit} onClick={() => save.mutate(f)}>{save.isPending && <Spin />}Save</Btn></div>}
    </Card>
  )
}

function BannerEditor({ initial, onDone }) {
  const { can } = useAdminAuth()
  const [f, setF] = useState(initial)
  const [errors, setErrors] = useState({})
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation((b) => {
    const body = toFormData({
      position: b.position, title: b.title, eyebrow: b.eyebrow, subtitle: b.subtitle, link: b.link, button_text: b.button_text,
      show_text: b.show_text, is_active: b.is_active, sort_order: Number(b.sort_order) || 0,
      starts_at: b.starts_at ? new Date(b.starts_at).toISOString() : '', ends_at: b.ends_at ? new Date(b.ends_at).toISOString() : '',
      ...(b.image instanceof File ? { image: b.image } : {}),
    })
    return b.id ? adminApi.put(`/admin/banners/${b.id}`, body) : adminApi.post('/admin/banners', body)
  }, { invalidate: ['banners'], success: (_, b) => (b.id ? 'Banner saved' : 'Banner added'), onSuccess: onDone })
  const submit = (e) => { e.preventDefault(); setErrors({}); save.mutate(f, { onError: (err) => setErrors(err.fields || {}) }) }
  const hero = f.position === 'home_hero'

  return (
    <form onSubmit={submit} className="space-y-3.5 rounded-xl bg-asoft p-3.5 sm:p-4">
      <p className="text-[13px] font-semibold">{f.id ? `Editing “${f.title}”` : 'New banner'}</p>
      <FormField label="Image *" error={errors.image}><ImagePicker value={f.image} onChange={(image) => set({ image })} aspect={hero ? 'aspect-[1983/793]' : 'aspect-square'} size={hero ? 'w-[180px]' : 'w-[88px]'} hint="JPG, PNG or WebP · max 5 MB" /></FormField>
      <div className="grid gap-3.5 md:grid-cols-2">
        <FormField label="Title *" error={errors.title}><TextInput value={f.title} onChange={(e) => set({ title: e.target.value })} invalid={!!errors.title} /></FormField>
        <FormField label="Small line above the title" error={errors.eyebrow}><TextInput value={f.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="New season" maxLength={60} /></FormField>
      </div>
      <FormField label="Subtitle" error={errors.subtitle}><TextInput value={f.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></FormField>
      <div className="grid gap-3.5 md:grid-cols-3">
        <FormField label="Button text" error={errors.button_text}><TextInput value={f.button_text} onChange={(e) => set({ button_text: e.target.value })} maxLength={40} /></FormField>
        <FormField label="Link" error={errors.link}><TextInput value={f.link} onChange={(e) => set({ link: e.target.value })} placeholder="/shop?c=bags" /></FormField>
        <FormField label="Order" error={errors.sort_order}><TextInput value={f.sort_order} inputMode="numeric" onChange={(e) => set({ sort_order: e.target.value.replace(/\D/g, '') })} /></FormField>
        <FormField label="Show from" error={errors.starts_at} help="Optional"><TextInput type="datetime-local" value={f.starts_at} onChange={(e) => set({ starts_at: e.target.value })} /></FormField>
        <FormField label="Show until" error={errors.ends_at} help="Optional"><TextInput type="datetime-local" value={f.ends_at} onChange={(e) => set({ ends_at: e.target.value })} /></FormField>
      </div>
      <SwitchRow label="Show text on the image" sub="Turn off when the artwork already has its own text" checked={f.show_text} onChange={(show_text) => set({ show_text })} />
      <SwitchRow label="Visible" checked={f.is_active} onChange={(is_active) => set({ is_active })} />
      <div className="flex justify-end gap-2"><Btn v="white" type="button" onClick={onDone}>Cancel</Btn><Btn disabled={save.isPending || !can('content', f.id ? 'edit' : 'create')}>{save.isPending && <Spin />}{f.id ? 'Save banner' : 'Add banner'}</Btn></div>
    </form>
  )
}

function BannerGroup({ position, banners }) {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const cfg = POSITIONS[position]
  const [editing, setEditing] = useState(null)
  const list = banners.filter((b) => b.position === position)
  const remove = async (b) => {
    const done = await confirmAndRun({ title: `Delete “${b.title}”?`, confirmText: 'Delete', danger: true }, () => adminApi.del(`/admin/banners/${b.id}`))
    if (done) { toast.success('Banner deleted'); qc.invalidateQueries({ queryKey: ['admin', 'banners'] }); qc.invalidateQueries({ queryKey: ['home'] }) }
  }
  return (
    <Card title={cfg.title} sub={cfg.sub} right={can('content', 'create') && list.length < cfg.max && <Btn v="white" sm icon={Plus} onClick={() => setEditing(blank(position, list.length + 1))}>Add {position === 'home_hero' ? 'slide' : 'tile'}</Btn>}>
      <div className={cx('no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:px-0', position === 'home_hero' ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {list.map((b) => {
          const [label, tone] = bannerStatus(b)
          return (
            <div key={b.id} className={cx('w-[80%] shrink-0 rounded-xl border bg-white p-2 sm:w-auto', editing?.id === b.id ? 'border-tan ring-1 ring-tan' : 'border-aline')}>
              <img src={b.image} alt="" className={cx('w-full rounded-md object-cover', position === 'home_hero' ? 'aspect-[16/7]' : 'aspect-[16/9]')} />
              <div className="space-y-1.5 px-1 pb-1 pt-2.5">
                <div className="flex items-center justify-between gap-2"><p className="truncate text-[13px] font-semibold">{b.title}</p><Badge tone={tone}>{label}</Badge></div>
                <p className="truncate text-xs text-amute">{b.link || 'No link'} · order {b.sort_order}</p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  {can('content', 'edit') && <button type="button" onClick={() => setEditing(toForm(b))} className="font-semibold text-tan">Edit</button>}
                  {can('content', 'delete') && <button type="button" onClick={() => remove(b)} className="text-bad">Delete</button>}
                </div>
              </div>
            </div>
          )
        })}
        {!list.length && <p className="text-[13px] text-amute">No banners yet.</p>}
      </div>
      {editing && <BannerEditor key={editing.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />}
    </Card>
  )
}

export default function AdminContent() {
  const { data } = useAdminList('banners')
  const banners = data?.data ?? []
  return (
    <>
      <PageHead
        title="Content & banners"
        sub="Announcement bar, homepage slider, promo tiles, highlights and testimonials · changes go live immediately"
        actions={<Btn v="white" icon={Eye} onClick={() => window.open('/', '_blank')}>View store</Btn>}
      />
      <Announcement />
      <BannerGroup position="home_hero" banners={banners} />
      <BannerGroup position="home_side" banners={banners} />
      <Highlights />
      <Testimonials />
      <Card title="Homepage product sliders">
        <p className="text-[13px] text-amute">Choose which categories get a product slider on the homepage from <a href="/admin/categories" className="font-semibold text-tan">Categories</a> (the “On homepage” switch). The flash sale section is managed in <a href="/admin/flash-sales" className="font-semibold text-tan">Flash sales</a>.</p>
      </Card>
    </>
  )
}
