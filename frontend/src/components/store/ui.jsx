import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, ChevronRight, Minus, Plus } from 'lucide-react'
import { tk } from '../../data/store'
import { normalizeProduct } from '../../lib/product'
import { useQuickAdd } from '../../context/StoreUIContext'

const cx = (...c) => c.filter(Boolean).join(' ')
export { cx }

/* ---------- Buttons ---------- */
const btnBase = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.08em] transition disabled:opacity-50'
const btnVariants = {
  dark: 'bg-ink text-white hover:bg-espresso',
  tan: 'bg-tan text-white hover:bg-tan-dark',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  outlineTan: 'border border-tan text-tan hover:bg-tan hover:text-white',
  soft: 'bg-sand text-ink hover:bg-line',
  white: 'bg-white text-ink border border-line hover:border-ink',
  danger: 'border border-rust text-rust hover:bg-rust hover:text-white',
}
const btnSizes = { sm: 'text-[10px] px-3 py-2 rounded', md: 'text-[11px] sm:text-xs px-5 py-3 rounded', lg: 'text-xs sm:text-[13px] px-7 py-4 rounded-sm' }

export function Button({ as, to, variant = 'dark', size = 'md', className, children, ...rest }) {
  const cls = cx(btnBase, btnVariants[variant], btnSizes[size], className)
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  const Tag = as || 'button'
  return <Tag className={cls} {...rest}>{children}</Tag>
}

/* ---------- Small atoms ---------- */
export const Stars = ({ n = 5, count, className }) => {
  const full = Math.max(0, Math.min(5, Math.round(n)))
  return (
    <span className={cx('text-amber text-xs tracking-wider', className)} aria-label={`${full} out of 5 stars`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}{count != null && <span className="ml-1 tracking-normal text-mute">({count})</span>}
    </span>
  )
}

// p: { price, oldPrice } — oldPrice (or API compare_price) is shown struck through when higher
export const Price = ({ p, size = 'md' }) => {
  const was = p.oldPrice ?? p.compare_price
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className={cx('font-bold text-tan', size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-[13px] sm:text-sm' : 'text-sm sm:text-[15px]')}>{tk(p.price)}</span>
      {was > p.price && <span className={cx('text-mute line-through', size === 'lg' ? 'text-base' : 'text-[11px] sm:text-[13px]')}>{tk(was)}</span>}
    </span>
  )
}

export const Pill = ({ children, tone = 'tan', className }) => {
  const tones = { tan: 'bg-tan text-white', dark: 'bg-ink text-white', white: 'bg-white text-ink', leaf: 'bg-leaf/12 text-leaf', soft: 'bg-sand text-ink', rust: 'bg-rust/10 text-rust', amber: 'bg-amber/12 text-amber' }
  return <span className={cx('inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em]', tones[tone], className)}>{children}</span>
}

export const StatusBadge = ({ status }) => {
  const map = { Delivered: 'bg-leaf/12 text-leaf', Processing: 'bg-amber/12 text-amber', Shipped: 'bg-[#2C5AA0]/12 text-[#2C5AA0]', Cancelled: 'bg-rust/10 text-rust', Pending: 'bg-amber/12 text-amber' }
  return <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', map[status] || 'bg-sand text-ink')}>{status}</span>
}

export const HeartBtn = ({ active, className }) => (
  <button aria-label="Add to wishlist" className={cx('grid size-8 sm:size-9 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-105', className)}>
    <Heart className={cx('size-4', active ? 'fill-rust text-rust' : 'text-ink')} strokeWidth={1.8} />
  </button>
)

export const Dots = ({ n = 4, className }) => (
  <div className={cx('flex items-center justify-center gap-1.5', className)}>
    {Array.from({ length: n }).map((_, i) => <span key={i} className={cx('h-[7px] rounded-full', i === 0 ? 'w-5 bg-tan' : 'w-[7px] bg-line')} />)}
  </div>
)

// Quantity stepper; pass onChange to make it interactive (max = available stock)
export const Qty = ({ value = 1, small, onChange, min = 1, max = 99 }) => (
  <div className={cx('inline-flex items-center rounded border border-line bg-white', small ? 'h-9' : 'h-11')}>
    <button type="button" onClick={() => onChange?.(value - 1)} disabled={value <= min} className="grid h-full w-9 place-items-center text-mute hover:text-ink disabled:opacity-40" aria-label="Decrease"><Minus className="size-3.5" /></button>
    <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{value}</span>
    <button type="button" onClick={() => onChange?.(value + 1)} disabled={max > 0 && value >= max} className="grid h-full w-9 place-items-center text-mute hover:text-ink disabled:opacity-40" aria-label="Increase"><Plus className="size-3.5" /></button>
  </div>
)

export const Field = ({ label, help, error, className, children, ...input }) => (
  <label className={cx('block space-y-1.5', className)}>
    {label && <span className="block text-[13px] font-semibold text-ink">{label}</span>}
    {children || <input className={cx('input', error && 'border-rust')} {...input} />}
    {(help || error) && <span className={cx('block text-xs', error ? 'text-rust' : 'text-mute')}>{error || help}</span>}
  </label>
)

export const Checkbox = ({ label, ...input }) => (
  <label className="flex items-center gap-2.5 text-sm text-ink">
    <input type="checkbox" className="size-4 rounded-sm accent-ink" {...input} /> {label}
  </label>
)

/* ---------- Section headings ---------- */
export const SectionHead = ({ eyebrow, title, sub, center, action, className }) => (
  <div className={cx('flex gap-4', center ? 'flex-col items-center text-center' : 'items-end justify-between', className)}>
    <div className={cx('space-y-2', center && 'flex flex-col items-center')}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">{title}</h2>
      {sub && <p className="text-[13px] sm:text-sm text-mute">{sub}</p>}
    </div>
    {action}
  </div>
)

export const Breadcrumb = ({ items, light }) => (
  <nav className={cx('flex flex-wrap items-center gap-1 text-xs sm:text-[13px]', light ? 'text-white/70' : 'text-mute')}>
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <ChevronRight className="size-3" />}
        {it.to ? <Link to={it.to} className="hover:underline">{it.label}</Link> : <span className={light ? 'text-white' : 'text-ink'}>{it.label}</span>}
      </span>
    ))}
  </nav>
)

