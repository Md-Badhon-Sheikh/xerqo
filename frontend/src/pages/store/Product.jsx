import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, Maximize2, MessageCircle, Minus, Plus, ThumbsUp } from 'lucide-react'
import { products, findProduct, tk, discount } from '../../data/store'
import { Breadcrumb, Button, Stars, Qty, CatProductCard, cx } from '../../components/store/ui'

/* ---------- Static PDP content (comes from the product API later) ---------- */
const GALLERY = ['/images/leather-close.jpg', '/images/hands-brown.jpg', '/images/wallet-cash.jpg', '/images/tools-flat.jpg']
const COLOURS = [
  { name: 'Cognac Brown', hex: '#8B4A22' },
  { name: 'Black', hex: '#231A15' },
  { name: 'Chestnut', hex: '#5C3A21' },
  { name: 'Burgundy', hex: '#6E2427' },
]
const DELIVERY = [['Inside Dhaka', '1–2 days · ৳60'], ['Outside Dhaka', '2–4 days · ৳120'], ['Free delivery', 'Orders over ৳2,000'], ['Easy return', '7 days · free exchange']]
const BREAKDOWN = [[5, 212], [4, 18], [3, 4], [2, 1], [1, 1]]
const CUSTOMER_PHOTOS = ['/images/fb-long-wallet.jpg', '/images/open-wallet.jpg', '/images/wallet-cash.jpg', '/images/hands-brown.jpg', '/images/black-wallet.jpg', '/images/fb-premium.jpg']
const REVIEWS = [
  { name: 'Nusrat Jahan', city: 'Chattogram', when: '2 days ago', rating: 5, variant: 'Cognac · Engraved', text: 'Bought for my husband with his name engraved. Leather quality is premium and it came in a beautiful box!', photos: ['/images/fb-long-wallet.jpg'], reply: 'Thank you Nusrat apu! We hope he enjoys it for years to come.', helpful: 21 },
  { name: 'Tanvir Ahmed', city: 'Dhaka', when: '1 week ago', rating: 5, variant: 'Black', text: 'Slim yet fits 12 cards. Stitching is really neat. COD made it easy to trust.', photos: ['/images/open-wallet.jpg', '/images/hands-brown.jpg'], helpful: 9 },
  { name: 'Farhan Kabir', city: 'Sylhet', when: '3 weeks ago', rating: 4, variant: 'Wine', text: 'Great wallet, colour slightly darker than photo. Delivery in 3 days.', photos: [], helpful: 3 },
]

const initials = (name) => name.split(' ').map((x) => x[0]).join('')

