import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { Badge, Btn, Card, PageHead, Select, Textarea, cx } from '../../components/admin/ui'
import { FormField, ImagePicker, LoadingBlock, Spin, Switch, SwitchRow, TextInput, toFormData } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const blank = { id: null, name: '', slug: '', parent_id: '', description: '', sort_order: '0', is_active: true, show_on_home: false, image: null }
const toForm = (c) => ({ id: c.id, name: c.name, slug: c.slug, parent_id: c.parent_id ? String(c.parent_id) : '', description: c.description ?? '', sort_order: String(c.sort_order ?? 0), is_active: c.is_active, show_on_home: !!c.show_on_home, image: c.image })

function Row({ c, depth = 0, selected, onSelect, onHome, canEdit }) {
  return (
    <div className={cx('flex items-center gap-3 border-b border-aline py-3 pr-1', selected && 'bg-abg', depth ? 'pl-7 sm:pl-12' : 'px-1 sm:px-0')}>
      {depth > 0 && <span className="h-px w-2.5 shrink-0 bg-ink" />}
      {c.image ? <img src={c.image} alt="" className={cx('shrink-0 rounded-md object-cover', depth ? 'size-8' : 'size-11')} /> : <span className={cx('shrink-0 rounded-md bg-asoft', depth ? 'size-8' : 'size-11')} />}
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-2 truncate text-sm font-semibold">{c.name}{!c.is_active && <Badge tone="gray">Hidden</Badge>}</p>
        <p className="truncate text-xs text-amute">{c.products_count ?? 0} products · /{c.slug}</p>
      </button>
      {!depth && <Switch checked={!!c.show_on_home} disabled={!canEdit} onChange={onHome} label={`Show ${c.name} slider on homepage`} />}
      <button type="button" onClick={onSelect} aria-label={`Edit ${c.name}`} className="text-amute hover:text-ink"><ChevronRight className="size-4" /></button>
    </div>
  )
}

export default function Categories() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending } = useAdminList('categories')
  const all = data?.data ?? []
  const top = all.filter((c) => !c.parent_id)
  const [form, setForm] = useState(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const open = (c) => { setForm(c ? toForm(c) : blank); setSlugTouched(!!c); setErrors({}) }

  const home = useAdminMutation(({ id, show_on_home }) => adminApi.put(`/admin/categories/${id}`, { show_on_home }), {
    invalidate: ['categories'],
    success: (_, v) => (v.show_on_home ? 'Slider added to the homepage' : 'Slider removed from the homepage'),
  })

  const save = useAdminMutation((f) => {
    const body = toFormData({
      name: f.name, slug: f.slug, parent_id: f.parent_id || '', description: f.description, sort_order: Number(f.sort_order) || 0,
      is_active: f.is_active, show_on_home: f.show_on_home, ...(f.image instanceof File ? { image: f.image } : {}),
    })
    return f.id ? adminApi.put(`/admin/categories/${f.id}`, body) : adminApi.post('/admin/categories', body)
  }, {
    invalidate: ['categories'],
    success: (_, f) => (f.id ? 'Category saved' : 'Category created'),
    onSuccess: (res) => { setForm(toForm(res.data)); setSlugTouched(true) },
  })

  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    save.mutate(form, { onError: (err) => setErrors(err.fields || {}) })
  }

  const remove = async () => {
    const done = await confirmAndRun({ title: `Delete “${form.name}”?`, text: 'Only empty categories can be deleted. Move or delete its products first.', confirmText: 'Delete', danger: true },
      () => adminApi.del(`/admin/categories/${form.id}`))
    if (done) {
      toast.success('Category deleted')
      setForm(null)
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      qc.invalidateQueries({ queryKey: ['categories'] })
    }
  }

  const parentOptions = [{ value: '', label: 'None (top level)' }, ...top.filter((c) => c.id !== form?.id).map((c) => ({ value: String(c.id), label: c.name }))]
  const canEdit = can('categories', 'edit')
  const subCount = all.length - top.length

  return (
    <>
      <PageHead
        title="Categories"
        sub={data ? `${top.length} categories · ${subCount} sub-categories · toggle = product slider on the homepage` : 'Loading…'}
        actions={can('categories', 'create') && <Btn icon={Plus} onClick={() => open(null)}>Add category</Btn>}
      />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        {isPending ? <LoadingBlock /> : (
          <Card title="All categories" right={<span className="pt-1 text-[11px] text-amute">On homepage</span>}>
            <div className="-mt-2">
              {top.map((c) => (
                <div key={c.id}>
                  <Row c={c} selected={form?.id === c.id} onSelect={() => open(c)} onHome={(v) => home.mutate({ id: c.id, show_on_home: v })} canEdit={canEdit} />
                  {all.filter((k) => k.parent_id === c.id).map((k) => <Row key={k.id} c={k} depth={1} selected={form?.id === k.id} onSelect={() => open(k)} />)}
                </div>
              ))}
              {!top.length && <p className="py-8 text-center text-[13px] text-amute">No categories yet.</p>}
            </div>
          </Card>
        )}

        {form ? (
          <Card key={form.id ?? 'new'} title={form.id ? 'Edit category' : 'New category'} sub={form.id ? form.name : 'Top level, or under a parent as a sub-category'}>
            <form onSubmit={submit} className="space-y-4">
              <FormField label="Name *" error={errors.name}><TextInput value={form.name} invalid={!!errors.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></FormField>
              <FormField label="URL slug" error={errors.slug}>
                <span className="flex items-center rounded-lg border border-aline bg-white text-[13px] focus-within:border-tan">
                  <span className="pl-3 text-tan">/shop?c=</span>
                  <input className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none" value={form.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }) }} />
                </span>
              </FormField>
              <FormField label="Parent category" error={errors.parent_id}><Select options={parentOptions} value={form.parent_id} onChange={(parent_id) => set({ parent_id })} /></FormField>
              <FormField label="Category image" error={errors.image}>
                <ImagePicker value={form.image} onChange={(image) => set({ image })} hint="Square, at least 600×600px" />
              </FormField>
              <FormField label="Description" error={errors.description} help="Shown under the category title in the shop"><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></FormField>
              <FormField label="Sort order" error={errors.sort_order} help="Lower numbers come first"><TextInput value={form.sort_order} inputMode="numeric" onChange={(e) => set({ sort_order: e.target.value.replace(/\D/g, '') })} /></FormField>
              <SwitchRow label="Visible on the store" checked={form.is_active} onChange={(is_active) => set({ is_active })} />
              {!form.parent_id && <SwitchRow label="Product slider on homepage" sub="Shows this category's products as a slider" checked={form.show_on_home} onChange={(show_on_home) => set({ show_on_home })} />}
              <div className="grid grid-cols-[auto_1fr] gap-2.5">
                {form.id && can('categories', 'delete') ? <Btn v="white" type="button" onClick={remove}>Delete</Btn> : <Btn v="white" type="button" onClick={() => setForm(null)}>Cancel</Btn>}
                <Btn disabled={save.isPending || !can('categories', form.id ? 'edit' : 'create')}>{save.isPending && <Spin />}{form.id ? 'Save category' : 'Create category'}</Btn>
              </div>
            </form>
          </Card>
        ) : (
          <Card title="Edit category"><p className="text-[13px] text-amute">Select a category to edit it, or add a new one.</p></Card>
        )}
      </div>
    </>
  )
}