export const PageHero = ({ crumbs, title, sub, image }) => (
  <section className={cx('relative overflow-hidden', image ? 'bg-espresso text-white' : 'bg-sand')}>
    {image && <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-30" />}
    <div className="container-x relative space-y-2 py-7 sm:space-y-3 sm:py-12">
      {crumbs && <Breadcrumb items={crumbs} light={!!image} />}
      <h1 className="h-display text-[34px] sm:text-[44px] lg:text-[56px]">{title}</h1>
      {sub && <p className={cx('max-w-2xl text-[13px] leading-relaxed sm:text-base', image ? 'text-white/80' : 'text-mute')}>{sub}</p>}
    </div>
  </section>
)

/* ---------- Product cards ---------- */
// Cards accept an API product (or legacy demo data) — normalizeProduct() gives them one shape.

const offPercent = (q) => q.discount || (q.oldPrice > q.price ? Math.round(((q.oldPrice - q.price) / q.oldPrice) * 100) : 0)

// Grid card used in Shop, Flash Sale, Wishlist, Search
export function ProductCard({ p, badge, cta = 'Add to cart', fav }) {
  const q = normalizeProduct(p)
  const quickAdd = useQuickAdd()
  const off = offPercent(q)
  const sold = !q.inStock
  const b = badge ?? (sold ? 'Out of stock' : off ? `-${off}%` : q.badge)
  return (
    <article className="group flex flex-col gap-2 sm:gap-3">
      <Link to={`/product/${q.slug}`} className="relative block aspect-[10/11] overflow-hidden rounded-lg bg-tile sm:rounded">
        <img src={q.image} alt={q.name} loading="lazy" className={cx('size-full object-cover transition duration-500 group-hover:scale-105', sold && 'opacity-60')} />
        {b && <Pill tone={sold ? 'dark' : String(b).startsWith('-') ? 'tan' : 'white'} className="absolute left-2 top-2 sm:left-3 sm:top-3">{b}</Pill>}
        <HeartBtn active={fav} className="absolute right-2 top-2 sm:right-3 sm:top-3" />
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-mute sm:block">{q.category}</p>
        <Link to={`/product/${q.slug}`} className="font-display text-base font-semibold leading-tight hover:text-tan sm:text-[21px]">{q.name}</Link>
        <Price p={q} />
        {q.reviews > 0 && <Stars n={Math.round(q.rating)} count={q.reviews} className="text-[10px] sm:text-[11px]" />}
      </div>
      <Button variant={sold ? 'soft' : 'outlineTan'} size="sm" className="w-full sm:py-3" disabled={sold} onClick={() => quickAdd(q)}>
        {sold ? 'Sold out' : q.hasVariants ? 'Choose colour' : cta}
      </Button>
    </article>
  )
}

// White card used in the per-category home sliders (urbaland style)
export function CatProductCard({ p, className = 'w-[150px] shrink-0 snap-start sm:w-[218px] lg:w-auto' }) {
  const q = normalizeProduct(p)
  const quickAdd = useQuickAdd()
  const off = offPercent(q)
  const sold = !q.inStock
  return (
    <article className={cx('flex flex-col overflow-hidden rounded-lg bg-white', className)}>
      <Link to={`/product/${q.slug}`} className="relative block aspect-square overflow-hidden bg-tile">
        <img src={q.image} alt={q.name} loading="lazy" className={cx('size-full object-cover transition duration-500 hover:scale-105', sold && 'opacity-50')} />
        <HeartBtn className="absolute left-2 top-2 !size-7 sm:left-2.5 sm:top-2.5 sm:!size-8" />
        {(sold || off > 0) && <span className={cx('absolute right-2 top-2 rounded-sm px-1.5 py-0.5 text-[9px] font-bold text-white sm:right-2.5 sm:top-2.5 sm:px-2 sm:py-1 sm:text-[11px]', sold ? 'bg-espresso' : 'bg-tan')}>{sold ? 'Sold out' : `Save ${off}%`}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3.5">
        <Link to={`/product/${q.slug}`} className="font-display text-[15px] font-semibold leading-tight hover:text-tan sm:text-lg">{q.name}</Link>
        <Price p={q} size="sm" />
        <div className="mt-auto flex gap-1.5 pt-1 sm:gap-2">
          {sold ? (
            <Button variant="danger" size="sm" className="w-full" disabled>Sold out</Button>
          ) : (
            <>
              <Button size="sm" className="flex-1 !px-1.5" onClick={() => quickAdd(q, { buyNow: true })}>Buy now</Button>
              <Button variant="outline" size="sm" className="!px-2 lg:flex-1 lg:!px-1.5" aria-label={`Add ${q.name} to cart`} onClick={() => quickAdd(q)}><ShoppingBag className="size-3.5 lg:hidden" /><span className="hidden lg:inline">Add to cart</span></Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

// Horizontal card used in "Top Selling Products"
export function TopProductCard({ p, rank }) {
  const q = normalizeProduct(p)
  const quickAdd = useQuickAdd()
  const sold = !q.inStock
  return (
    <article className="flex items-stretch overflow-hidden rounded-lg bg-cream">
      <Link to={`/product/${q.slug}`} className="relative w-[124px] shrink-0 bg-tile sm:w-[300px] lg:w-[45%]">
        <img src={q.image} alt={q.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
        <Pill className="absolute left-2 top-2 sm:left-3 sm:top-3">#{rank} Best seller</Pill>
      </Link>
      <div className="flex min-h-[168px] flex-1 flex-col justify-center gap-1.5 p-3 sm:min-h-[250px] sm:gap-2.5 sm:p-7 lg:min-h-[280px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute sm:text-[11px]">{q.category.replace(/s$/, '')}</p>
        <Link to={`/product/${q.slug}`} className="font-display text-[19px] font-semibold leading-tight hover:text-tan sm:text-[26px] lg:text-[28px]">{q.name}</Link>
        {q.reviews > 0 && <Stars n={Math.round(q.rating)} count={`${q.reviews} reviews`} className="hidden sm:inline" />}
        <div className="flex flex-wrap items-center gap-2">
          <Price p={q} size="lg" />
          {q.oldPrice > q.price && <span className="rounded-full bg-leaf/12 px-2.5 py-0.5 text-[10px] font-semibold text-leaf sm:text-[11px]">Save {tk(q.oldPrice - q.price)}</span>}
        </div>
        <div className="flex gap-2 pt-1 sm:pt-2">
          {sold ? (
            <Button variant="soft" className="flex-1 sm:flex-none" disabled>Sold out</Button>
          ) : (
            <>
              <Button variant="outline" className="max-sm:hidden" onClick={() => quickAdd(q)}><ShoppingBag className="size-4" /> {q.hasVariants ? 'Choose colour' : 'Add to cart'}</Button>
              <Button className="flex-1 sm:flex-none" onClick={() => quickAdd(q, { buyNow: true })}><ShoppingBag className="size-4 max-sm:hidden" /> Buy now</Button>
              <Button variant="outline" className="!px-3 sm:!hidden" aria-label="Add to cart" onClick={() => quickAdd(q)}><ShoppingBag className="size-4" /></Button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

/* ---------- Loading placeholders ---------- */
const Bone = ({ className }) => <span className={cx('block animate-pulse rounded bg-line/60', className)} />

export const ProductCardSkeleton = () => (
  <div className="flex flex-col gap-2 sm:gap-3" aria-hidden="true">
    <Bone className="aspect-[10/11] rounded-lg" />
    <Bone className="h-3 w-1/3" /><Bone className="h-5 w-4/5" /><Bone className="h-4 w-1/2" /><Bone className="h-9" />
  </div>
)

export const CatCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-lg bg-white" aria-hidden="true">
    <Bone className="aspect-square rounded-none" />
    <div className="space-y-2 p-3"><Bone className="h-4 w-4/5" /><Bone className="h-4 w-1/2" /><Bone className="h-8" /></div>
  </div>
)

export { Bone }

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-6 py-14 text-center sm:py-20">
    {Icon && <span className="grid size-16 place-items-center rounded-full bg-sand"><Icon className="size-7 text-tan" strokeWidth={1.5} /></span>}
    <h3 className="h-display text-2xl sm:text-3xl">{title}</h3>
    {text && <p className="max-w-md text-sm text-mute">{text}</p>}
    {action}
  </div>
)
