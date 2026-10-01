import { useState } from 'react'
import { Check, Download, MessageCircle, Settings, Star } from 'lucide-react'
import { Badge, Btn, Card, Col, KPIs, PageHead, Tabs, Thumb, Two, cx } from '../../components/admin/ui'
import { products } from '../../data/admin'

const INITIAL = [
  { id: 1, product: products[5], by: 'Nusrat Jahan', ago: '2h ago', rating: 5, status: 'Pending', text: 'Bought for my husband with his name engraved. Premium leather, beautiful box!', photos: ['/images/fb-premium.jpg'] },
  { id: 2, product: products[0], by: 'Tanvir Ahmed', ago: '5h ago', rating: 5, status: 'Pending', text: 'Slim yet fits 12 cards. Stitching is really neat.', photos: ['/images/hands-brown.jpg', '/images/tools-hand.jpg'] },
  { id: 3, product: products[20], by: 'Sadia Rahman', ago: '1d ago', rating: 2, status: 'Flagged', text: 'Colour looks different from the photo. Clasp is a bit loose.' },
  { id: 4, product: { ...products[6], name: 'Zip Long Wallet', image: '/images/black-wallet.jpg' }, by: 'Farhan Kabir', ago: '2d ago', rating: 4, status: 'Published', text: 'Great wallet, delivery in 3 days.' },
]
const SERVICE = [['Delivery speed', 4.7, '#2F7A4B'], ['Packaging', 4.9, '#2F7A4B'], ['Courier behaviour', 4.4, '#B7791F'], ['Call confirmation', 4.6, '#B7791F']]
const CHIPS = [['Thank you', ' Thank you so much for your kind words!'], ['Sorry + fix', ' Sorry for the trouble — our team will call you to fix this.'], ['Care tip', ' Tip: condition the leather every 3 months to keep the shine.']]

const Stars = ({ n }) => (
  <div className="flex gap-0.5 text-amber" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-4" fill={i <= n ? 'currentColor' : 'none'} />)}
  </div>
)

function ReviewCard({ r, onStatus, onReply, replying }) {
  return (
    <article className={cx('rounded-xl border bg-white p-4 sm:p-5', replying ? 'border-tan' : 'border-aline')}>
      <header className="flex items-start gap-3">
        <Thumb src={r.product.image} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm font-semibold">{r.product.name}</p>
            <span className="max-sm:hidden"><Badge tone={r.status === 'Flagged' ? 'red' : undefined}>{r.status}</Badge></span>
          </div>
          <p className="text-[11px] text-amute">by {r.by} · ✓ Verified buyer · {r.ago}</p>
          <span className="mt-1 inline-block sm:hidden"><Badge tone={r.status === 'Flagged' ? 'red' : undefined}>{r.status}</Badge></span>
        </div>
      </header>
      <div className="mt-3"><Stars n={r.rating} /></div>
      <p className="mt-2.5 text-[13px] leading-relaxed sm:text-sm">{r.text}</p>
      {r.photos && <div className="mt-3 flex gap-2">{r.photos.map((p) => <img key={p} src={p} alt="Customer photo" className="size-14 rounded-md object-cover" />)}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {r.status !== 'Published' && <Btn v="green" sm icon={Check} onClick={() => onStatus('Published')}>Approve</Btn>}
        <Btn v="white" sm icon={MessageCircle} onClick={onReply}>Reply</Btn>
        {r.status === 'Flagged'
          ? <Btn v="danger" sm onClick={() => onStatus('Hidden')}>Hide</Btn>
          : <Btn v="soft" sm>Feature</Btn>}
      </div>
    </article>
  )
}

export default function Reviews() {
  const [list, setList] = useState(INITIAL)
  const [target, setTarget] = useState(2)
  const [reply, setReply] = useState('Thank you Tanvir bhai! Condition it every 3 months to keep the shine.')
  const who = list.find((r) => r.id === target)

  const setStatus = (id) => (status) => setList(list.map((r) => (r.id === id ? { ...r, status } : r)))

  return (
    <>
      <PageHead
        title="Reviews & feedback"
        sub="Moderate product reviews and post-delivery feedback"
        actions={<>
          <Btn v="white" icon={Download}><span className="sm:hidden">Export</span><span className="max-sm:hidden">Export CSV</span></Btn>
          <Btn v="white" icon={Settings}><span className="sm:hidden">Settings</span><span className="max-sm:hidden">Review settings</span></Btn>
        </>}
      />

      <KPIs items={[
        ['Average rating', '4.9 ★', '▲ 0.1 this month'],
        ['Pending approval', String(list.filter((r) => r.status === 'Pending').length + 3), 'Needs action', 'amber'],
        ['Photo reviews', '48', '▲ 12'],
        ['Delivery NPS', '+72', '▲ 6 pts'],
      ]} />

      <Tabs items={[['Pending', '5'], ['Published', '2,312'], ['Flagged', '2'], ['Delivery feedback', '418']]} />

      <Two ratio="main">
        <Col>
          {list.map((r) => (
            <ReviewCard key={r.id} r={r} replying={r.id === target} onStatus={setStatus(r.id)}
              onReply={() => { setTarget(r.id); setReply(`Thank you ${r.by.split(' ')[0]}!`) }} />
          ))}
        </Col>

        <Col>
          <Card title={`Reply to ${who.by}`} sub="Public reply shown under the review">
            <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className="ainput resize-y border-tan leading-relaxed" />
            <div className="flex flex-wrap gap-1.5">
              {CHIPS.map(([l, t]) => <button key={l} type="button" onClick={() => setReply(reply + t)} className="rounded-full bg-asoft px-2.5 py-1 text-xs hover:bg-aline">+ {l}</button>)}
            </div>
            <Btn className="w-full">Post reply</Btn>
          </Card>

          <Card title="Delivery & service feedback" sub="Last 30 days · 418 responses">
            {SERVICE.map(([k, v, c]) => (
              <div key={k}>
                <div className="flex justify-between text-[13px]"><span className="text-amute">{k}</span><b>{v} ★</b></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-asoft"><div className="h-full rounded-full" style={{ width: `${(v / 5) * 100 - 15}%`, background: c }} /></div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[['78%', 'Promoters', 'bg-ok/8 text-ok'], ['16%', 'Passive', 'bg-amber/8 text-amber'], ['6%', 'Detractors', 'bg-bad/8 text-bad']].map(([v, l, t]) => (
                <div key={l} className={cx('rounded-lg py-2.5 text-center', t)}><p className="text-base font-bold">{v}</p><p className="text-[11px] text-amute">{l}</p></div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-amute">Latest comment: “Rider called before arriving — very helpful!” — Rahim, Dhaka</p>
          </Card>
        </Col>
      </Two>
    </>
  )
}
