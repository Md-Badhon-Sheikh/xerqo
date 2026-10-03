import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, PackageX, X } from 'lucide-react'
import { AccountShell } from '../../components/store/AccountShell'
import { Bone, Button, Checkbox, EmptyState, Pill, cx } from '../../components/store/ui'
import { api } from '../../lib/api'
import { toast } from '../../lib/alert'

const RATING_LABEL = ['Tap to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Loved it!']
const SERVICE = [['delivery_rating', 'Delivery speed'], ['packaging_rating', 'Packaging'], ['courier_rating', 'Delivery person / courier'], ['support_rating', 'Customer support (call confirmation)']]
const MAX_PHOTOS = 5
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

function StarInput({ value, onChange, big, label }) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)}
          className={cx('leading-none text-amber transition hover:scale-110', big ? 'text-[30px] sm:text-[34px]' : 'text-lg')}>
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

const Card = ({ className, children }) => <div className={cx('rounded-lg bg-white p-4 sm:p-6', className)}>{children}</div>

function ProductReview({ item, tags: allTags, value, onChange, error }) {
  const existing = item.review
  const set = (patch) => onChange({ ...value, ...patch })
  const toggleTag = (t) => set({ tags: value.tags.includes(t) ? value.tags.filter((x) => x !== t) : [...value.tags, t] })
  const addFiles = (files) => {
    const room = MAX_PHOTOS - (existing?.photos?.length ?? 0) - value.files.length
    const picked = [...files].filter((f) => f.type.startsWith('image/')).slice(0, Math.max(0, room))
    if (files.length > picked.length) toast.info(`Up to ${MAX_PHOTOS} photos per review.`)
    set({ files: [...value.files, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))] })
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src={item.image || '/images/logo.png'} alt={item.name} className="size-14 rounded object-cover sm:size-16" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold leading-tight sm:text-2xl">{item.name}</h2>
          <p className="text-xs text-mute">{item.variant_name ? `${item.variant_name} · ` : ''}Qty {item.qty}</p>
        </div>
        {existing && <Pill tone={existing.status === 'approved' ? 'leaf' : existing.status === 'rejected' ? 'rust' : 'amber'}>{existing.status === 'approved' ? 'Published' : existing.status === 'rejected' ? 'Not published' : 'Pending'}</Pill>}
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-[13px] font-semibold">Your rating</span>
        <div className="flex items-center gap-3">
          <StarInput big value={value.rating} onChange={(rating) => set({ rating })} label={`Rate ${item.name}`} />
          <span className="text-sm font-medium text-tan">{RATING_LABEL[value.rating]}</span>
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-rust">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {allTags.map((t) => {
          const on = value.tags.includes(t)
          return (
            <button key={t} type="button" onClick={() => toggleTag(t)} aria-pressed={on} className={cx('rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'border-tan bg-tan/10 text-tan' : 'border-line bg-white hover:border-ink')}>
              {on && '✓ '}{t}
            </button>
          )
        })}
      </div>

      <label className="block space-y-1.5">
        <span className="block text-[13px] font-semibold">Write your review <span className="font-normal text-mute">(optional)</span></span>
        <textarea rows={4} value={value.body} maxLength={3000} onChange={(e) => set({ body: e.target.value })} placeholder="Tell others what you liked — the leather, the stitching, the colour…" className="input resize-none leading-relaxed" />
        <span className="block text-xs text-mute">{value.body.length} / 3000</span>
      </label>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold">Photos <span className="font-normal text-mute">(optional, up to {MAX_PHOTOS})</span></p>
        <div className="flex flex-wrap gap-2.5">
          {existing?.photos?.map((src) => <img key={src} src={src} alt="" className="size-[72px] rounded object-cover sm:size-[88px]" />)}
          {value.files.map((p, i) => (
            <div key={p.url} className="relative size-[72px] sm:size-[88px]">
              <img src={p.url} alt="" className="size-full rounded object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => set({ files: value.files.filter((_, j) => j !== i) })} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-white"><X className="size-3" /></button>
            </div>
          ))}
          {!existing && (existing?.photos?.length ?? 0) + value.files.length < MAX_PHOTOS && (
            <label className="grid size-[72px] cursor-pointer place-items-center rounded border border-dashed border-tan bg-sand text-tan sm:size-[88px]">
              <span className="flex flex-col items-center gap-1 text-[11px] font-semibold"><Camera className="size-4" />Add</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { const files = [...e.target.files]; e.target.value = ''; addFiles(files) }} />
            </label>
          )}
        </div>
        {existing && <p className="text-[11px] text-mute">Photos can’t be changed after posting. Editing sends the review back for a quick check.</p>}
      </div>
    </Card>
  )
}

