import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Btn, Card, Col, PageHead, Select, Textarea, Two, cx } from '../../components/admin/ui'
import { FormField, LoadingBlock, Spin, Switch, TextInput } from '../../components/admin/form'
import { Rows } from '../../components/admin/contentFields'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { useAdminAuth } from '../../context/AuthContext'
import { confirmAndRun, toast } from '../../lib/alert'
import { adminApi } from '../../lib/api'
import { useAdminItem, useAdminMutation } from '../../lib/adminQueries'

/* Admin › Pages › New / Edit: a store page at /pages/{slug} — rich text, or a list of questions (FAQ) */

const TYPES = [{ value: 'page', label: 'Page — text with headings' }, { value: 'faq', label: 'FAQ — questions & answers' }]
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
const BLANK = { title: '', slug: '', type: 'page', content: '', faqs: [], meta_title: '', meta_description: '', is_published: true }

function Editor({ initial, isNew }) {
  const { can } = useAdminAuth()
  const canSave = can('content', isNew ? 'create' : 'edit')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [f, setF] = useState(() => ({ ...BLANK, ...initial, content: initial?.content ?? '', faqs: initial?.faqs ?? [], meta_title: initial?.meta_title ?? '', meta_description: initial?.meta_description ?? '' }))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [dirty, setDirty] = useState(false)
  const set = (patch) => { setF((x) => ({ ...x, ...patch })); setDirty(true) }

  const save = useAdminMutation(
    (body) => (isNew ? adminApi.post('/admin/site-pages', body) : adminApi.put(`/admin/site-pages/${initial.id}`, body)),
    {
      invalidate: ['site-pages'],
      success: isNew ? 'Page created' : 'Page saved',
      onSuccess: (res) => { setDirty(false); if (isNew) navigate(`/admin/site-pages/${res.data.id}`, { replace: true }) },
    },
  )
  const fields = save.error?.fields ?? {}
  const err = (k) => fields[k]
  const submit = () => save.mutate({
    ...f,
    slug: f.slug || slugify(f.title),
    content: f.type === 'page' ? f.content : null,
    faqs: f.type === 'faq' ? f.faqs : null,
    meta_title: f.meta_title || null,
    meta_description: f.meta_description || null,
  }, { onError: (e) => { if (e?.status === 422) toast.error('Please fix the highlighted fields.') } })

  const remove = () => confirmAndRun(
    { title: `Delete “${f.title}”?`, text: 'The page and its address stop working.', confirmText: 'Delete', danger: true },
    async () => {
      await adminApi.del(`/admin/site-pages/${initial.id}`)
      qc.invalidateQueries({ queryKey: ['admin', 'site-pages'] })
      toast.success('Page deleted')
      navigate('/admin/site-pages', { replace: true })
    },
  )

  const url = `/pages/${f.slug || slugify(f.title) || '…'}`
  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/site-pages" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Pages</Link>
        <PageHead
          title={isNew ? 'New page' : f.title || 'Edit page'}
          sub={isNew ? 'Write the page, then save — publish it when it’s ready' : <>Address: <span className="font-semibold text-ink">{url}</span></>}
          actions={!isNew && initial.is_published && <Btn v="white" icon={ExternalLink} onClick={() => window.open(`/pages/${initial.slug}`, '_blank')}>View page</Btn>}
        />
      </div>

      <Two ratio="main">
        <Col>
          <Card>
            <FormField label="Title *" error={err('title')}>
              <TextInput value={f.title} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} maxLength={150} placeholder="e.g. Size Guide" disabled={!canSave} invalid={!!err('title')} />
            </FormField>
            {f.type === 'page' ? (
              <FormField label="Content" error={err('content')} help="Use Heading for each section. Pasted text loses its styling — format it with the buttons.">
                <RichTextEditor value={f.content} onChange={(content) => set({ content })} disabled={!canSave} invalid={!!err('content')} />
              </FormField>
            ) : (
              <FormField label="Questions" error={err('faqs')} help="Questions with the same group are shown together under that group's tab.">
                <Rows items={f.faqs} onChange={(faqs) => set({ faqs })} max={200} blank={{ group: f.faqs.at(-1)?.group ?? '', question: '', answer: '' }} addLabel="Add question" disabled={!canSave}>
                  {(q, up, i) => (
                    <div className="space-y-2.5">
                      <div className="grid gap-2.5 sm:grid-cols-[180px_1fr]">
                        <TextInput value={q.group ?? ''} onChange={(e) => up({ group: e.target.value })} maxLength={60} placeholder="Group, e.g. Delivery" aria-label="Group" disabled={!canSave} />
                        <TextInput value={q.question ?? ''} onChange={(e) => up({ question: e.target.value })} maxLength={300} placeholder="Question" aria-label="Question" disabled={!canSave} invalid={!!err(`faqs.${i}.question`)} />
                      </div>
                      <Textarea rows={2} value={q.answer ?? ''} onChange={(e) => up({ answer: e.target.value })} maxLength={3000} placeholder="Answer" aria-label="Answer" disabled={!canSave} />
                      {(err(`faqs.${i}.question`) || err(`faqs.${i}.answer`)) && <p className="text-xs text-bad">Question and answer are both required.</p>}
                    </div>
                  )}
                </Rows>
              </FormField>
            )}
          </Card>
        </Col>
        <Col>
          <Card title="Publishing">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[13px] font-semibold">{f.is_published ? 'Published' : 'Hidden'}</p><p className="text-[11px] text-amute">{f.is_published ? 'Anyone can open this page' : 'Only you can see it here'}</p></div>
              <Switch checked={f.is_published} onChange={(is_published) => set({ is_published })} label="Published" disabled={!canSave} />
            </div>
            <FormField label="Page type" help={!isNew ? 'Switching type keeps only the new type’s content when you save.' : undefined}>
              <Select search={false} options={TYPES} value={f.type} onChange={(type) => set({ type })} disabled={!canSave} />
            </FormField>
            <FormField label="Address" error={err('slug')} help={`Link to it as ${url} — e.g. in About · Contact · Footer → Footer`}>
              <div className={cx('flex items-center rounded-lg border bg-white text-[13px]', err('slug') ? 'border-bad' : 'border-aline')}>
                <span className="pl-3 text-amute">/pages/</span>
                <input className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 outline-none" value={f.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }) }} placeholder={slugify(f.title) || 'size-guide'} disabled={!canSave} aria-label="Page address" />
              </div>
            </FormField>
          </Card>
          <Card title="Search engines" sub="Optional — the title and a short description for Google">
            <FormField label="Meta title" error={err('meta_title')} help={`${f.meta_title.length} / 60`}><TextInput value={f.meta_title} onChange={(e) => set({ meta_title: e.target.value })} maxLength={70} placeholder={f.title} disabled={!canSave} /></FormField>
            <FormField label="Meta description" error={err('meta_description')} help={`${f.meta_description.length} / 160`}><Textarea rows={3} value={f.meta_description} onChange={(e) => set({ meta_description: e.target.value })} maxLength={170} disabled={!canSave} /></FormField>
          </Card>
          {!isNew && can('content', 'delete') && <Btn v="white" icon={Trash2} onClick={remove} className="text-bad">Delete page</Btn>}
        </Col>
      </Two>

      {canSave && (
        <div className={cx('sticky bottom-0 z-10 flex items-center justify-end gap-2 rounded-xl border border-aline bg-white/95 p-3 backdrop-blur', !dirty && !isNew && 'opacity-80')}>
          {dirty && <span className="mr-auto text-xs text-amute">Unsaved changes</span>}
          <Btn v="white" sm to="/admin/site-pages">{dirty ? 'Discard' : 'Back'}</Btn>
          <Btn sm disabled={save.isPending || !f.title.trim() || (!dirty && !isNew)} onClick={submit}>{save.isPending && <Spin />}{isNew ? 'Create page' : 'Save'}</Btn>
        </div>
      )}
    </>
  )
}

export default function AdminSitePageEditor() {
  const { id } = useParams()
  const isNew = !id
  const { data, isPending, error } = useAdminItem('site-pages', id)
  if (isNew) return <Editor isNew initial={BLANK} />
  if (isPending) return <LoadingBlock rows={8} />
  if (error) return <div className="rounded-xl border border-aline bg-white p-8 text-center text-[13px] text-amute">{error.status === 404 ? 'This page no longer exists.' : error.message} <Link to="/admin/site-pages" className="font-semibold text-tan">Back to pages</Link></div>
  return <Editor key={data.id} initial={data} />
}
