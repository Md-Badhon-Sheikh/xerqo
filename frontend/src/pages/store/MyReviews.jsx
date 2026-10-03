import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, MessageSquareText, Star } from 'lucide-react'
import { AccountShell } from '../../components/store/AccountShell'
import { Bone, Button, EmptyState, Pill, Stars, cx } from '../../components/store/ui'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function AwaitingCard({ t }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg bg-white p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        <img src={t.image || '/images/logo.png'} alt={t.name} className="size-[60px] shrink-0 rounded object-cover" />
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold leading-tight sm:text-[22px]">{t.name}</h3>
          <p className="text-xs text-mute">{t.variant_name ? `${t.variant_name} · ` : ''}Delivered {fmt(t.delivered_at)} · Order #{t.order_number}</p>
        </div>
      </div>
      <Button to={`/account/review/${t.order_number}`} variant="tan" className="w-full sm:w-auto">Write review</Button>
    </article>
  )
}

function ReviewCard({ r, name, onDeleted }) {
  const statusPill = {
    pending: <Pill tone="amber" className="whitespace-nowrap"><Clock className="size-3" />Pending<span className="max-sm:hidden"> moderation</span></Pill>,
    approved: <Pill tone="leaf">Published</Pill>,
    rejected: <Pill tone="rust">Not published</Pill>,
  }[r.status]
  const remove = async () => {
    const done = await confirmAndRun({ title: 'Delete this review?', text: 'This cannot be undone.', confirmText: 'Delete', danger: true }, () => api.del(`/reviews/${r.id}`))
    if (done) { toast.success('Review deleted'); onDeleted() }
  }
  return (
    <article className="space-y-3.5 rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-tan">{initials(name)}</span>
          <div>
            <p className="text-sm font-semibold">{r.is_anonymous ? 'Posted anonymously' : name}</p>
            <p className="whitespace-nowrap text-[11px] text-leaf">✓ Verified buyer</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-mute">{fmt(r.created_at)}</span>
          {statusPill}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-mute">
        <Stars n={r.rating} className="text-sm" />
        {r.product ? <Link to={`/product/${r.product.slug}`} className="hover:text-ink">{r.product.name}</Link> : 'Product removed'}
        {r.order_number && <span>· Order #{r.order_number}</span>}
      </p>
      {r.title && <p className="text-sm font-semibold">{r.title}</p>}
      {r.body && <p className="whitespace-pre-line text-sm leading-relaxed">{r.body}</p>}
      {r.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{r.tags.map((t) => <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-[11px]">{t}</span>)}</div>}
      {r.photos?.length > 0 && <div className="flex gap-2">{r.photos.map((src) => <img key={src} src={src} alt="" className="size-16 rounded object-cover sm:size-[68px]" />)}</div>}
      {r.reply && r.status === 'approved' && (
        <div className="rounded bg-sand p-3.5">
          <p className="text-xs font-semibold text-tan">XERQO replied</p>
          <p className="mt-0.5 text-[13px] text-mute">{r.reply}</p>
        </div>
      )}
      <div className="flex gap-4 text-xs text-mute">
        {r.order_number && <Link to={`/account/review/${r.order_number}`} className="font-semibold text-ink hover:underline">Edit</Link>}
        <button type="button" onClick={remove} className="hover:text-rust">Delete</button>
        {r.status === 'approved' && r.product && <Link to={`/product/${r.product.slug}#reviews`} className="ml-auto hover:text-ink">View on product page</Link>}
      </div>
    </article>
  )
}

const LABELS = [['delivery_rating', 'Delivery speed'], ['packaging_rating', 'Packaging'], ['courier_rating', 'Courier'], ['support_rating', 'Call confirmation']]
function FeedbackCard({ f }) {
  return (
    <article className="space-y-3 rounded-lg bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Order #{f.order_number}</p>
        <span className="text-xs text-mute">{fmt(f.delivered_at || f.created_at)}{f.courier ? ` · ${f.courier}` : ''}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {LABELS.filter(([k]) => f[k]).map(([k, l]) => <p key={k} className="flex items-center justify-between gap-2 rounded bg-cream px-3 py-2 text-xs"><span>{l}</span><Stars n={f[k]} /></p>)}
      </div>
      {f.nps != null && <p className="text-xs text-mute">Would recommend XERQO: <b className="text-ink">{f.nps}/10</b></p>}
      {f.comment && <p className="text-[13px] italic text-mute">“{f.comment}”</p>}
      <Link to={`/account/review/${f.order_number}`} className="inline-block text-xs font-semibold text-ink hover:underline">Edit feedback</Link>
    </article>
  )
}

export default function MyReviews() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data, isPending } = useQuery({ queryKey: ['customer', 'reviews'], queryFn: () => api.get('/me/reviews') })
  const reviews = data?.data ?? []
  const toReview = data?.to_review ?? []
  const feedback = data?.feedback ?? []
  const published = reviews.filter((r) => r.status === 'approved')
  const [tab, setTab] = useState('review')
  const tabs = [['review', `To review (${toReview.length})`], ['mine', `My reviews (${reviews.length})`], ['published', `Published (${published.length})`], ['feedback', `Feedback (${feedback.length})`]]
  const refresh = () => qc.invalidateQueries({ queryKey: ['customer', 'reviews'] })
  const list = tab === 'published' ? published : reviews

  return (
    <AccountShell title="My reviews">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cx('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium', tab === k ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{l}</button>
        ))}
      </div>

      {isPending ? <div className="space-y-3">{[0, 1].map((i) => <Bone key={i} className="h-24 w-full rounded-lg" />)}</div> : <>
        {tab === 'review' && (toReview.length
          ? <div className="space-y-3">{toReview.map((t) => <AwaitingCard key={`${t.order_number}-${t.product_id}`} t={t} />)}</div>
          : <EmptyState icon={Star} title="Nothing to review" text="When an order is delivered, its products show up here so you can rate them." action={<Button to="/shop" variant="outline">Continue shopping</Button>} />)}

        {(tab === 'mine' || tab === 'published') && (list.length
          ? <div className="space-y-3 sm:space-y-4">{list.map((r) => <ReviewCard key={r.id} r={r} name={user?.name ?? ''} onDeleted={refresh} />)}</div>
          : <EmptyState icon={MessageSquareText} title={tab === 'published' ? 'No published reviews yet' : 'No reviews yet'} text="Reviews are checked by our team before they go live." />)}

        {tab === 'feedback' && <>
          <p className="text-[13px] text-mute">Delivery &amp; service feedback is private — only the XERQO team sees it.</p>
          {feedback.length
            ? <div className="space-y-3">{feedback.map((f) => <FeedbackCard key={f.id} f={f} />)}</div>
            : <EmptyState icon={MessageSquareText} title="No feedback yet" text="Tell us about the delivery when you review an order." />}
        </>}
      </>}
    </AccountShell>
  )
}
