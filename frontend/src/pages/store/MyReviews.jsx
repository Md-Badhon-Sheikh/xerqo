import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ThumbsUp, Clock } from 'lucide-react'
import { orders, products } from '../../data/store'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, Stars, Pill, cx } from '../../components/store/ui'

const toReview = [
  { p: products[0], order: orders[1] },
  { p: products[15], order: orders[2] },
]

const myReviews = [
  { p: products[5], variant: 'Cognac', rating: 5, date: '28 Jul 2026', status: 'Published', helpful: 14, photos: ['/images/fb-long-wallet.jpg', '/images/wallet-cash.jpg'],
    text: 'Genuine crocodile-embossed leather, stitching is super neat. Smells like real leather. After 2 months it looks even better.',
    reply: 'Thank you Rahim bhai! Condition it every 3 months to keep that shine.' },
  { p: products[11], variant: 'Black', rating: 4, date: '24 Aug 2026', status: 'Pending', helpful: 0, photos: ['/images/fb-passport-black.jpg'],
    text: 'Name engraving came out perfect. Only wish it had one more card slot.' },
  { p: products[30], variant: 'Tan', rating: 5, date: '02 Jun 2026', status: 'Published', helpful: 6, photos: [],
    text: 'Slim enough for my front pocket and the edges are beautifully burnished.' },
]

const feedback = [
  { id: 'XQ-21877', date: '22 Aug 2026', courier: 'Steadfast', scores: [5, 5, 4], note: 'Rider called before arriving — very helpful!' },
  { id: 'XQ-19340', date: '28 Jul 2026', courier: 'Pathao', scores: [4, 5, 5], note: 'Gift box was lovely.' },
  { id: 'XQ-17702', date: '02 Jun 2026', courier: 'Steadfast', scores: [5, 4, 4], note: '' },
]

function AwaitingCard({ p, order }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg bg-white p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        <img src={p.image} alt={p.name} className="size-[60px] shrink-0 rounded object-cover" />
        <div className="min-w-0">
          <h3 className="font-display text-xl font-semibold leading-tight sm:text-[22px]">{p.name}</h3>
          <p className="text-xs text-mute">Delivered {order.date.replace(/ 2026$/, '')} · Order #{order.id}</p>
          <p className="text-sm text-line">☆☆☆☆☆ <span className="ml-1 text-xs text-mute/50">Tap to rate</span></p>
        </div>
      </div>
      <Button to={`/account/review/${order.id}`} variant="tan" className="w-full sm:w-auto">Write review</Button>
    </article>
  )
}

function ReviewCard({ r }) {
  return (
    <article className="space-y-3.5 rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-tan">RU</span>
          <div>
            <p className="text-sm font-semibold">Rahim Uddin</p>
            <p className="whitespace-nowrap text-[11px] text-leaf"><span className="text-mute">Dhaka ·</span> ✓ Verified buyer</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-mute">{r.date}</span>
          {r.status === 'Pending'
            ? <Pill tone="amber" className="whitespace-nowrap"><Clock className="size-3" />Pending<span className="max-sm:hidden"> moderation</span></Pill>
            : <Pill tone="leaf">Published</Pill>}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-mute">
        <Stars n={r.rating} className="text-sm" />
        <Link to={`/product/${r.p.slug}`} className="hover:text-ink">{r.p.name} · {r.variant}</Link>
      </p>
      <p className="text-sm leading-relaxed">{r.text}</p>
      {r.photos.length > 0 && (
        <div className="flex gap-2">{r.photos.map((src) => <img key={src} src={src} alt="" className="size-16 rounded object-cover sm:size-[68px]" />)}</div>
      )}
      {r.reply && (
        <div className="rounded bg-sand p-3.5">
          <p className="text-xs font-semibold text-tan">XERQO replied</p>
          <p className="mt-0.5 text-[13px] text-mute">{r.reply}</p>
        </div>
      )}
      <div className="flex gap-4 text-xs text-mute">
        {r.status === 'Pending'
          ? <><button className="font-semibold text-ink hover:underline">Edit</button><button className="hover:text-rust">Delete</button></>
          : <><span className="flex items-center gap-1"><ThumbsUp className="size-3.5 text-amber" />Helpful ({r.helpful})</span><button className="hover:text-ink">Report</button></>}
      </div>
    </article>
  )
}

function FeedbackCard({ f }) {
  const labels = ['Delivery speed', 'Packaging', 'Courier']
  return (
    <article className="space-y-3 rounded-lg bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Order #{f.id}</p>
        <span className="text-xs text-mute">{f.date} · {f.courier}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {labels.map((l, i) => <p key={l} className="flex items-center justify-between gap-2 rounded bg-cream px-3 py-2 text-xs"><span>{l}</span><Stars n={f.scores[i]} /></p>)}
      </div>
      {f.note && <p className="text-[13px] italic text-mute">“{f.note}”</p>}
    </article>
  )
}

export default function MyReviews() {
  const published = myReviews.filter((r) => r.status === 'Published')
  const tabs = [['review', `To review (${toReview.length})`], ['published', `Published (${published.length})`], ['feedback', `Feedback (${feedback.length})`]]
  const [tab, setTab] = useState('review')
  return (
    <AccountShell title="My reviews">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium', tab === k ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{l}</button>
        ))}
      </div>

      {tab === 'review' && (
        <>
          <div className="space-y-3">{toReview.map((t) => <AwaitingCard key={t.p.id} {...t} />)}</div>
          <p className="eyebrow pt-2">Your reviews</p>
          <div className="space-y-3 sm:space-y-4">{myReviews.map((r) => <ReviewCard key={r.p.id} r={r} />)}</div>
        </>
      )}
      {tab === 'published' && <div className="space-y-3 sm:space-y-4">{published.map((r) => <ReviewCard key={r.p.id} r={r} />)}</div>}
      {tab === 'feedback' && (
        <>
          <p className="text-[13px] text-mute">Delivery &amp; service feedback is private — only the XERQO team sees it.</p>
          <div className="space-y-3">{feedback.map((f) => <FeedbackCard key={f.id} f={f} />)}</div>
        </>
      )}
    </AccountShell>
  )
}