function ServiceFeedback({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="h-display text-2xl sm:text-[28px]">Delivery &amp; service feedback</h2>
        <p className="text-xs text-mute">Only XERQO sees this — it helps us improve.</p>
      </div>
      <div className="divide-y divide-line">
        {SERVICE.map(([key, label]) => (
          <div key={key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px]">{label}</span>
            <StarInput value={value[key] ?? 0} onChange={(v) => set({ [key]: v })} label={label} />
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-line pt-4">
        <p className="text-[13px] font-semibold">How likely are you to recommend XERQO to a friend?</p>
        <div className="grid grid-cols-11 gap-1 sm:gap-2">
          {Array.from({ length: 11 }).map((_, n) => (
            <button key={n} type="button" onClick={() => set({ nps: n })} aria-pressed={value.nps === n} className={cx('rounded border py-1.5 text-[11px] font-medium transition sm:py-2.5 sm:text-xs', value.nps === n ? 'border-tan bg-tan text-white' : 'border-line bg-white hover:border-ink')}>{n}</button>
          ))}
        </div>
        <p className="flex justify-between text-[11px] text-mute"><span>Not likely</span><span>Very likely</span></p>
      </div>
      <label className="block space-y-1.5">
        <span className="block text-[13px] font-semibold">Anything we could do better?</span>
        <textarea rows={3} value={value.comment ?? ''} maxLength={1000} onChange={(e) => set({ comment: e.target.value })} placeholder="e.g. Rider called before arriving — very helpful!" className="input resize-none" />
      </label>
    </Card>
  )
}

const draftFor = (item) => ({
  rating: item.review?.rating ?? 0,
  tags: item.review?.tags ?? [],
  body: item.review?.body ?? '',
  files: [],
})

function ReviewForm({ order }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [drafts, setDrafts] = useState(() => Object.fromEntries(order.items.map((i) => [i.product_id, draftFor(i)])))
  const [feedback, setFeedback] = useState(() => order.feedback ?? {})
  const [anonymous, setAnonymous] = useState(() => order.items.some((i) => i.review?.is_anonymous))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // free the photo previews when leaving the page
  useEffect(() => () => Object.values(drafts).forEach((d) => d.files.forEach((f) => URL.revokeObjectURL(f.url))), []) // eslint-disable-line react-hooks/exhaustive-deps

  const changed = (item) => {
    const d = drafts[item.product_id]
    const r = item.review
    if (!r) return d.rating > 0
    return d.rating !== r.rating || d.body !== (r.body ?? '') || d.tags.join() !== (r.tags ?? []).join() || anonymous !== r.is_anonymous
  }
  const hasFeedback = SERVICE.some(([k]) => feedback[k]) || feedback.nps != null || feedback.comment
  const feedbackChanged = JSON.stringify(feedback) !== JSON.stringify(order.feedback ?? {})

  const submit = async (e) => {
    e.preventDefault()
    const todo = order.items.filter(changed)
    const missing = order.items.filter((i) => !i.review && !drafts[i.product_id].rating && (drafts[i.product_id].body || drafts[i.product_id].files.length || drafts[i.product_id].tags.length))
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((i) => [i.product_id, 'Pick a star rating to post this review.'])))
      return
    }
    if (!todo.length && !(hasFeedback && feedbackChanged)) { toast.info('Rate at least one product or the delivery first.'); return }

    setSaving(true); setErrors({})
    let posted = 0
    try {
      for (const item of todo) {
        const d = drafts[item.product_id]
        try {
          if (item.review) {
            await api.put(`/reviews/${item.review.id}`, { rating: d.rating, body: d.body || null, tags: d.tags, is_anonymous: anonymous })
          } else {
            const form = new FormData()
            form.append('order_number', order.order_number)
            form.append('product_id', item.product_id)
            form.append('rating', d.rating)
            if (d.body) form.append('body', d.body)
            d.tags.forEach((t) => form.append('tags[]', t))
            form.append('is_anonymous', anonymous ? '1' : '0')
            d.files.forEach((f) => form.append('photos[]', f.file))
            await api.post('/reviews', form)
          }
          posted++
        } catch (err) {
          setErrors((x) => ({ ...x, [item.product_id]: err.message }))
        }
      }
      if (hasFeedback && feedbackChanged) {
        await api.post(`/me/orders/${order.order_number}/feedback`, {
          ...Object.fromEntries(SERVICE.map(([k]) => [k, feedback[k] || null])),
          nps: feedback.nps ?? null,
          comment: feedback.comment?.trim() || null,
        })
      }
      // drop the cached review list so My reviews loads fresh instead of flashing the old one
      qc.removeQueries({ queryKey: ['customer', 'reviews'] })
      qc.removeQueries({ queryKey: ['customer', 'order-review', order.order_number] })
      qc.invalidateQueries({ queryKey: ['customer'] })
      if (posted === todo.length) {
        toast.success(posted ? 'Thanks! Your review will appear after a quick check.' : 'Thanks for the feedback!')
        navigate('/account/reviews')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={submit}>
      {order.items.map((item) => (
        <ProductReview key={item.product_id} item={item} tags={order.tags} value={drafts[item.product_id]} error={errors[item.product_id]}
          onChange={(v) => { setDrafts((x) => ({ ...x, [item.product_id]: v })); setErrors((x) => ({ ...x, [item.product_id]: undefined })) }} />
      ))}
      <ServiceFeedback value={feedback} onChange={setFeedback} />
      <Checkbox label="Post my review anonymously (shown as “XERQO customer”)" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
        <Button variant="tan" size="lg" type="submit" disabled={saving}>{saving ? 'Sending…' : 'Submit review & feedback'}</Button>
        <Button variant="outline" size="lg" to="/account/reviews">Cancel</Button>
      </div>
      <p className="text-xs text-mute">Reviews are checked by our team before they go live. <Link to="/account/reviews" className="font-semibold text-ink underline underline-offset-2">See my reviews</Link></p>
    </form>
  )
}

export default function WriteReview() {
  const { orderId } = useParams()
  const { data: order, isPending, error } = useQuery({
    queryKey: ['customer', 'order-review', orderId],
    queryFn: () => api.get(`/me/orders/${orderId}/review`).then((r) => r.data),
    retry: false,
  })

  return (
    <>
      <section className="bg-leaf/10">
        <div className="container-x flex flex-col gap-2 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf text-white sm:size-11"><Check className="size-5" strokeWidth={2.5} /></span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-leaf">{order?.delivered_at ? `Delivered on ${fmt(order.delivered_at)} · ` : ''}Order #{orderId}</p>
              <h1 className="h-display text-[24px] sm:text-[32px]">How was your XERQO experience?</h1>
            </div>
          </div>
        </div>
      </section>

      <AccountShell hideUser>
        {isPending ? (
          <div className="space-y-4">{[0, 1].map((i) => <Bone key={i} className="h-64 w-full rounded-lg" />)}</div>
        ) : error || !order ? (
          <EmptyState icon={PackageX} title="Order not found" text="We couldn’t find this order in your account." action={<Button to="/account" variant="outline">My orders</Button>} />
        ) : !order.can_review ? (
          <EmptyState icon={PackageX} title="Not delivered yet" text="You can review your products once the order has been delivered." action={<Button to={`/track?order=${order.order_number}`} variant="outline">Track order</Button>} />
        ) : (
          <ReviewForm order={order} />
        )}
      </AccountShell>
    </>
  )
}