/* ---------- Gallery ---------- */
function Gallery({ p }) {
  const images = [p.image, ...GALLERY]
  const [active, setActive] = useState(0)
  const off = discount(p)
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row-reverse">
      <div className="relative flex-1 overflow-hidden bg-tile max-sm:-mx-4 sm:rounded-lg">
        <img src={images[active]} alt={p.name} className="aspect-square w-full object-cover sm:aspect-[4/3] lg:aspect-[10/11]" />
        {off > 0 && <span className="absolute left-3 top-3 rounded-sm bg-tan px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:left-5 sm:top-5 sm:text-[11px]">-{off}% Festive offer</span>}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold sm:hidden">{active + 1} / {images.length}</span>
        <button className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium shadow-sm sm:flex"><Maximize2 className="size-3.5" /> Zoom</button>
      </div>
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-visible">
        {images.map((src, i) => (
          <button key={src} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} className={cx('aspect-square w-[68px] shrink-0 overflow-hidden rounded bg-tile transition sm:w-20 lg:w-full', i === active ? 'ring-2 ring-tan ring-offset-2 ring-offset-cream' : 'opacity-75 hover:opacity-100')}>
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Buy box ---------- */
function Accordion({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold sm:py-5">
        {title}{open ? <Minus className="size-4" /> : <Plus className="size-4" />}
      </button>
      {open && <div className="pb-5 text-[13px] leading-relaxed text-mute sm:text-sm">{children}</div>}
    </div>
  )
}

function BuyBox({ p }) {
  const [colour, setColour] = useState(COLOURS[0].name)
  const [engrave, setEngrave] = useState(true)
  const save = p.oldPrice ? p.oldPrice - p.price : 0
  const soldOut = p.stock === 0
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="eyebrow">{p.category.replace(/s$/, '')} · Full-grain</p>
          <Stars count={`4.9 · ${p.reviews}`} className="text-[11px]" />
        </div>
        <h1 className="h-display text-[32px] sm:text-[42px] lg:text-[44px]">{p.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold sm:text-[28px]">{tk(p.price)}</span>
          {p.oldPrice && <span className="text-base text-mute line-through">{tk(p.oldPrice)}</span>}
          {save > 0 && <span className="rounded-sm bg-tan/12 px-2 py-1 text-[11px] font-semibold text-tan">Save {tk(save)}</span>}
        </div>
        <p className="text-sm leading-relaxed text-mute">A slim {p.category.toLowerCase().replace(/s$/, '')} with 12 card slots, 2 note compartments, a zip coin pocket and a hidden SIM/ID sleeve — cut from vegetable-tanned full-grain leather that darkens beautifully with use.</p>
        <p className={cx('flex items-center gap-2 text-[13px] font-medium', soldOut ? 'text-rust' : 'text-leaf')}>
          <span className={cx('size-2 rounded-full', soldOut ? 'bg-rust' : 'bg-leaf')} />
          {soldOut ? 'Out of stock — get notified when it is back' : 'In stock — only 7 left · Ships in 24h'}
        </p>
      </div>

      {/* Colour */}
      <div className="space-y-3">
        <p className="text-[13px]">Colour: <b>{colour}</b></p>
        <div className="flex gap-3">
          {COLOURS.map((c) => (
            <button key={c.name} onClick={() => setColour(c.name)} aria-label={c.name} title={c.name} style={{ backgroundColor: c.hex }}
              className={cx('size-9 rounded-full ring-offset-[3px] ring-offset-cream transition', colour === c.name ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-mute')} />
          ))}
        </div>
      </div>

      {/* Engraving */}
      <div className="space-y-3 rounded bg-sand p-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" checked={engrave} onChange={(e) => setEngrave(e.target.checked)} className="size-4 accent-ink" />
          Add free name engraving <span className="font-normal text-mute">(+1 day)</span>
        </label>
        {engrave && <input className="input" maxLength={12} placeholder="Initials or name (max 12)" />}
      </div>

      {/* Actions (desktop/tablet — mobile uses the sticky bar) */}
      <div className="space-y-3 max-sm:hidden">
        <div className="flex gap-3">
          <Qty value={1} />
          <Button className="flex-1" disabled={soldOut}>Add to cart — {tk(p.price)}</Button>
        </div>
        <Button to="/checkout" variant="tan" className="w-full">Buy now · Cash on delivery</Button>
      </div>
      <a href="https://wa.me/8801000000000" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-leaf hover:underline">
        <MessageCircle className="size-4" /> Questions? Order on WhatsApp <ArrowRight className="size-3.5" />
      </a>

      {/* Delivery table */}
      <dl className="divide-y divide-line rounded border border-line bg-white text-[13px]">
        {DELIVERY.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="font-medium">{k}</dt><dd className="text-mute">{v}</dd></div>
        ))}
      </dl>

      {/* Info accordions */}
      <div>
        <Accordion title="Details & Dimensions" defaultOpen>
          <ul className="space-y-1.5">
            <li>Size: 19 × 9.5 × 2 cm · Weight: 140 g</li>
            <li>12 card slots · 2 note sections · Zip coin pocket</li>
            <li>RFID-blocking lining · YKK zipper · Gift box included</li>
          </ul>
        </Accordion>
        <Accordion title="Leather & Care">
          Vegetable-tanned full-grain cow leather from Bangladeshi tanneries. Wipe with a dry cloth, condition every 3–4 months and keep away from direct heat. A natural patina develops over time — that's the leather getting better, not worse.
        </Accordion>
        <Accordion title="Shipping & Returns">
          Inside Dhaka delivery in 1–2 days (৳60), outside Dhaka in 2–4 days (৳120) via Steadfast or Pathao — free on orders over ৳2,000. Not happy? Exchange or return within 7 days. Engraved items can be exchanged for manufacturing faults only.
        </Accordion>
        <Accordion title={`Reviews (${p.reviews})`}>
          <p className="flex items-center gap-2"><Stars /> <b className="text-ink">4.9 out of 5</b> · 98% would recommend</p>
          <a href="#reviews" className="mt-2 inline-block font-semibold text-tan underline underline-offset-4">Read all reviews</a>
        </Accordion>
      </div>
    </div>
  )
}

/* ---------- Reviews ---------- */
function RatingSummary({ count }) {
  const max = BREAKDOWN[0][1]
  return (
    <div className="rounded-lg bg-white p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="font-display text-[56px] font-semibold leading-none">4.9</span>
        <div><Stars className="text-sm" /><p className="text-xs text-mute">Based on {count} reviews</p></div>
      </div>
      <div className="mt-5 space-y-2">
        {BREAKDOWN.map(([star, n]) => (
          <div key={star} className="flex items-center gap-3 text-xs">
            <span className="w-7 shrink-0">{star} ★</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-tan" style={{ width: `${Math.max(3, (n / max) * 100)}%` }} /></span>
            <span className="w-7 shrink-0 text-right text-mute">{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewCard({ r }) {
  return (
    <article className="space-y-3 rounded-lg border border-line bg-white p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-tan">{initials(r.name)}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{r.name}</p>
          <p className="flex items-center gap-1 text-[11px] text-mute">{r.city} · <Check className="size-3 text-leaf" /> Verified buyer</p>
        </div>
        <span className="text-[11px] text-mute">{r.when}</span>
      </header>
      <p className="flex items-center gap-2"><Stars n={r.rating} /><span className="text-xs text-mute">{r.variant}</span></p>
      <p className="text-sm leading-relaxed">{r.text}</p>
      {r.photos.length > 0 && (
        <div className="flex gap-2">{r.photos.map((src) => <img key={src} src={src} alt="Customer photo" loading="lazy" className="size-16 rounded object-cover" />)}</div>
      )}
      {r.reply && (
        <div className="rounded bg-sand px-4 py-3 text-xs">
          <p className="font-semibold text-tan">XERQO replied</p>
          <p className="mt-0.5 text-mute">{r.reply}</p>
        </div>
      )}
      <footer className="flex gap-4 text-xs text-mute">
        <button className="flex items-center gap-1 hover:text-ink"><ThumbsUp className="size-3.5" /> Helpful ({r.helpful})</button>
        <button className="hover:text-ink">Report</button>
      </footer>
    </article>
  )
}

function Reviews({ p }) {
  const [filter, setFilter] = useState('All')
  return (
    <section id="reviews" className="container-x scroll-mt-28 space-y-6 py-12 sm:space-y-8 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">{p.reviews} verified reviews</p>
          <h2 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">Customer reviews</h2>
        </div>
        <Button to="/account/review/XQ-23102" variant="outline" size="sm" className="max-sm:hidden sm:!px-5 sm:!py-3">Write a review</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-10">
        <RatingSummary count={p.reviews} />
        <div className="min-w-0 space-y-4">
          <p className="text-[13px] font-semibold">Photos from customers</p>
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {CUSTOMER_PHOTOS.map((src) => <img key={src} src={src} alt="Customer photo" loading="lazy" className="size-[72px] shrink-0 rounded object-cover sm:size-[104px]" />)}
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {['All', 'With photos (48)', '5 ★', '4 ★', 'Most recent'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cx('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition', filter === f ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-5">
        {REVIEWS.map((r) => <ReviewCard key={r.name} r={r} />)}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button variant="outline" className="max-sm:w-full">Load more reviews</Button>
        <Button to="/account/review/XQ-23102" variant="tan" className="sm:!hidden">Write a review</Button>
      </div>
    </section>
  )
}

/* ---------- Related products ---------- */
function Related({ p }) {
  // "Complete the set" picks — a curated cross-category list from the API later
  const items = [products[15], products[11], products[30], products[31], products[0]].filter((x) => x.id !== p.id).slice(0, 4)
  return (
    <section className="bg-sand py-12 sm:py-16">
      <div className="container-x space-y-5 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Complete the set</p>
            <h2 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">You may also like</h2>
          </div>
          <Link to="/shop" className="flex items-center gap-1 text-[13px] font-semibold underline underline-offset-4">View all <ArrowRight className="size-3.5" /></Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:gap-5 sm:px-0 lg:grid lg:grid-cols-4">
          {items.map((x) => <CatProductCard key={x.id} p={x} />)}
        </div>
      </div>
    </section>
  )
}

/* Mobile sticky add-to-cart bar — sits on top of the 70px bottom nav */
function StickyBar({ p }) {
  return (
    <div className="fixed inset-x-0 bottom-[70px] z-30 flex items-center gap-2 border-t border-line bg-white px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
      <Qty value={1} small />
      <Button size="sm" className="flex-1 !py-3" disabled={p.stock === 0}>Add to cart</Button>
      <Button to="/checkout" variant="tan" size="sm" className="flex-1 !py-3">Buy now</Button>
    </div>
  )
}

export default function Product() {
  const { slug } = useParams()
  const p = findProduct(slug)
  return (
    <div className="pb-16 sm:pb-0">
      <div className="container-x pt-4 sm:pt-6">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: p.category, to: '/shop' }, { label: p.name }]} />
      </div>
      <section className="container-x grid grid-cols-[minmax(0,1fr)] gap-6 pt-4 sm:gap-10 sm:pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start"><Gallery p={p} /></div>
        <BuyBox p={p} />
      </section>
      <Reviews p={p} />
      <Related p={p} />
      <StickyBar p={p} />
    </div>
  )
}
