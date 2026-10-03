import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, GitCompareArrows, Heart, Maximize2, MessageCircle, Minus, PackageX, Plus, Timer } from 'lucide-react'
import { useWishlist } from '../../context/WishlistContext'
import { tk } from '../../data/store'
import { cartLine } from '../../lib/product'
import { useProduct, useProductReviews, useSettings } from '../../lib/queries'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import { useToast } from '../../context/ToastContext'
import { useUI } from '../../context/StoreUIContext'
import { Breadcrumb, Button, Stars, Qty, CatProductCard, EmptyState, Bone, cx } from '../../components/store/ui'
import { Carousel, BP } from '../../components/store/Carousel'
import { ErrorState } from '../../components/common/feedback'

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('')
const ago = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const timeLeft = (iso) => {
  const s = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000))
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

/* ---------- Gallery ---------- */
function Gallery({ p, images, active, setActive }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row-reverse">
      <div className="relative flex-1 overflow-hidden bg-tile max-sm:-mx-4 sm:rounded-lg">
        <img src={images[active]} alt={p.name} className="aspect-square w-full object-cover sm:aspect-[4/3] lg:aspect-[10/11]" />
        {p.discount_percent > 0 && <span className="absolute left-3 top-3 rounded-sm bg-tan px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:left-5 sm:top-5 sm:text-[11px]">-{p.discount_percent}% {p.flash_sale ? p.flash_sale.title : 'off'}</span>}
        {images.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold sm:hidden">{active + 1} / {images.length}</span>}
        <a href={images[active]} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 hidden items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium shadow-sm sm:flex"><Maximize2 className="size-3.5" /> Zoom</a>
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-visible">
          {images.map((src, i) => (
            <button key={src + i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === active} className={cx('aspect-square w-[68px] shrink-0 overflow-hidden rounded bg-tile transition sm:w-20 lg:w-full', i === active ? 'ring-2 ring-tan ring-offset-2 ring-offset-cream' : 'opacity-75 hover:opacity-100')}>
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Buy box ---------- */
function Accordion({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="border-b border-line">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold sm:py-5">
        {title}{open ? <Minus className="size-4" /> : <Plus className="size-4" />}
      </button>
      {open && <div className="pb-5 text-[13px] leading-relaxed text-mute sm:text-sm">{children}</div>}
    </div>
  )
}

function BuyBox({ p, buy, settings }) {
  const { variant, setVariant, qty, setQty, engrave, setEngrave, engraving, setEngraving, stock, price, add, buyNow } = buy
  const compare = useCompare()
  const wish = useWishlist()
  const toast = useToast()
  const delivery = settings?.delivery
  const engravingCfg = settings?.engraving
  const canEngrave = p.is_engravable && engravingCfg?.enabled !== false
  const soldOut = stock <= 0
  const save = p.compare_price > price ? p.compare_price - price : 0
  const whatsapp = (settings?.store?.whatsapp || '').replace(/\D/g, '')
  const toggleCompare = () => {
    if (!compare.toggle(p)) toast.error('You can compare up to 4 products. Remove one first.')
    else if (!compare.has(p.slug)) toast.success('Added to compare.')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="eyebrow">{[p.category?.name?.replace(/s$/, ''), p.brand?.name].filter(Boolean).join(' · ')}</p>
          {p.reviews_count > 0 && <a href="#reviews"><Stars n={p.rating} count={`${p.rating} · ${p.reviews_count}`} className="text-[11px]" /></a>}
        </div>
        <h1 className="h-display text-[32px] sm:text-[42px] lg:text-[44px]">{p.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold sm:text-[28px]">{tk(price)}</span>
          {p.compare_price > price && <span className="text-base text-mute line-through">{tk(p.compare_price)}</span>}
          {save > 0 && <span className="rounded-sm bg-tan/12 px-2 py-1 text-[11px] font-semibold text-tan">Save {tk(save)}</span>}
        </div>
        {p.flash_sale && (
          <p className="flex items-center gap-2 text-[13px] font-semibold text-rust"><Timer className="size-4" />{p.flash_sale.title} — ends in {timeLeft(p.flash_sale.ends_at)}</p>
        )}
        {p.description && <p className="line-clamp-3 text-sm leading-relaxed text-mute">{p.description}</p>}
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

      {/* Actions (desktop/tablet — mobile uses the sticky bar) */}
      <div className="space-y-3 max-sm:hidden">
        <div className="flex gap-3">
          <Qty value={qty} onChange={setQty} max={stock} />
          <Button className="flex-1" disabled={soldOut} onClick={add}>Add to cart — {tk(price * qty)}</Button>
        </div>
        <Button variant="tan" className="w-full" disabled={soldOut} onClick={buyNow}>Buy now · Cash on delivery</Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <button type="button" onClick={() => wish?.toggle(p)} aria-pressed={!!wish?.has(p.id)} className={cx('flex items-center gap-1.5 text-[13px] font-semibold hover:underline', wish?.has(p.id) ? 'text-rust' : 'text-ink')}>
          <Heart className={cx('size-4', wish?.has(p.id) && 'fill-rust')} /> {wish?.has(p.id) ? 'Saved' : 'Save'}
        </button>
        <button onClick={toggleCompare} className={cx('flex items-center gap-1.5 text-[13px] font-semibold hover:underline', compare.has(p.slug) ? 'text-tan' : 'text-ink')}>
          <GitCompareArrows className="size-4" /> {compare.has(p.slug) ? 'Added to compare' : 'Compare'}
        </button>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi! I'd like to order: ${p.name}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] font-semibold text-leaf hover:underline">
            <MessageCircle className="size-4" /> Order on WhatsApp <ArrowRight className="size-3.5" />
          </a>
        )}
      </div>

      {/* Delivery table */}
      {delivery && (
        <dl className="divide-y divide-line rounded border border-line bg-white text-[13px]">
          {[
            ['Inside Dhaka', `${delivery.inside_dhaka_eta} · ${tk(delivery.inside_dhaka)}`],
            ['Outside Dhaka', `${delivery.outside_dhaka_eta} · ${tk(delivery.outside_dhaka)}`],
            ['Free delivery', `Orders over ${tk(delivery.free_delivery_threshold)}`],
            ['Easy return', `${settings?.returns?.window_days ?? 7} days · free exchange`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="font-medium">{k}</dt><dd className="text-mute">{v}</dd></div>
          ))}
        </dl>
      )}

      {/* Info accordions */}
      <div>
        {p.description && <Accordion title="Description" defaultOpen><p className="whitespace-pre-line">{p.description}</p></Accordion>}
        <Accordion title="Leather & Care">
          Genuine leather from Bangladeshi tanneries. Wipe with a dry cloth, condition every 3–4 months and keep away from direct heat. A natural patina develops over time — that's the leather getting better, not worse.
        </Accordion>
        {delivery && (
          <Accordion title="Shipping & Returns">
            Inside Dhaka delivery in {delivery.inside_dhaka_eta} ({tk(delivery.inside_dhaka)}), outside Dhaka in {delivery.outside_dhaka_eta} ({tk(delivery.outside_dhaka)}) — free on orders over {tk(delivery.free_delivery_threshold)}. {settings?.returns?.policy}
          </Accordion>
        )}
      </div>
    </div>
  )
}

/* ---------- Reviews ---------- */
function RatingSummary({ summary }) {
  const max = Math.max(1, ...Object.values(summary.breakdown || {}))
  return (
    <div className="rounded-lg bg-white p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="font-display text-[56px] font-semibold leading-none">{summary.average ?? '–'}</span>
        <div><Stars n={summary.average || 0} className="text-sm" /><p className="text-xs text-mute">Based on {summary.count} {summary.count === 1 ? 'review' : 'reviews'}</p></div>
      </div>
      <div className="mt-5 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary.breakdown?.[star] ?? 0
          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-7 shrink-0">{star} ★</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-tan" style={{ width: `${n ? Math.max(3, (n / max) * 100) : 0}%` }} /></span>
              <span className="w-7 shrink-0 text-right text-mute">{n}</span>
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
          <p className="flex items-center gap-1 text-[11px] text-mute"><Check className="size-3 text-leaf" /> Verified buyer</p>
        </div>
        <span className="text-[11px] text-mute">{ago(r.created_at)}</span>
      </header>
      <Stars n={r.rating} />
      {r.title && <p className="text-sm font-semibold">{r.title}</p>}
      {r.body && <p className="text-sm leading-relaxed">{r.body}</p>}
      {r.photos?.length > 0 && (
        <div className="flex gap-2">{r.photos.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="Customer photo" loading="lazy" className="size-16 rounded object-cover" /></a>)}</div>
      )}
    </article>
  )
}

function Reviews({ slug }) {
  const [perPage, setPerPage] = useState(6)
  const { data, isPending, isFetching } = useProductReviews(slug, perPage)
  const summary = data?.summary
  const reviews = data?.data ?? []
  const photos = reviews.flatMap((r) => r.photos || []).slice(0, 8)
  if (isPending) return <section id="reviews" className="container-x py-12"><Bone className="h-40" /></section>
  return (
    <section id="reviews" className="container-x scroll-mt-28 space-y-6 py-12 sm:space-y-8 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">{summary?.count ? `${summary.count} verified ${summary.count === 1 ? 'review' : 'reviews'}` : 'Reviews'}</p>
          <h2 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">Customer reviews</h2>
        </div>
        <Button to="/account" variant="outline" size="sm" className="max-sm:hidden sm:!px-5 sm:!py-3">Write a review</Button>
      </div>

      {!summary?.count ? (
        <p className="rounded-lg bg-white px-6 py-10 text-center text-sm text-mute">No reviews yet. Bought this piece? Review it from your <Link to="/account" className="font-semibold text-tan underline underline-offset-2">orders</Link> after delivery.</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:gap-10">
            <RatingSummary summary={summary} />
            {photos.length > 0 && (
              <div className="min-w-0 space-y-4">
                <p className="text-[13px] font-semibold">Photos from customers</p>
                <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  {photos.map((src) => <img key={src} src={src} alt="Customer photo" loading="lazy" className="size-[72px] shrink-0 rounded object-cover sm:size-[104px]" />)}
                </div>
              </div>
            )}
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-5">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
          {data.meta && data.meta.total > reviews.length && (
            <Button variant="outline" className="max-sm:w-full" disabled={isFetching} onClick={() => setPerPage((n) => n + 6)}>{isFetching ? 'Loading…' : 'Load more reviews'}</Button>
          )}
        </>
      )}
    </section>
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
    <div className="container-x grid gap-6 pt-10 sm:gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
      <Bone className="aspect-square sm:aspect-[4/3] lg:aspect-[10/11]" />
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
      <div className="container-x pt-4 sm:pt-6">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, ...(p.category ? [{ label: p.category.name, to: `/shop?c=${p.category.slug}` }] : []), { label: p.name }]} />
      </div>
      <section className="container-x grid grid-cols-[minmax(0,1fr)] gap-6 pt-4 sm:gap-10 sm:pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start"><Gallery p={p} images={gallery} active={Math.min(active, gallery.length - 1)} setActive={setActive} /></div>
        <BuyBox p={p} buy={buy} settings={settings} />
      </section>
      <Reviews slug={slug} />
      <Related items={data.related} category={p.category} />
      <StickyBar buy={buy} />
    </div>
  )
}
