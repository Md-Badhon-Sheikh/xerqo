import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, Minus, Plus, SlidersHorizontal, X } from 'lucide-react'
import { products, categories, byCategory, discount } from '../../data/store'
import { Breadcrumb, Button, ProductCard, Price, Stars, Pill, HeartBtn, cx } from '../../components/store/ui'

/* ---------- Static filter options (will come from the API's facets later) ---------- */
const COLOURS = [
  { name: 'Black', hex: '#231A15' },
  { name: 'Cognac', hex: '#8B4A22' },
  { name: 'Brown', hex: '#5C3A21' },
  { name: 'Tan', hex: '#B9874E' },
  { name: 'Burgundy', hex: '#6E2427' },
  { name: 'Navy', hex: '#2B3550' },
]
const LEATHER = [['Full-grain', 41], ['Top-grain', 19], ['Crazy Horse', 12]]
const AUDIENCE = [['Men', 44], ['Women', 26], ['Unisex', 18]]
const AVAILABILITY = [['In stock', 36], ['Out of stock', 4]]
const SORTS = ['Best selling', 'Newest', 'Price: low to high', 'Price: high to low', 'Top rated']
const SUBS = {
  default: 'Genuine leather wallets, bags and travel goods — hand-stitched in Dhaka.',
  wallets: 'Slim bifolds, card holders and long wallets in full-grain leather. Free engraving on every wallet.',
}

