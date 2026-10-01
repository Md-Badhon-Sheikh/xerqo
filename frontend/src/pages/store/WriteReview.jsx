import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Camera, X, Gift } from 'lucide-react'
import { orders } from '../../data/store'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, Checkbox, cx } from '../../components/store/ui'

const RATING_LABEL = ['Tap to rate', 'Poor', 'Fair', 'Good', 'Very good', 'Loved it!']
const TAGS = ['Great quality', 'Neat stitching', 'Smells like real leather', 'Worth the price', 'Nice colour', 'Fast delivery']
const SERVICE = [['Delivery speed', 5], ['Packaging', 5], ['Delivery person / courier', 4], ['Customer support (call confirmation)', 4]]

function StarInput({ value, onChange, big }) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1" role="radiogroup">
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

function AddTile() {
  return (
    <label className="grid size-[72px] cursor-pointer place-items-center rounded border border-dashed border-tan bg-sand text-tan sm:size-[88px]">
      <span className="flex flex-col items-center gap-1 text-[11px] font-semibold"><Camera className="size-4" />Add</span>
      <input type="file" accept="image/*,video/*" multiple className="sr-only" />
    </label>
  )
}

function ProductReview({ p, draft, initial }) {
  const [rating, setRating] = useState(initial.rating)
  const [tags, setTags] = useState(initial.tags)
  const [text, setText] = useState(initial.text)
  const toggle = (t) => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <img src={p.image} alt={p.name} className="size-14 rounded object-cover sm:size-16" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold leading-tight sm:text-2xl">{p.name}</h2>
          <p className="text-xs text-mute">{initial.variant} · Qty 1</p>
        </div>
        {draft && <span className="text-[11px] text-mute max-sm:hidden">Draft saved</span>}
      </div>

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-[13px] font-semibold">Your rating</span>
        <div className="flex items-center gap-3">
          <StarInput big value={rating} onChange={setRating} />
          <span className="text-sm font-medium text-tan">{RATING_LABEL[rating]}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TAGS.slice(0, initial.tagCount).map((t) => {
          const on = tags.includes(t)
          return (
            <button key={t} type="button" onClick={() => toggle(t)} className={cx('rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'border-tan bg-tan/10 text-tan' : 'border-line bg-white hover:border-ink')}>
              {on && '✓ '}{t}
            </button>
          )
        })}
      </div>

      <label className="block space-y-1.5">
        <span className="block text-[13px] font-semibold">Write your review</span>
        <textarea rows={4} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Tell others what you liked…" className="input resize-none leading-relaxed" />
        <span className="block text-xs text-mute">{text ? `${text.length} / 1000` : 'Min. 20 characters'}</span>
      </label>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold">Add photos or video <span className="font-normal text-mute">(optional)</span></p>
        <div className="flex flex-wrap gap-2.5">
          {initial.photos.map((src) => (
            <div key={src} className="relative size-[72px] sm:size-[88px]">
              <img src={src} alt="" className="size-full rounded object-cover" />
              <button type="button" aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-white"><X className="size-3" /></button>
            </div>
          ))}
          <AddTile />
        </div>
      </div>
    </Card>
  )
}

function ServiceFeedback() {
  const [scores, setScores] = useState(SERVICE.map(([, v]) => v))
  const [nps, setNps] = useState(9)
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="h-display text-2xl sm:text-[28px]">Delivery &amp; service feedback</h2>
        <p className="text-xs text-mute">Only XERQO sees this — it helps us improve.</p>
      </div>
      <div className="divide-y divide-line">
        {SERVICE.map(([label], i) => (
          <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[13px]">{label}</span>
            <StarInput value={scores[i]} onChange={(v) => setScores(scores.map((s, j) => (j === i ? v : s)))} />
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-line pt-4">
        <p className="text-[13px] font-semibold">How likely are you to recommend XERQO to a friend?</p>
        <div className="grid grid-cols-11 gap-1 sm:gap-2">
          {Array.from({ length: 11 }).map((_, n) => (
            <button key={n} type="button" onClick={() => setNps(n)} className={cx('rounded border py-1.5 text-[11px] font-medium transition sm:py-2.5 sm:text-xs', nps === n ? 'border-tan bg-tan text-white' : 'border-line bg-white hover:border-ink')}>{n}</button>
          ))}
        </div>
        <p className="flex justify-between text-[11px] text-mute"><span>Not likely</span><span>Very likely</span></p>
      </div>
      <label className="block space-y-1.5">
        <span className="block text-[13px] font-semibold">Anything we could do better?</span>
        <textarea rows={3} placeholder="e.g. Rider called before arriving — very helpful!" className="input resize-none" />
      </label>
    </Card>
  )
}

export default function WriteReview() {
  const { orderId } = useParams()
  const order = orders.find((o) => o.id === orderId) || orders.find((o) => o.reviewPending)
  const presets = [
    { rating: 5, tags: ['Great quality', 'Neat stitching', 'Smells like real leather'], tagCount: 4, variant: 'Burgundy Croc', photos: [order.items[0].image, '/images/open-wallet.jpg'], text: 'Absolutely beautiful wallet — the colour is richer in person and the stitching feels solid. Packaging was premium too. Will buy the matching key holder!' },
    { rating: 4, tags: ['Great quality'], tagCount: 3, variant: 'Tan', photos: [], text: '' },
  ]
  return (
    <>
      <section className="bg-leaf/10">
        <div className="container-x flex flex-col gap-2 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf text-white sm:size-11"><Check className="size-5" strokeWidth={2.5} /></span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-leaf">Delivered on 14 Sep 2026 · Order #{order.id}</p>
              <h1 className="h-display text-[24px] sm:text-[32px]">How was your XERQO experience?</h1>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-tan"><Gift className="size-3.5" />Earn 50 reward points for a photo review</p>
        </div>
      </section>

      <AccountShell hideUser>
        <form className="space-y-4 sm:space-y-5" onSubmit={(e) => e.preventDefault()}>
          {order.items.map((p, i) => <ProductReview key={p.id} p={p} draft={i > 0} initial={presets[i] || presets[1]} />)}
          <ServiceFeedback />
          <Checkbox label="Post my review anonymously" />
          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <Button variant="tan" size="lg">Submit review &amp; feedback</Button>
            <Button variant="outline" size="lg">Save as draft</Button>
          </div>
          <p className="text-xs text-mute">Reviews are checked by our team before they go live. <Link to="/account/reviews" className="font-semibold text-ink underline underline-offset-2">See my reviews</Link></p>
        </form>
      </AccountShell>
    </>
  )
}
