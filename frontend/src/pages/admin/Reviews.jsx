import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, MessageCircle, Package, Sparkles, Star, Trash2, X } from 'lucide-react'
import { Badge, Btn, Card, Col, KPIs, PageHead, Select, Tabs, Textarea, Thumb, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox, Spin } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const STATUS = { pending: ['Pending', 'amber'], approved: ['Published', 'green'], rejected: ['Rejected', 'red'] }
const TABS = [['Pending', 'pending'], ['Published', 'approved'], ['Featured', 'featured'], ['Rejected', 'rejected'], ['All', 'all'], ['Delivery feedback', 'feedback']]
const RATINGS = [{ value: '', label: 'Rating: All' }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }))]
const CHIPS = [['Thank you', 'Thank you so much for your kind words!'], ['Sorry + fix', 'Sorry for the trouble — our team will call you to make it right.'], ['Care tip', 'Tip: condition the leather every 3 months to keep the shine.']]
const SERVICE = [['delivery_rating', 'Delivery speed'], ['packaging_rating', 'Packaging'], ['courier_rating', 'Courier behaviour'], ['support_rating', 'Call confirmation']]

const Stars = ({ n, size = 'size-4' }) => (
  <div className="flex gap-0.5 text-amber" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={size} fill={i <= n ? 'currentColor' : 'none'} />)}
  </div>
)

function ReviewCard({ r, active, onSelect, canEdit }) {
  const [label, tone] = STATUS[r.status] ?? [r.status, 'gray']
  const act = useAdminMutation(({ path, body }) => adminApi.patch(`/admin/reviews/${r.id}/${path}`, body), {
    invalidate: ['reviews'], success: (_, v) => v.msg,
  })
  const remove = async () => {
    const done = await confirmAndRun({ title: 'Delete this review?', text: 'It is removed for good, with its photos.', confirmText: 'Delete', danger: true }, () => adminApi.del(`/admin/reviews/${r.id}`))
    if (done) { toast.success('Review deleted'); act.reset(); onSelect(null, true) }
  }

  return (
    <article onClick={() => onSelect(r.id)} className={cx('cursor-pointer rounded-xl border bg-white p-4 sm:p-5', active ? 'border-tan ring-1 ring-tan' : 'border-aline hover:border-tan/40')}>
      <header className="flex items-start gap-3">
        {r.product?.image ? <Thumb src={r.product.image} size={44} /> : <span className="grid size-11 place-items-center rounded-md bg-asoft"><Package className="size-4 text-amute" /></span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <Link to={r.product ? `/product/${r.product.slug}` : '#'} target="_blank" onClick={(e) => e.stopPropagation()} className="text-sm font-semibold hover:text-tan">{r.product?.name ?? 'Deleted product'}</Link>
            <span className="flex gap-1.5">{r.is_featured && <Badge tone="tan">Featured</Badge>}<Badge tone={tone}>{label}</Badge></span>
          </div>
          <p className="text-[11px] text-amute">
            by {r.customer?.name ?? r.author?.name}{r.is_anonymous && ' (posted anonymously)'} · ✓ Verified buyer · {r.order_number && <Link to={`/admin/orders/${r.order_number}`} onClick={(e) => e.stopPropagation()} className="hover:text-ink">#{r.order_number}</Link>} · {ago(r.created_at)}
          </p>
        </div>
      </header>
      <div className="mt-3"><Stars n={r.rating} /></div>
      {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
      {r.body && <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed sm:text-sm">{r.body}</p>}
      {r.tags?.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{r.tags.map((t) => <span key={t} className="rounded-full bg-asoft px-2 py-0.5 text-[11px]">{t}</span>)}</div>}
      {r.photos?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.photos.map((p) => <a key={p} href={p} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><img src={p} alt="Customer photo" className="size-14 rounded-md object-cover" /></a>)}</div>}
      {r.reply && <div className="mt-3 rounded-lg bg-asoft p-3"><p className="text-[11px] font-semibold text-tan">XERQO replied</p><p className="mt-0.5 text-[13px] text-amute">{r.reply}</p></div>}
      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {r.status !== 'approved' && <Btn v="green" sm icon={Check} disabled={act.isPending} onClick={() => act.mutate({ path: 'approve', msg: 'Review published' })}>Approve</Btn>}
          {r.status === 'pending' && <Btn v="danger" sm icon={X} disabled={act.isPending} onClick={() => act.mutate({ path: 'reject', msg: 'Review rejected' })}>Reject</Btn>}
          <Btn v="white" sm icon={MessageCircle} onClick={() => onSelect(r.id)}>{r.reply ? 'Edit reply' : 'Reply'}</Btn>
          {r.status === 'approved' && (
            <Btn v="soft" sm icon={Sparkles} disabled={act.isPending} onClick={() => act.mutate({ path: 'feature', body: { is_featured: !r.is_featured }, msg: r.is_featured ? 'Removed from the home page' : 'Featured on the home page' })}>
              {r.is_featured ? 'Unfeature' : 'Feature'}
            </Btn>
          )}
          {r.status === 'approved' && <Btn v="white" sm disabled={act.isPending} onClick={() => act.mutate({ path: 'reject', msg: 'Review hidden' })}>Hide</Btn>}
          <button type="button" onClick={remove} aria-label="Delete review" className="ml-auto grid size-8 place-items-center rounded-lg text-amute hover:bg-bad/10 hover:text-bad"><Trash2 className="size-4" /></button>
          {act.isPending && <Spin className="self-center text-tan" />}
        </div>
      )}
    </article>
  )
}

function ReplyCard({ r, canEdit }) {
  const first = (r.customer?.name ?? '').split(' ')[0]
  const [text, setText] = useState(r.reply ?? (first ? `Thank you ${first}! ` : ''))
  const save = useAdminMutation((reply) => adminApi.patch(`/admin/reviews/${r.id}/reply`, { reply }), {
    invalidate: ['reviews'], success: (_, reply) => (reply ? 'Reply posted' : 'Reply removed'),
  })
  if (!canEdit) return null
  return (
    <Card title={`Reply to ${r.customer?.name ?? 'customer'}`} sub={r.status === 'approved' ? 'Public — shown under the review on the product page' : 'Shown once the review is published'}>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className="ainput resize-y border-tan leading-relaxed" />
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map(([l, t]) => <button key={l} type="button" onClick={() => setText(`${text.trimEnd()} ${t}`.trim())} className="rounded-full bg-asoft px-2.5 py-1 text-xs hover:bg-aline">+ {l}</button>)}
      </div>
      <div className="flex gap-2">
        <Btn className="flex-1" disabled={save.isPending || !text.trim() || text.trim() === r.reply} onClick={() => save.mutate(text.trim())}>{save.isPending && <Spin />}{r.reply ? 'Update reply' : 'Post reply'}</Btn>
        {r.reply && <Btn v="white" disabled={save.isPending} onClick={() => save.mutate(null)}>Remove</Btn>}
      </div>
    </Card>
  )
}