/* ---------- Filter building blocks ---------- */
function FilterGroup({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-5 first:pt-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink">
        {title}
        {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

function CheckRow({ label, count, defaultChecked }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink">
      <input type="checkbox" defaultChecked={defaultChecked} className="size-4 rounded-sm accent-ink" />
      {label}
      {count != null && <span className="text-mute">({count})</span>}
    </label>
  )
}

function PriceRange() {
  return (
    <div className="space-y-4">
      <div className="relative mx-2 h-5">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
        <span className="absolute left-[12%] right-[22%] top-1/2 h-0.5 -translate-y-1/2 bg-ink" />
        <span className="absolute left-[12%] top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white" />
        <span className="absolute right-[22%] top-1/2 size-4 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input !py-2.5" defaultValue="৳500" aria-label="Minimum price" />
        <input className="input !py-2.5" defaultValue="৳3,500" aria-label="Maximum price" />
      </div>
    </div>
  )
}

function Swatches() {
  const [active, setActive] = useState('Cognac')
  return (
    <div className="flex flex-wrap gap-2.5">
      {COLOURS.map((c) => (
        <button
          key={c.name}
          onClick={() => setActive(c.name)}
          title={c.name}
          aria-label={c.name}
          style={{ backgroundColor: c.hex }}
          className={cx('size-7 rounded-full ring-offset-2 ring-offset-cream transition', active === c.name ? 'ring-2 ring-tan' : 'ring-1 ring-line')}
        />
      ))}
    </div>
  )
}

function Filters({ activeSlug, compact }) {
  return (
    <div>
      <FilterGroup title="Category">
        <div className="space-y-1">
          {categories.map((c) => <CheckRow key={c.slug} label={c.name} count={c.count} defaultChecked={c.slug === activeSlug} />)}
        </div>
      </FilterGroup>
      <FilterGroup title="Price"><PriceRange /></FilterGroup>
      <FilterGroup title="Colour"><Swatches /></FilterGroup>
      <FilterGroup title="Leather type" defaultOpen={!compact}>
        <div className="space-y-1">{LEATHER.map(([l, n]) => <CheckRow key={l} label={l} count={n} />)}</div>
      </FilterGroup>
      <FilterGroup title="For" defaultOpen={!compact}>
        <div className="space-y-1">{AUDIENCE.map(([l, n]) => <CheckRow key={l} label={l} count={n} />)}</div>
      </FilterGroup>
      <FilterGroup title="Availability" defaultOpen={!compact}>
        <div className="space-y-1">{AVAILABILITY.map(([l, n], i) => <CheckRow key={l} label={l} count={n} defaultChecked={i === 0} />)}</div>
      </FilterGroup>
    </div>
  )
}

/* Mobile / tablet bottom sheet (Figma 02b) */
function FilterSheet({ open, onClose, activeSlug, resultCount }) {
  return (
    <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
      <div onClick={onClose} className={cx('absolute inset-0 bg-black/45 transition', open ? 'opacity-100' : 'opacity-0')} />
      <div className={cx('absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-cream transition-transform duration-300 sm:mx-auto sm:max-w-xl', open ? 'translate-y-0' : 'translate-y-full')}>
        <span className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between px-4 pb-4 pt-3 sm:px-6">
          <h2 className="h-display text-[28px]">Filters</h2>
          <div className="flex items-center gap-4">
            <button className="text-[13px] font-semibold text-tan underline underline-offset-4">Clear all</button>
            <button onClick={onClose} aria-label="Close filters"><X className="size-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-1 sm:px-6"><Filters activeSlug={activeSlug} compact /></div>
        <div className="grid grid-cols-2 gap-2.5 border-t border-line bg-cream p-4 sm:px-6">
          <Button variant="outline" size="lg" className="bg-white">Reset</Button>
          <Button size="lg" onClick={onClose}>Show {resultCount} results</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Toolbar & listing ---------- */
function SortSelect({ className }) {
  return (
    <label className={cx('relative flex items-center', className)}>
      <span className="sr-only">Sort products</span>
      <select className="h-full w-full appearance-none rounded border border-line bg-white py-2.5 pl-3.5 pr-9 text-[13px] text-ink outline-none focus:border-ink">
        {SORTS.map((s) => <option key={s}>Sort: {s}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-mute" />
    </label>
  )
}

function ActiveChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs">
      {children}<button aria-label={`Remove ${children}`}><X className="size-3 text-mute" /></button>
    </span>
  )
}

function ListCard({ p }) {
  const off = discount(p)
  return (
    <article className="flex gap-4 rounded-lg bg-white p-3 sm:gap-6 sm:p-4">
      <Link to={`/product/${p.slug}`} className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded bg-tile sm:w-44">
        <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" />
        {off > 0 && <Pill className="absolute left-2 top-2">-{off}%</Pill>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">{p.category}</p>
        <Link to={`/product/${p.slug}`} className="font-display text-lg font-semibold leading-tight hover:text-tan sm:text-2xl">{p.name}</Link>
        <Stars count={p.reviews} className="text-[11px]" />
        <Price p={p} />
        <p className="hidden max-w-xl text-[13px] text-mute sm:block">Full-grain leather, hand-stitched with waxed thread and finished with burnished edges. Free name engraving.</p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button variant={p.stock === 0 ? 'soft' : 'outlineTan'} size="sm" className="sm:px-6">{p.stock === 0 ? 'Notify me' : 'Add to cart'}</Button>
          <HeartBtn className="!shadow-none ring-1 ring-line" />
        </div>
      </div>
    </article>
  )
}

function Pagination() {
  const cell = 'grid size-9 place-items-center rounded border text-[13px] font-medium transition'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button aria-label="Previous page" className={cx(cell, 'border-line bg-white text-mute')}><ChevronLeft className="size-4" /></button>
      {['1', '2', '3', '…', '8'].map((n, i) => (
        <button key={i} className={cx(cell, n === '1' ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{n}</button>
      ))}
      <button aria-label="Next page" className={cx(cell, 'border-line bg-white hover:border-ink')}><ChevronRight className="size-4" /></button>
    </nav>
  )
}

export default function Shop() {
  const [params] = useSearchParams()
  const slug = params.get('c')
  const cat = categories.find((c) => c.slug === slug)
  // Category items first, then related pieces to fill page 1 (the API will paginate properly)
  const items = (cat ? [...byCategory(cat.name), ...products.filter((p) => p.category !== cat.name)] : products).slice(0, 12)
  const total = cat ? cat.count : 40
  const [sheet, setSheet] = useState(params.get('filters') === '1') // ?filters=1 opens the sheet (design index link)
  const [view, setView] = useState('grid')

  const title = cat ? (cat.slug === 'wallets' ? 'Leather Wallets' : cat.name) : 'Shop All'
  const chips = [{ slug: null, name: cat ? `All ${cat.name}` : 'All Products' }, ...categories.filter((c) => c.slug !== slug).slice(0, 5)]

  return (
    <>
      {/* Page header */}
      <section className="bg-sand">
        <div className="container-x space-y-2 py-6 sm:space-y-3 sm:py-10">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(cat ? [{ label: cat.name }] : [])]} />
          <h1 className="h-display text-[34px] sm:text-[44px] lg:text-[52px]">{title}</h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-mute sm:text-[15px]">{SUBS[slug] || SUBS.default}</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {chips.map((c, i) => (
              <Link
                key={c.name}
                to={c.slug ? `/shop?c=${c.slug}` : cat ? `/shop?c=${cat.slug}` : '/shop'}
                className={cx('shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition', i === 0 ? 'border-ink bg-ink text-white' : 'border-white bg-white hover:border-ink')}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-5 sm:py-8 lg:grid-cols-[240px_1fr] lg:py-10 xl:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <Filters activeSlug={slug} />
        </aside>

        <div className="min-w-0 space-y-5 sm:space-y-7">
          {/* Toolbar */}
          <div className="flex items-stretch gap-2 sm:items-center sm:gap-4">
            <button onClick={() => setSheet(true)} className="flex flex-1 items-center justify-center gap-2 rounded border border-line bg-white py-2.5 text-[13px] font-medium sm:flex-none sm:px-4 lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters (2)
            </button>
            <div className="hidden flex-1 flex-wrap items-center gap-2 text-[13px] text-mute sm:flex sm:justify-center lg:justify-start">
              <span>Showing {total} products</span>
              <span className="hidden items-center gap-2 lg:flex"><ActiveChip>Bifold</ActiveChip><ActiveChip>Long Wallet</ActiveChip></span>
            </div>
            <SortSelect className="flex-1 sm:w-52 sm:flex-none" />
            <div className="hidden overflow-hidden rounded border border-line bg-white sm:flex">
              {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} className={cx('grid size-10 place-items-center transition', view === v ? 'bg-ink text-white' : 'text-mute hover:text-ink')}>
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          {view === 'grid' ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 2xl:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">{items.map((p) => <ListCard key={p.id} p={p} />)}</div>
          )}

          {/* Pagination (tablet+) / load more (mobile) */}
          <div className="pt-2 max-sm:hidden"><Pagination /></div>
          <div className="space-y-3 pt-1 text-center sm:hidden">
            <Button variant="outline" size="lg" className="w-full">Load more products</Button>
            <p className="text-xs text-mute">Showing {items.length} of {total}</p>
          </div>
        </div>
      </section>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} activeSlug={slug} resultCount={18} />
    </>
  )
}
