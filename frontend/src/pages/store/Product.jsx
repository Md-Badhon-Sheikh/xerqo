import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronLeft, ChevronRight, GitCompareArrows, Heart, ImagePlus, Maximize2, MessageCircle, PackageX, Phone, Play, Timer, X } from 'lucide-react'
import { useWishlist } from '../../context/WishlistContext'
import { tk } from '../../data/store'
import { cartLine } from '../../lib/product'
import { waLink } from '../../lib/bd'
import { api } from '../../lib/api'
import { alertSuccess, toast } from '../../lib/alert'
import { useAuth } from '../../context/AuthContext'
import Select2 from '../../components/common/Select2'
import LoginModal from '../../components/store/LoginModal'
import { useProduct, useProductReviews, useSettings } from '../../lib/queries'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import { useToast } from '../../context/ToastContext'
import { useUI } from '../../context/StoreUIContext'
import { Button, Checkbox, Field, Stars, Qty, CatProductCard, EmptyState, Bone, cx } from '../../components/store/ui'
import { Carousel, BP } from '../../components/store/Carousel'
import Lightbox from '../../components/store/Lightbox'
import { ErrorState, Spinner } from '../../components/common/feedback'

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('')
const ago = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
// Live "Days · Hours · Min · Sec" boxes for a flash sale
function Countdown({ endsAt }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000))
  const parts = [['Days', Math.floor(s / 86400)], ['Hours', Math.floor(s / 3600) % 24], ['Min', Math.floor(s / 60) % 60], ['Sec', s % 60]]
  return (
    <div className="flex gap-2" role="timer" aria-label="Time left in this offer">
      {parts.map(([label, n]) => (
        <span key={label} className="grid w-12 place-items-center rounded bg-espresso py-1.5 text-white sm:w-14">
          <b className="text-base tabular-nums leading-tight sm:text-lg">{String(n).padStart(2, '0')}</b>
          <span className="text-[9px] uppercase tracking-wider text-white/60 sm:text-[10px]">{label}</span>
        </span>
      ))}
    </div>
  )
}