function FeedbackSummary({ s, days }) {
  if (!s) return null
  return (
    <Card title="Delivery & service feedback" sub={`Last ${days} days · ${s.responses} response${s.responses === 1 ? '' : 's'} · private`}>
      {!s.responses ? <p className="text-[13px] text-amute">No feedback yet. Customers rate delivery when they review a delivered order.</p> : <>
        {SERVICE.map(([k, l]) => {
          const v = s.averages[k] || 0
          return (
            <div key={k}>
              <div className="flex justify-between text-[13px]"><span className="text-amute">{l}</span><b>{v ? `${v} ★` : '—'}</b></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-asoft"><div className="h-full rounded-full" style={{ width: `${(v / 5) * 100}%`, background: v >= 4.5 ? '#2F7A4B' : v >= 3.5 ? '#B7791F' : '#B83A3A' }} /></div>
            </div>
          )
        })}
        {s.nps != null && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[[s.promoters, 'Promoters', 'bg-ok/8 text-ok'], [s.passives, 'Passive', 'bg-amber/8 text-amber'], [s.detractors, 'Detractors', 'bg-bad/8 text-bad']].map(([v, l, t]) => (
              <div key={l} className={cx('rounded-lg py-2.5 text-center', t)}><p className="text-base font-bold">{v}%</p><p className="text-[11px] text-amute">{l}</p></div>
            ))}
          </div>
        )}
        {s.latest_comment && <p className="text-xs leading-relaxed text-amute">Latest comment: “{s.latest_comment.comment}” — {s.latest_comment.name}{s.latest_comment.district ? `, ${s.latest_comment.district}` : ''}</p>}
      </>}
    </Card>
  )
}

