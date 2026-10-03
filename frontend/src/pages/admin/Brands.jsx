import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { Badge, Btn, Card, PageHead, Textarea, cx } from '../../components/admin/ui'
import { FormField, ImagePicker, LoadingBlock, Spin, SwitchRow, TextInput, toFormData } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const blank = { id: null, name: '', slug: '', description: '', sort_order: '0', is_active: true, logo: null, remove_logo: false }
const toForm = (b) => ({ id: b.id, name: b.name, slug: b.slug, description: b.description ?? '', sort_order: String(b.sort_order ?? 0), is_active: b.is_active, logo: b.logo, remove_logo: false })

export default function Brands() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending } = useAdminList('brands')
  const brands = data?.data ?? []
  const [form, setForm] = useState(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const open = (b) => { setForm(b ? toForm(b) : blank); setSlugTouched(!!b); setErrors({}) }

  const save = useAdminMutation((f) => {
    const body = toFormData({
      name: f.name, slug: f.slug, description: f.description, sort_order: Number(f.sort_order) || 0, is_active: f.is_active,
      ...(f.logo instanceof File ? { logo: f.logo } : {}), ...(f.remove_logo ? { remove_logo: true } : {}),
    })
    return f.id ? adminApi.put(`/admin/brands/${f.id}`, body) : adminApi.post('/admin/brands', body)
  }, {
    invalidate: ['brands'],
    success: (_, f) => (f.id ? 'Brand saved' : 'Brand created'),
    onSuccess: (res) => { setForm(toForm(res.data)); setSlugTouched(true) },
  })

  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    save.mutate(form, { onError: (err) => setErrors(err.fields || {}) })
  }

  const remove = async () => {
    const done = await confirmAndRun({ title: `Delete “${form.name}”?`, text: 'Its products stay on the store, just without a brand.', confirmText: 'Delete', danger: true },
      () => adminApi.del(`/admin/brands/${form.id}`))
    if (done) {
      toast.success('Brand deleted')
      setForm(null)
      qc.invalidateQueries({ queryKey: ['admin'] })
    }
  }

  return (
    <>
      <PageHead
        title="Brands"
        sub={data ? `${brands.length} brands · used for the brand filter in the shop` : 'Loading…'}
        actions={can('categories', 'create') && <Btn icon={Plus} onClick={() => open(null)}>Add brand</Btn>}
      />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        {isPending ? <LoadingBlock /> : (
          <Card title="All brands">
            <div className="-mt-2">
              {brands.map((b) => (
                <button key={b.id} type="button" onClick={() => open(b)} className={cx('flex w-full items-center gap-3 border-b border-aline px-1 py-3 text-left', form?.id === b.id && 'bg-abg')}>
                  {b.logo ? <img src={b.logo} alt="" className="size-11 shrink-0 rounded-md border border-aline object-contain p-1" /> : <span className="grid size-11 shrink-0 place-items-center rounded-md bg-asoft text-xs font-bold text-tan">{b.name.slice(0, 2).toUpperCase()}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate text-sm font-semibold">{b.name}{!b.is_active && <Badge tone="gray">Hidden</Badge>}</span>
                    <span className="block truncate text-xs text-amute">{b.products_count ?? 0} products · {b.slug}</span>
                  </span>
                  <ChevronRight className="size-4 text-amute" />
                </button>
              ))}
              {!brands.length && <p className="py-8 text-center text-[13px] text-amute">No brands yet.</p>}
            </div>
          </Card>
        )}

        {form ? (
          <Card key={form.id ?? 'new'} title={form.id ? 'Edit brand' : 'New brand'} sub={form.id ? form.name : undefined}>
            <form onSubmit={submit} className="space-y-4">
              <FormField label="Name *" error={errors.name}><TextInput value={form.name} invalid={!!errors.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></FormField>
              <FormField label="Slug" error={errors.slug}><TextInput value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }) }} /></FormField>
              <FormField label="Logo" error={errors.logo}>
                <ImagePicker value={form.logo} onChange={(logo) => set({ logo, remove_logo: false })} onRemove={() => set({ logo: null, remove_logo: !!form.id })} label="Upload logo" hint="PNG or JPG, max 2 MB" />
              </FormField>
              <FormField label="Description" error={errors.description}><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></FormField>
              <FormField label="Sort order" error={errors.sort_order}><TextInput value={form.sort_order} inputMode="numeric" onChange={(e) => set({ sort_order: e.target.value.replace(/\D/g, '') })} /></FormField>
              <SwitchRow label="Active" sub="Inactive brands are hidden from the shop filter" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
              <div className="grid grid-cols-[auto_1fr] gap-2.5">
                {form.id && can('categories', 'delete') ? <Btn v="white" type="button" onClick={remove}>Delete</Btn> : <Btn v="white" type="button" onClick={() => setForm(null)}>Cancel</Btn>}
                <Btn disabled={save.isPending || !can('categories', form.id ? 'edit' : 'create')}>{save.isPending && <Spin />}{form.id ? 'Save brand' : 'Create brand'}</Btn>
              </div>
            </form>
          </Card>
        ) : (
          <Card title="Edit brand"><p className="text-[13px] text-amute">Select a brand to edit it, or add a new one.</p></Card>
        )}
      </div>
    </>
  )
}