/* ---------- Gallery ---------- */
// photos first, then the product video (if any) as the last slide
function Gallery({ p, images, video, active, setActive }) {
  const total = images.length + (video ? 1 : 0)
  const showVideo = video && active >= images.length
  const mediaCls = 'aspect-square w-full'
  const [viewer, setViewer] = useState(false)
  const items = [...images.map((src) => ({ src })), ...(video ? [{ src: video, video: true }] : [])]
  return (
    <div className="flex flex-col gap-3 sm:mx-auto sm:max-w-[560px] sm:gap-4 lg:mx-0 lg:max-w-[600px] lg:flex-row-reverse">
      <div className="group relative flex-1 overflow-hidden bg-tile max-sm:-mx-4 sm:rounded-lg">
        {showVideo
          ? <video key={video} src={video} controls autoPlay muted playsInline preload="metadata" className={cx(mediaCls, 'bg-black object-contain')} />
          : <button type="button" onClick={() => setViewer(true)} aria-label="View larger photo" className="block w-full cursor-zoom-in"><img src={images[active]} alt={p.name} className={cx(mediaCls, 'object-cover')} /></button>}
        {p.discount_percent > 0 && !showVideo && <span className="absolute left-3 top-3 rounded-sm bg-tan px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:left-5 sm:top-5 sm:text-[11px]">-{p.discount_percent}% {p.flash_sale ? p.flash_sale.title : 'off'}</span>}
        {total > 1 && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold sm:hidden">{Math.min(active, total - 1) + 1} / {total}</span>}
        {total > 1 && <>
          <button type="button" onClick={() => setActive((i) => (Math.min(i, total - 1) - 1 + total) % total)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm transition hover:bg-white sm:left-3 sm:size-10"><ChevronLeft className="size-5" /></button>
          <button type="button" onClick={() => setActive((i) => (Math.min(i, total - 1) + 1) % total)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink shadow-sm transition hover:bg-white sm:right-3 sm:size-10"><ChevronRight className="size-5" /></button>
        </>}
        {!showVideo && <button type="button" onClick={() => setViewer(true)} className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium shadow-sm sm:flex"><Maximize2 className="size-3.5" /> Zoom</button>}
      </div>
      {total > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-visible">
          {images.map((src, i) => (
            <button key={src + i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === active} className={cx('aspect-square w-[68px] shrink-0 overflow-hidden rounded bg-tile transition sm:w-20 lg:w-full', i === active ? 'ring-2 ring-tan ring-offset-2 ring-offset-cream' : 'opacity-75 hover:opacity-100')}>
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
          {video && (
            <button onClick={() => setActive(images.length)} aria-label="Play video" aria-current={!!showVideo} className={cx('relative aspect-square w-[68px] shrink-0 overflow-hidden rounded bg-black transition sm:w-20 lg:w-full', showVideo ? 'ring-2 ring-tan ring-offset-2 ring-offset-cream' : 'opacity-75 hover:opacity-100')}>
              {/* #t=0.1 makes phones show the first frame instead of a black box */}
              <video src={`${video}#t=0.1`} muted playsInline preload="metadata" className="pointer-events-none size-full object-cover" />
              <span className="absolute inset-0 grid place-items-center"><span className="grid size-7 place-items-center rounded-full bg-white/90 text-ink shadow"><Play className="ml-0.5 size-3.5 fill-current" /></span></span>
            </button>
          )}
        </div>
      )}
      {viewer && items.length > 0 && <Lightbox items={items} index={Math.min(active, items.length - 1)} onIndex={setActive} onClose={() => setViewer(false)} alt={p.name} />}
    </div>
  )
}

/* ---------- Buy box ---------- */
function BuyBox({ p, buy, settings, openTab }) {
  const { variant, setVariant, qty, setQty, engrave, setEngrave, engraving, setEngraving, stock, price, add, buyNow } = buy
  const compare = useCompare()
  const wish = useWishlist()
  const toast = useToast()
  const engravingCfg = settings?.engraving
  const canEngrave = p.is_engravable && engravingCfg?.enabled !== false
  const soldOut = stock <= 0
  const save = p.compare_price > price ? p.compare_price - price : 0
  const savePct = save > 0 ? Math.round((save / p.compare_price) * 100) : 0
  const store = settings?.store ?? {}
  const whatsapp = waLink(store.whatsapp)
  const phone = (store.phone || '').replace(/[^\d+]/g, '')
  const toggleCompare = () => {
    if (!compare.toggle(p)) toast.error('You can compare up to 4 products. Remove one first.')
    else if (!compare.has(p.slug)) toast.success('Added to compare.')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="eyebrow">{[p.category?.name?.replace(/s$/, ''), p.brand?.name].filter(Boolean).join(' · ')}</p>
          {p.reviews_count > 0 && <button type="button" onClick={() => openTab('reviews')}><Stars n={p.rating} count={`${p.rating} · ${p.reviews_count}`} className="text-[11px]" /></button>}
        </div>
        <h1 className="h-display text-[32px] sm:text-[42px] lg:text-[44px]">{p.name}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-2xl font-bold text-tan sm:text-[28px]">{tk(price)}</span>
          {save > 0 && <span className="text-base text-mute line-through">{tk(p.compare_price)}</span>}
          {savePct > 0 && <span className="rounded-full bg-rust px-2.5 py-1 text-[11px] font-bold text-white">{savePct}% OFF</span>}
          {save > 0 && <span className="w-full text-[12px] text-leaf">You save {tk(save)}</span>}
        </div>
        {p.flash_sale && (
          <div className="flex flex-col gap-2.5 rounded border border-rust/30 bg-rust/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-rust"><Timer className="size-4" />{p.flash_sale.title} ends in</p>
            <Countdown endsAt={p.flash_sale.ends_at} />
          </div>
        )}
        <p className={cx('flex items-center gap-2 text-[13px] font-medium', soldOut ? 'text-rust' : 'text-leaf')}>
          <span className={cx('size-2 rounded-full', soldOut ? 'bg-rust' : 'bg-leaf')} />
          {soldOut ? (variant ? `${variant.name} is out of stock — try another colour` : 'Out of stock') : stock <= 5 ? `In stock — only ${stock} left` : 'In stock · Ships in 24h'}
        </p>
      </div>

      {/* Colour */}
      {p.variants?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[13px]">Colour: <b>{variant?.name ?? <span className="font-normal text-rust">Please choose</span>}</b></p>
          <div className="flex flex-wrap gap-3">
            {p.variants.map((v) => (
              <button key={v.id} onClick={() => setVariant(v)} aria-label={`${v.name}${v.in_stock ? '' : ' (out of stock)'}`} title={v.in_stock ? v.name : `${v.name} — out of stock`} aria-pressed={variant?.id === v.id}
                style={{ backgroundColor: v.color_hex || '#ccc' }}
                className={cx('relative size-9 rounded-full ring-offset-[3px] ring-offset-cream transition', variant?.id === v.id ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-mute', !v.in_stock && 'opacity-40')}>
                {!v.in_stock && <span className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-white" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Engraving */}
      {canEngrave && (
        <div className="space-y-3 rounded bg-sand p-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" checked={engrave} onChange={(e) => setEngrave(e.target.checked)} className="size-4 accent-ink" />
            Add {engravingCfg?.fee > 0 ? '' : 'free '}name engraving <span className="font-normal text-mute">({engravingCfg?.fee > 0 ? `+${tk(engravingCfg.fee)}, ` : ''}+1 day)</span>
          </label>
          {engrave && <input className="input" value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={engravingCfg?.max_length || 30} placeholder={`Initials or name (max ${engravingCfg?.max_length || 30})`} aria-label="Engraving text" />}
        </div>
      )}

      {/* Quantity + total, then the two main actions side by side */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold">Quantity</span>
            <Qty value={qty} onChange={setQty} max={stock} />
          </div>
          <p className="text-right text-[13px] text-mute">Total <b className="block text-lg text-ink sm:inline sm:pl-1.5">{tk(price * qty)}</b></p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <Button variant="outline" disabled={soldOut} onClick={add}>Add to cart</Button>
          <Button variant="tan" disabled={soldOut} onClick={buyNow}>Buy now</Button>
        </div>
        {(whatsapp || phone) && (
          <div className={cx('grid gap-2.5 sm:gap-3', whatsapp && phone && 'grid-cols-2')}>
            {whatsapp && (
              <a href={`${whatsapp}?text=${encodeURIComponent(`Hi! I'd like to order: ${p.name}${variant ? ` (${variant.name})` : ''} × ${qty}`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-lg bg-leaf px-3 py-3 text-[13px] font-semibold text-white transition hover:opacity-90">
                <MessageCircle className="size-4" /> Order on WhatsApp
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 rounded-lg border border-ink px-3 py-3 text-[13px] font-semibold transition hover:bg-ink hover:text-white">
                <Phone className="size-4" /> Call for order
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <button type="button" onClick={() => wish?.toggle(p)} aria-pressed={!!wish?.has(p.id)} className={cx('flex items-center gap-1.5 text-[13px] font-semibold hover:underline', wish?.has(p.id) ? 'text-rust' : 'text-ink')}>
          <Heart className={cx('size-4', wish?.has(p.id) && 'fill-rust')} /> {wish?.has(p.id) ? 'Saved' : 'Save'}
        </button>
        <button onClick={toggleCompare} className={cx('flex items-center gap-1.5 text-[13px] font-semibold hover:underline', compare.has(p.slug) ? 'text-tan' : 'text-ink')}>
          <GitCompareArrows className="size-4" /> {compare.has(p.slug) ? 'Added to compare' : 'Compare'}
        </button>
      </div>


    </div>
  )
}

/* ---------- Details tabs (full width under the product) ---------- */
function DetailTabs({ p, settings, tab, setTab }) {
  const delivery = settings?.delivery
  const tabs = [['description', 'Description'], ['reviews', `Reviews (${p.reviews_count ?? 0})`], ['shipping', 'Shipping & Returns']]
  return (
    <section id="details" className="container-x scroll-mt-28 pt-10 sm:pt-14">
      <div role="tablist" className="no-scrollbar flex gap-6 overflow-x-auto border-b border-line sm:gap-10">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx('-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition sm:text-[15px]', tab === k ? 'border-tan text-ink' : 'border-transparent text-mute hover:text-ink')}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="py-6 sm:py-8">
        {tab === 'description' && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
            <p className="whitespace-pre-line text-sm leading-relaxed text-mute sm:text-[15px]">{p.description || 'No description yet.'}</p>
            <div className="h-fit space-y-2 rounded-lg bg-sand p-5 text-[13px] leading-relaxed text-mute sm:text-sm">
              <p className="font-semibold text-ink">Leather &amp; care</p>
              <p>Genuine leather from Bangladeshi tanneries. Wipe with a dry cloth, condition every 3–4 months and keep away from direct heat. A natural patina develops over time — that's the leather getting better, not worse.</p>
            </div>
          </div>
        )}
        {tab === 'reviews' && <Reviews p={p} />}
        {tab === 'shipping' && (
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-mute sm:text-[15px]">
            {delivery && <p>Inside Dhaka delivery in {delivery.inside_dhaka_eta} ({tk(delivery.inside_dhaka)}), outside Dhaka in {delivery.outside_dhaka_eta} ({tk(delivery.outside_dhaka)}){delivery.free_delivery_threshold > 0 && <> — free on orders over {tk(delivery.free_delivery_threshold)}</>}. Cash on delivery all over Bangladesh.</p>}
            {settings?.returns?.policy && <p className="whitespace-pre-line">{settings.returns.policy}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- Reviews ---------- */
// Average, how many recommend it (4★ and 5★) and a bar per star level
function RatingSummary({ summary }) {
  const count = summary?.count ?? 0
  return (
    <div className="grid gap-6 rounded-lg bg-white p-5 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-10 sm:p-7">
      <div className="space-y-1.5 text-center sm:border-r sm:border-line sm:pr-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Average rating</p>
        <p className="font-display text-[56px] font-semibold leading-none">{summary?.average != null ? Number(summary.average).toFixed(1) : '0.0'}</p>
        <Stars n={summary?.average || 0} className="text-sm" />
        <p className="text-xs text-mute">({count} {count === 1 ? 'review' : 'reviews'})</p>
        {count > 0 && <p className="text-[13px] font-semibold text-leaf">{summary.recommended_percent}% recommend it <span className="font-normal text-mute">({summary.recommended} of {count})</span></p>}
      </div>
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary?.breakdown?.[star] ?? 0
          const pct = count ? Math.round((n / count) * 100) : 0
          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-8 shrink-0 font-medium">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-tan transition-all" style={{ width: `${pct}%` }} /></span>
              <span className="w-16 shrink-0 text-right text-mute">{pct}% <span className="text-[10px]">({n})</span></span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewCard({ r }) {
  const name = r.author?.name || 'XERQO customer'
  return (
    <article className="space-y-3 rounded-lg border border-line bg-white p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-tan">{initials(name)}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{name}</p>
          {r.verified && <p className="flex items-center gap-1 text-[11px] text-mute"><Check className="size-3 text-leaf" /> Verified buyer</p>}
        </div>
        <span className="text-[11px] text-mute">{ago(r.created_at)}</span>
      </header>
      <Stars n={r.rating} />
      {r.title && <p className="text-sm font-semibold">{r.title}</p>}
      {r.body && <p className="whitespace-pre-line text-sm leading-relaxed">{r.body}</p>}
      {r.tags?.length > 0 && <div className="flex flex-wrap gap-1.5">{r.tags.map((t) => <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-[11px]">{t}</span>)}</div>}
      {r.photos?.length > 0 && (
        <div className="flex gap-2">{r.photos.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="Customer photo" loading="lazy" className="size-16 rounded object-cover" /></a>)}</div>
      )}
      {r.reply && (
        <div className="rounded bg-sand p-3.5">
          <p className="text-xs font-semibold text-tan">XERQO replied</p>
          <p className="mt-0.5 text-[13px] text-mute">{r.reply}</p>
        </div>
      )}
    </article>
  )
}

const RATING_OPTIONS = [
  { value: '5', label: '★★★★★  Excellent' },
  { value: '4', label: '★★★★  Good' },
  { value: '3', label: '★★★  Average' },
  { value: '2', label: '★★  Below average' },
  { value: '1', label: '★  Poor' },
]
const MAX_PHOTOS = 3
const BLANK_REVIEW = { rating: '', body: '', anonymous: false }

// "Submit your review" — open to everyone; posting asks guests to sign in (phone code or Google) first
function ReviewForm({ p }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const status = useQuery({
    queryKey: ['product', p.slug, 'review-status', user?.id],
    queryFn: () => api.get(`/products/${p.slug}/review-status`).then((r) => r.data),
    enabled: !!user,
  })
  const [f, setF] = useState(BLANK_REVIEW)
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [askLogin, setAskLogin] = useState(false)
  const [pending, setPending] = useState(false) // submit as soon as the sign-in finishes
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos])
  useEffect(() => () => previews.forEach((x) => URL.revokeObjectURL(x.url)), [previews])

  const addPhotos = (files) => {
    const ok = Array.from(files || []).filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type))
    if (ok.some((file) => file.size > 4 * 1024 * 1024)) toast.error('Each photo can be at most 4 MB.')
    setPhotos((list) => [...list, ...ok.filter((file) => file.size <= 4 * 1024 * 1024)].slice(0, MAX_PHOTOS))
  }

  const send = async () => {
    const body = new FormData()
    body.append('product_id', p.id)
    body.append('rating', f.rating)
    body.append('body', f.body.trim())
    body.append('is_anonymous', f.anonymous ? '1' : '0')
    photos.forEach((file, i) => body.append(`photos[${i}]`, file))
    setBusy(true)
    try {
      const res = await api.post('/reviews', body)
      setF(BLANK_REVIEW)
      setPhotos([])
      qc.invalidateQueries({ queryKey: ['product', p.slug] })
      alertSuccess('Thank you!', res?.message)
    } catch (err) {
      const fields = err.fields ?? {}
      setErrors({ ...fields, photos: fields.photos || fields['photos.0'] })
      if (fields.product_id) qc.invalidateQueries({ queryKey: ['product', p.slug, 'review-status'] })
      if (!Object.keys(fields).length || fields.product_id) toast.error(fields.product_id || err.message)
    } finally {
      setBusy(false)
    }
  }

  // signed in from the popup: post the review that was waiting
  useEffect(() => {
    if (pending && user) { setPending(false); setAskLogin(false); send() }
  }, [pending, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!f.rating) errs.rating = 'Choose a rating.'
    if (!f.body.trim()) errs.body = 'Write a few words about the product.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (!user) { setPending(true); setAskLogin(true); return }
    send()
  }

  const reviewed = user && status.data?.can_review === false
  return (
    <div className="space-y-4 rounded-lg border border-line bg-white p-5 sm:p-7">
      <h3 className="h-display text-2xl sm:text-[28px]">Submit your review</h3>
      {reviewed ? (
        <p className="text-sm text-mute">Thanks — you've already reviewed this product. You can see it in <Link to="/account/reviews" className="font-semibold text-tan underline underline-offset-2">My reviews</Link>.</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-xs text-mute">
            {user ? (status.data?.verified ? 'You bought this — your review will show as a verified buyer. ' : '') : 'You’ll be asked to log in with your mobile number or Google when you submit. '}
            Your phone number and email are never shown. Required fields are marked *
          </p>
          <Field label="Your rating *" error={errors.rating} className="sm:max-w-xs">
            <Select2 variant="store" options={RATING_OPTIONS} value={f.rating} onChange={(rating) => setF((x) => ({ ...x, rating }))} placeholder="Select a rating" search={false} invalid={!!errors.rating} />
          </Field>
          <Field label="Your review *" error={errors.body}>
            <textarea rows={5} value={f.body} onChange={(e) => setF((x) => ({ ...x, body: e.target.value }))} maxLength={3000} placeholder="What did you like? How do the leather, stitching and finish feel?" className={cx('input resize-y', errors.body && 'border-rust')} />
          </Field>
          <div className="space-y-2">
            <p className="text-[13px] font-semibold">Photos <span className="font-normal text-mute">(optional · up to {MAX_PHOTOS})</span></p>
            <div className="flex flex-wrap gap-2.5">
              {previews.map((x, i) => (
                <div key={x.url} className="relative size-20 overflow-hidden rounded border border-line">
                  <img src={x.url} alt="" className="size-full object-cover" />
                  <button type="button" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-white shadow"><X className="size-3" /></button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label
                  onDragOver={(e) => { e.preventDefault(); setOver(true) }}
                  onDragLeave={() => setOver(false)}
                  onDrop={(e) => { e.preventDefault(); setOver(false); addPhotos(e.dataTransfer.files) }}
                  className={cx('flex min-h-20 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed px-4 py-3 text-center text-xs text-mute transition sm:min-w-64', over ? 'border-tan bg-tan/5' : 'border-line hover:border-tan')}
                >
                  <ImagePlus className="size-5 text-tan" />
                  <span><b className="text-ink">Drop photos here</b> or click to choose</span>
                  <span className="text-[11px]">JPG, PNG or WebP · max 4 MB each</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                </label>
              )}
            </div>
            {errors.photos && <p className="text-xs text-rust">{errors.photos}</p>}
          </div>
          <Checkbox label="Post without my name" checked={f.anonymous} onChange={(e) => setF((x) => ({ ...x, anonymous: e.target.checked }))} />
          <Button disabled={busy} className="max-sm:w-full">{busy && <Spinner className="size-4 text-current" />}Submit review</Button>
        </form>
      )}
      <LoginModal
        open={askLogin}
        onClose={() => { setAskLogin(false); setPending(false) }}
        onDone={() => setAskLogin(false)}
        title="Log in to post your review"
        text="Your review is saved here — it posts as soon as you’re signed in."
      />
    </div>
  )
}

function Reviews({ p }) {
  const [perPage, setPerPage] = useState(6)
  const { data, isPending, isFetching } = useProductReviews(p.slug, perPage)
  const summary = data?.summary
  const reviews = data?.data ?? []
  if (isPending) return <Bone className="h-40" />
  return (
    <div className="space-y-6 sm:space-y-8">
      <RatingSummary summary={summary} />
      {reviews.length > 0 ? (
        <>
          <div className="grid items-start gap-4 md:grid-cols-2 lg:gap-5">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
          {data.meta && data.meta.total > reviews.length && (
            <Button variant="outline" className="max-sm:w-full" disabled={isFetching} onClick={() => setPerPage((n) => n + 6)}>{isFetching ? 'Loading…' : 'Load more reviews'}</Button>
          )}
        </>
      ) : (
        <p className="rounded-lg bg-white px-6 py-8 text-center text-sm text-mute">No reviews yet — be the first to share your thoughts.</p>
      )}
      <ReviewForm p={p} />
    </div>
  )
}

/* ---------- Related products ---------- */
function Related({ items, category }) {
  if (!items?.length) return null
  return (
    <section className="bg-sand py-12 sm:py-16">
      <div className="container-x space-y-5 sm:space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow">Complete the set</p>
            <h2 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">You may also like</h2>
          </div>
          <Link to={category ? `/shop?c=${category.slug}` : '/shop'} className="flex items-center gap-1 text-[13px] font-semibold underline underline-offset-4">View all <ArrowRight className="size-3.5" /></Link>
        </div>
        <Carousel label="Related products" breakpoints={BP.products} delay={4500} arrowTop="top-[calc(50%-16px)]">
          {items.map((x) => <CatProductCard key={x.id} p={x} className="h-full" />)}
        </Carousel>
      </div>
    </section>
  )
}

/* Mobile sticky add-to-cart bar — sits on top of the 70px bottom nav */
function StickyBar({ buy }) {
  const soldOut = buy.stock <= 0
  return (
    <div className="fixed inset-x-0 bottom-[70px] z-30 flex items-center gap-2 border-t border-line bg-white px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden">
      <Qty value={buy.qty} onChange={buy.setQty} max={buy.stock} small />
      <Button size="sm" className="flex-1 !py-3" disabled={soldOut} onClick={buy.add}>Add to cart</Button>
      <Button variant="tan" size="sm" className="flex-1 !py-3" disabled={soldOut} onClick={buy.buyNow}>Buy now</Button>
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-x grid gap-6 pt-10 sm:gap-10 lg:grid-cols-2 lg:gap-12">
      <Bone className="aspect-square w-full sm:mx-auto sm:max-w-[560px]" />
      <div className="space-y-4"><Bone className="h-4 w-40" /><Bone className="h-12 w-4/5" /><Bone className="h-8 w-48" /><Bone className="h-20" /><Bone className="h-11" /><Bone className="h-11" /></div>
    </div>
  )
}

// Selection state shared by the buy box and the mobile sticky bar
function useBuyState(p) {
  const cart = useCart()
  const ui = useUI()
  const toast = useToast()
  const navigate = useNavigate()
  const [variant, setVariantState] = useState(null)
  const [qty, setQty] = useState(1)
  const [engrave, setEngrave] = useState(false)
  const [engraving, setEngraving] = useState('')

  // new product loaded: preselect the first colour in stock and reset the form
  const [forId, setForId] = useState(null)
  if (p && p.id !== forId) {
    setForId(p.id)
    setVariantState(p.variants?.find((v) => v.in_stock) ?? null)
    setQty(1); setEngrave(false); setEngraving('')
  }

  const stock = variant ? Math.min(variant.stock, p?.stock ?? 0) : p?.stock ?? 0
  const price = variant?.price ?? p?.price ?? 0
  const setVariant = (v) => { setVariantState(v); setQty((q) => Math.max(1, Math.min(q, v.stock || 1))) }

  const put = () => {
    if (p.variants?.length && !variant) { toast.error('Please choose a colour first.'); return false }
    if (engrave && !engraving.trim()) { toast.error('Enter the name or initials to engrave.'); return false }
    cart.add(cartLine(p, variant, engrave ? engraving.trim() : ''), qty)
    return true
  }
  return {
    variant, setVariant, qty, setQty, engrave, setEngrave, engraving, setEngraving, stock, price,
    add: () => { if (put()) ui?.setDrawer(true) },
    buyNow: () => { if (put()) navigate('/cart') },
  }
}

export default function Product() {
  const { slug } = useParams()
  const { data, isPending, error, refetch } = useProduct(slug)
  const { data: settings } = useSettings()
  const p = data?.data
  const buy = useBuyState(p)
  const [active, setActive] = useState(0)
  const [tab, setTab] = useState('description')
  const [tabFor, setTabFor] = useState(slug)
  if (tabFor !== slug) { setTabFor(slug); setTab('description') }
  const openTab = (k) => {
    setTab(k)
    requestAnimationFrame(() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const images = useMemo(() => {
    const list = p?.images?.map((i) => i.url) ?? []
    return list.length ? list : p?.image ? [p.image] : []
  }, [p])
  // show the chosen colour's photo when it has one
  const gallery = buy.variant?.image && !images.includes(buy.variant.image) ? [buy.variant.image, ...images] : images
  // jump to the chosen colour's photo (or back to the first image for a new product)
  const shownKey = `${p?.id}:${buy.variant?.id}`
  const [galleryFor, setGalleryFor] = useState(shownKey)
  if (galleryFor !== shownKey) {
    setGalleryFor(shownKey)
    setActive(buy.variant?.image ? Math.max(0, gallery.indexOf(buy.variant.image)) : 0)
  }

  useEffect(() => {
    if (p) document.title = p.meta_title || `${p.name} | XERQO`
    return () => { document.title = 'XERQO' }
  }, [p])

  if (isPending) return <ProductSkeleton />
  if (error?.status === 404) {
    return <div className="container-x py-16"><EmptyState icon={PackageX} title="Product not found" text="This product may have been removed or is no longer available." action={<Button to="/shop" variant="outlineTan" size="sm">Browse all products</Button>} /></div>
  }
  if (error) return <div className="container-x py-16"><ErrorState error={error} onRetry={refetch} /></div>

  return (
    <div className="pb-16 sm:pb-0">
      <section className="container-x grid grid-cols-[minmax(0,1fr)] gap-6 pt-4 sm:gap-10 sm:pt-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start"><Gallery p={p} images={gallery} video={p.video} active={Math.min(active, gallery.length - (p.video ? 0 : 1))} setActive={setActive} /></div>
        <BuyBox p={p} buy={buy} settings={settings} openTab={openTab} />
      </section>
      <DetailTabs p={p} settings={settings} tab={tab} setTab={setTab} />
      <Related items={data.related} category={p.category} />
      <StickyBar buy={buy} />
    </div>
  )
}