function FeedbackList({ days, setDays }) {
  const [page, setPage] = useState(1)
  const { data, isPending } = useAdminList('reviews/feedback', { days, page })
  const list = data?.data ?? []
  return (
    <Two ratio="main">
      <Col>
        <div className="flex justify-end"><Select search={false} value={String(days)} onChange={(v) => { setDays(Number(v)); setPage(1) }} className="w-44" aria-label="Period" options={[7, 30, 90, 365].map((d) => ({ value: String(d), label: `Last ${d} days` }))} /></div>
        {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title="No feedback in this period" text="Customers rate delivery, packaging and the courier after their order arrives." /> : <>
          {list.map((f) => (
            <article key={f.id} className="space-y-3 rounded-xl border border-aline bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold"><Link to={`/admin/orders/${f.order_number}`} className="hover:text-tan">#{f.order_number}</Link> · {f.customer}</p>
                <span className="text-[11px] text-amute">{f.courier ?? 'Courier —'} · {f.district} · {ago(f.created_at)}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICE.filter(([k]) => f[k]).map(([k, l]) => <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-asoft px-3 py-2 text-xs"><span>{l}</span><Stars n={f[k]} size="size-3.5" /></div>)}
              </div>
              {f.nps != null && <p className="text-xs text-amute">Would recommend: <b className={f.nps >= 9 ? 'text-ok' : f.nps >= 7 ? 'text-amber' : 'text-bad'}>{f.nps}/10</b></p>}
              {f.comment && <p className="text-[13px] italic text-amute">“{f.comment}”</p>}
            </article>
          ))}
          <Paginator meta={data?.meta} onPage={setPage} />
        </>}
      </Col>
      <Col><FeedbackSummary s={data?.summary} days={days} /></Col>
    </Two>
  )
}

export default function Reviews() {
  const { can } = useAdminAuth()
  const canEdit = can('reviews', 'edit')
  const [f, setF] = useState({ status: 'pending', q: '', rating: '', page: 1 })
  const [sel, setSel] = useState(null)
  const [days, setDays] = useState(30)
  const set = (patch) => { setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 })); setSel(null) }
  const isFeedback = f.status === 'feedback'
  const { data, isPending, isPlaceholderData } = useAdminList('reviews', { ...f, status: f.status === 'all' ? '' : f.status, per_page: 10 }, { enabled: !isFeedback })
  const feedback = useAdminList('reviews/feedback', { days: 30, page: 1 })
  const list = data?.data ?? []
  const counts = data?.counts
  const sum = data?.summary
  const current = list.find((r) => r.id === sel) ?? list[0]
  const avgDelta = sum && sum.average_last_month ? +(sum.average - sum.average_last_month).toFixed(1) : null

  return (
    <>
      <PageHead title="Reviews & feedback" sub="Moderate product reviews, reply publicly and read private delivery feedback" />

      <KPIs items={sum ? [
        ['Average rating', sum.average ? `${sum.average} ★` : '—', avgDelta ? `${avgDelta > 0 ? '▲' : '▼'} ${Math.abs(avgDelta)} vs last month` : `${counts.approved} published`, avgDelta < 0 ? 'red' : 'gray'],
        ['Pending approval', String(counts.pending), counts.pending ? 'Needs action' : 'All caught up', counts.pending ? 'amber' : 'green'],
        ['Photo reviews', String(sum.photo_reviews), 'Published with photos', 'gray'],
        ['Delivery NPS', sum.nps == null ? '—' : `${sum.nps > 0 ? '+' : ''}${sum.nps}`, `${feedback.data?.summary?.responses ?? 0} response${feedback.data?.summary?.responses === 1 ? "" : "s"} · 30 days`, sum.nps == null || sum.nps >= 30 ? 'green' : sum.nps >= 0 ? 'amber' : 'red'],
      ] : [['Average rating', '…'], ['Pending approval', '…'], ['Photo reviews', '…'], ['Delivery NPS', '…']]} />

      <Tabs items={TABS.map(([l, k]) => [l, k === 'feedback' ? feedback.data?.meta?.total : counts?.[k], k])} active={f.status} onChange={(status) => set({ status })} />

      {isFeedback ? <FeedbackList days={days} setDays={setDays} /> : <>
        <div className="flex flex-col gap-2.5 md:flex-row">
          <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search product, customer or text" />
          <Select options={RATINGS} search={false} value={f.rating} onChange={(rating) => set({ rating })} className="md:w-40" aria-label="Rating" />
        </div>
        <Two ratio="main">
          <Col className={cx('transition-opacity', isPlaceholderData && 'opacity-60')}>
            {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title={f.status === 'pending' ? 'No reviews waiting' : 'No reviews here'} text="New reviews arrive after customers receive their orders." /> : <>
              {list.map((r) => <ReviewCard key={r.id} r={r} active={current?.id === r.id} canEdit={canEdit} onSelect={(id) => setSel(id)} />)}
              <Paginator meta={data?.meta} onPage={(page) => set({ page })} />
            </>}
          </Col>
          <Col>
            {current && <ReplyCard key={`${current.id}-${current.reply}`} r={current} canEdit={canEdit} />}
            <FeedbackSummary s={feedback.data?.summary} days={30} />
          </Col>
        </Two>
      </>}
    </>
  )
}
