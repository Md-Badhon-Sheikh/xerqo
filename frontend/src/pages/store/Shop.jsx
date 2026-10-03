import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, GitCompareArrows, LayoutGrid, List, Minus, PackageSearch, Plus, SlidersHorizontal, X } from 'lucide-react'
import { tk } from '../../data/store'
import { api } from '../../lib/api'
import { normalizeProduct } from '../../lib/product'
import { useCategories } from '../../lib/queries'
import { useCompare } from '../../context/CompareContext'
import { useQuickAdd } from '../../context/StoreUIContext'
import { useToast } from '../../context/ToastContext'
import { Breadcrumb, Button, ProductCard, ProductCardSkeleton, Price, Stars, Pill, HeartBtn, EmptyState, cx } from '../../components/store/ui'
import { ErrorState } from '../../components/common/feedback'
import Select2 from '../../components/common/Select2'

const PER_PAGE = 12
const SORTS = [['featured', 'Featured'], ['popular', 'Best selling'], ['newest', 'Newest'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated']]
const DEFAULT_SUB = 'Genuine leather wallets, bags and travel goods — hand-stitched in Dhaka.'

/* ---------- URL <-> filter state ---------- */
function useFilters() {
  const [sp, setSp] = useSearchParams()
  const f = {
    c: sp.get('c') || '',
    brand: (sp.get('brand') || '').split(',').filter(Boolean),
    color: sp.get('color') || '',
    min: sp.get('min') || '',
    max: sp.get('max') || '',
    stock: sp.get('stock') === '1',
    sale: sp.get('sale') === '1',
    engravable: sp.get('engravable') === '1',
    sort: sp.get('sort') || 'featured',
    page: Math.max(1, Number(sp.get('page')) || 1),
  }
  // patch: { key: value | null }; any filter change returns to page 1
  const set = (patch) => setSp((prev) => {
    const next = new URLSearchParams(prev)
    for (const [k, v] of Object.entries(patch)) {
      const val = Array.isArray(v) ? v.join(',') : v === true ? '1' : v
      if (val === null || val === '' || val === false || val === undefined) next.delete(k)
      else next.set(k, String(val))
    }
    if (!('page' in patch)) next.delete('page')
    next.delete('filters')
    return next
  }, { replace: false })
  const clear = () => setSp(() => { const next = new URLSearchParams(); if (f.c) next.set('c', f.c); if (f.sort !== 'featured') next.set('sort', f.sort); return next })
  return [f, set, clear]
}

const useIsMobile = () => {
  const query = '(max-width: 639px)'
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mobile
}

/* ---------- Filter building blocks ---------- */
function FilterGroup({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-5 first:pt-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink" aria-expanded={open}>
        {title}
        {open ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

function CheckRow({ label, count, checked, onChange, radio }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink">
      <input type={radio ? 'radio' : 'checkbox'} checked={checked} onChange={onChange} className="size-4 rounded-sm accent-ink" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-mute">({count})</span>}
    </label>
  )
}

function PriceRange({ f, set, facets }) {
  const lo = facets?.price?.min ?? 0
  const hi = facets?.price?.max ?? 0
  // remounted (via key) whenever the URL range changes, so local inputs start from it
  const [min, setMin] = useState(f.min)
  const [max, setMax] = useState(f.max)
  const apply = () => set({ min: min || null, max: max || null })
  const span = Math.max(1, hi - lo)
  const left = f.min ? Math.min(100, Math.max(0, ((f.min - lo) / span) * 100)) : 0
  const right = f.max ? Math.min(100, Math.max(0, ((hi - f.max) / span) * 100)) : 0
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); apply() }}>
      <div className="relative mx-2 h-2" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
        <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink" style={{ left: `${left}%`, right: `${right}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input !py-2.5" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} onBlur={apply} placeholder={lo ? `৳${lo}` : 'Min'} aria-label="Minimum price" />
        <input className="input !py-2.5" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} onBlur={apply} placeholder={hi ? `৳${hi}` : 'Max'} aria-label="Maximum price" />
      </div>
      <button type="submit" className="sr-only">Apply price</button>
    </form>
  )
}

function Filters({ f, set, facets, categories, compact }) {
  const top = categories.find((c) => c.slug === f.c || c.children?.some((k) => k.slug === f.c))
  return (
    <div>
      <FilterGroup title="Category">
        <div className="space-y-1">
          <CheckRow radio label="All products" checked={!f.c} onChange={() => set({ c: null, brand: null, color: null })} />
          {categories.map((c) => (
            <div key={c.slug}>
              <CheckRow radio label={c.name} count={c.products_count} checked={f.c === c.slug} onChange={() => set({ c: c.slug, brand: null, color: null })} />
              {top?.slug === c.slug && c.children?.length > 0 && (
                <div className="ml-6 border-l border-line pl-3">
                  {c.children.map((k) => <CheckRow key={k.slug} radio label={k.name} count={k.products_count} checked={f.c === k.slug} onChange={() => set({ c: k.slug, brand: null, color: null })} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Price"><PriceRange key={`${f.min}|${f.max}`} f={f} set={set} facets={facets} /></FilterGroup>
      {facets?.colors?.length > 0 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => set({ color: f.color === c.name ? null : c.name })}
                title={`${c.name} (${c.count})`}
                aria-label={c.name}
                aria-pressed={f.color === c.name}
                style={{ backgroundColor: c.hex || '#ccc' }}
                className={cx('size-7 rounded-full ring-offset-2 ring-offset-cream transition', f.color === c.name ? 'ring-2 ring-tan' : 'ring-1 ring-line')}
              />
            ))}
          </div>
          {f.color && <p className="mt-2 text-xs text-mute">Showing: <b className="text-ink">{f.color}</b></p>}
        </FilterGroup>
      )}
      {facets?.brands?.length > 1 && (
        <FilterGroup title="Brand" defaultOpen={!compact}>
          <div className="space-y-1">
            {facets.brands.map((b) => (
              <CheckRow key={b.slug} label={b.name} count={b.count} checked={f.brand.includes(b.slug)}
                onChange={() => set({ brand: f.brand.includes(b.slug) ? f.brand.filter((x) => x !== b.slug) : [...f.brand, b.slug] })} />
            ))}
          </div>
        </FilterGroup>
      )}
      <FilterGroup title="Availability" defaultOpen={!compact}>
        <div className="space-y-1">
          <CheckRow label="In stock only" checked={f.stock} onChange={() => set({ stock: !f.stock })} />
          <CheckRow label="On sale" checked={f.sale} onChange={() => set({ sale: !f.sale })} />
          <CheckRow label="Free name engraving" checked={f.engravable} onChange={() => set({ engravable: !f.engravable })} />
        </div>
      </FilterGroup>
    </div>
  )
}

/* Mobile / tablet bottom sheet */
function FilterSheet({ open, onClose, resultCount, onClear, ...props }) {
  return (
    <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
      <div onClick={onClose} className={cx('absolute inset-0 bg-black/45 transition', open ? 'opacity-100' : 'opacity-0')} />
      <div role="dialog" aria-label="Filters" className={cx('absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-cream transition-transform duration-300 sm:mx-auto sm:max-w-xl', open ? 'translate-y-0' : 'translate-y-full')}>
        <span className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between px-4 pb-4 pt-3 sm:px-6">
          <h2 className="h-display text-[28px]">Filters</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClear} className="text-[13px] font-semibold text-tan underline underline-offset-4">Clear all</button>
            <button onClick={onClose} aria-label="Close filters"><X className="size-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-1 sm:px-6"><Filters {...props} compact /></div>
        <div className="grid grid-cols-2 gap-2.5 border-t border-line bg-cream p-4 sm:px-6">
          <Button variant="outline" size="lg" className="bg-white" onClick={onClear}>Reset</Button>
          <Button size="lg" onClick={onClose}>Show {resultCount ?? ''} results</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Toolbar & listing ---------- */
function SortSelect({ value, onChange, className }) {
  return (
    <Select2 variant="store" search={false} aria-label="Sort products" className={className} value={value} onChange={onChange}
      options={SORTS.map(([v, l]) => ({ value: v, label: `Sort: ${l}` }))} />
  )
}

function ActiveChip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs">
      {children}<button onClick={onRemove} aria-label={`Remove filter ${children}`}><X className="size-3 text-mute hover:text-ink" /></button>
    </span>
  )
}

function ListCard({ p }) {
  const q = normalizeProduct(p)
  const quickAdd = useQuickAdd()
  const compare = useCompare()
  const toast = useToast()
  const sold = !q.inStock
  const toggleCompare = () => { if (!compare.toggle(q)) toast.error('You can compare up to 4 products.') }
  return (
    <article className="flex gap-4 rounded-lg bg-white p-3 sm:gap-6 sm:p-4">
      <Link to={`/product/${q.slug}`} className="relative block aspect-square w-28 shrink-0 overflow-hidden rounded bg-tile sm:w-44">
        <img src={q.image} alt={q.name} loading="lazy" className={cx('size-full object-cover', sold && 'opacity-60')} />
        {q.discount > 0 && <Pill className="absolute left-2 top-2">-{q.discount}%</Pill>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">{[q.category, q.brandName].filter(Boolean).join(' · ')}</p>
        <Link to={`/product/${q.slug}`} className="font-display text-lg font-semibold leading-tight hover:text-tan sm:text-2xl">{q.name}</Link>
        {q.reviews > 0 && <Stars n={q.rating} count={q.reviews} className="text-[11px]" />}
        <Price p={q} />
        {q.description && <p className="line-clamp-2 hidden max-w-xl text-[13px] text-mute sm:block">{q.description}</p>}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button variant={sold ? 'soft' : 'outlineTan'} size="sm" className="sm:px-6" disabled={sold} onClick={() => quickAdd(q)}>{sold ? 'Sold out' : q.hasVariants ? 'Choose colour' : 'Add to cart'}</Button>
          <HeartBtn p={p} className="!shadow-none ring-1 ring-line" />
          <button onClick={toggleCompare} aria-pressed={compare.has(q.slug)} title="Compare" className={cx('grid size-8 place-items-center rounded-full ring-1 transition sm:size-9', compare.has(q.slug) ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:ring-ink')}>
            <GitCompareArrows className="size-4" /><span className="sr-only">Compare</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// 1 … 4 5 [6] 7 8 … 20
function pageList(current, last) {
  const pages = new Set([1, last, current - 1, current, current + 1].filter((n) => n >= 1 && n <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ['…', n] : [n]))
}

function Pagination({ current, last, onPage }) {
  if (last <= 1) return null
  const cell = 'grid size-9 place-items-center rounded border text-[13px] font-medium transition disabled:opacity-40'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button aria-label="Previous page" disabled={current <= 1} onClick={() => onPage(current - 1)} className={cx(cell, 'border-line bg-white hover:border-ink')}><ChevronLeft className="size-4" /></button>
      {pageList(current, last).map((n, i) => n === '…'
        ? <span key={`e${i}`} className="px-1 text-mute">…</span>
        : <button key={n} onClick={() => onPage(n)} aria-current={n === current ? 'page' : undefined} className={cx(cell, n === current ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{n}</button>)}
      <button aria-label="Next page" disabled={current >= last} onClick={() => onPage(current + 1)} className={cx(cell, 'border-line bg-white hover:border-ink')}><ChevronRight className="size-4" /></button>
    </nav>
  )
}

export default function Shop() {
  const [f, set, clear] = useFilters()
  const [params] = useSearchParams()
  const [sheet, setSheet] = useState(params.get('filters') === '1') // ?filters=1 opens the sheet (design index link)
  const [view, setView] = useState('grid')
  const isMobile = useIsMobile()
  const { data: categories = [] } = useCategories()

  const base = {
    category: f.c, brand: f.brand, color: f.color, min_price: f.min, max_price: f.max,
    in_stock: f.stock ? 1 : '', on_sale: f.sale ? 1 : '', engravable: f.engravable ? 1 : '',
    sort: f.sort, per_page: PER_PAGE, with_facets: 1,
  }
  // Mobile "Load more" shows pages 1…n stacked; tablet/desktop show one page at a time
  const pages = isMobile ? Array.from({ length: f.page }, (_, i) => i + 1) : [f.page]
  const results = useQueries({
    queries: pages.map((page) => ({
      queryKey: ['products', { ...base, page }],
      queryFn: ({ signal }) => api.get('/products', { ...base, page }, { signal }),
      placeholderData: keepPreviousData,
    })),
  })
  const first = results[0]
  const last = results[results.length - 1]
  const meta = last.data?.meta
  const facets = first.data?.facets
  const items = results.flatMap((r) => r.data?.data ?? [])
  const total = meta?.total
  const loading = first.isPending
  const error = results.find((r) => r.error)?.error

  // header: current category (or its parent) and the chips under the title
  const all = categories.flatMap((c) => [c, ...(c.children || [])])
  const cat = all.find((c) => c.slug === f.c)
  const parent = cat?.parent_id ? categories.find((c) => c.id === cat.parent_id) : null
  const chipSource = (parent || cat)?.children?.length ? (parent || cat).children : categories.filter((c) => c.slug !== f.c)
  const home = parent || cat
  const chips = [{ slug: home?.slug ?? '', name: home ? `All ${home.name}` : 'All Products', active: !parent }, ...chipSource.slice(0, 8).map((c) => ({ ...c, active: c.slug === f.c }))]

  const brandName = (slug) => facets?.brands?.find((b) => b.slug === slug)?.name || slug
  const activeChips = [
    ...f.brand.map((b) => [brandName(b), () => set({ brand: f.brand.filter((x) => x !== b) })]),
    ...(f.color ? [[f.color, () => set({ color: null })]] : []),
    ...(f.min || f.max ? [[`${f.min ? tk(f.min) : '৳0'} – ${f.max ? tk(f.max) : 'any'}`, () => set({ min: null, max: null })]] : []),
    ...(f.stock ? [['In stock', () => set({ stock: null })]] : []),
    ...(f.sale ? [['On sale', () => set({ sale: null })]] : []),
    ...(f.engravable ? [['Engravable', () => set({ engravable: null })]] : []),
  ]
  const filterProps = { f, set, facets, categories }

  return (
    <>
      {/* Page header */}
      <section className="bg-sand">
        <div className="container-x space-y-2 py-6 sm:space-y-3 sm:py-10">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...(parent ? [{ label: parent.name, to: `/shop?c=${parent.slug}` }] : []), ...(cat ? [{ label: cat.name }] : [])]} />
          <h1 className="h-display text-[34px] sm:text-[44px] lg:text-[52px]">{cat ? cat.name : 'Shop All'}</h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-mute sm:text-[15px]">{cat?.description || DEFAULT_SUB}</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {chips.map((c) => (
              <Link
                key={c.name}
                to={c.slug ? `/shop?c=${c.slug}` : '/shop'}
                className={cx('shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition', c.active ? 'border-ink bg-ink text-white' : 'border-white bg-white hover:border-ink')}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-5 sm:py-8 lg:grid-cols-[240px_1fr] lg:py-10 xl:gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block"><Filters {...filterProps} /></aside>

        <div className="min-w-0 space-y-5 sm:space-y-7">
          {/* Toolbar */}
          <div className="flex items-stretch gap-2 sm:items-center sm:gap-4">
            <button onClick={() => setSheet(true)} className="flex flex-1 items-center justify-center gap-2 rounded border border-line bg-white py-2.5 text-[13px] font-medium sm:flex-none sm:px-4 lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters{activeChips.length > 0 && ` (${activeChips.length})`}
            </button>
            <div className="hidden flex-1 flex-wrap items-center gap-2 text-[13px] text-mute sm:flex sm:justify-center lg:justify-start">
              <span>{total == null ? 'Loading…' : `Showing ${total} ${total === 1 ? 'product' : 'products'}`}</span>
              {activeChips.length > 0 && (
                <span className="hidden flex-wrap items-center gap-2 lg:flex">
                  {activeChips.map(([label, remove]) => <ActiveChip key={label} onRemove={remove}>{label}</ActiveChip>)}
                  <button onClick={clear} className="text-xs font-semibold text-tan underline underline-offset-2">Clear all</button>
                </span>
              )}
            </div>
            <SortSelect value={f.sort} onChange={(sort) => set({ sort: sort === 'featured' ? null : sort })} className="flex-1 sm:w-52 sm:flex-none" />
            <div className="hidden overflow-hidden rounded border border-line bg-white sm:flex">
              {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} aria-pressed={view === v} className={cx('grid size-10 place-items-center transition', view === v ? 'bg-ink text-white' : 'text-mute hover:text-ink')}>
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          {error && !items.length ? (
            <ErrorState error={error} onRetry={() => results.forEach((r) => r.refetch())} />
          ) : loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No products match" text="Try removing a filter or browse all products." action={<Button variant="outlineTan" size="sm" onClick={clear}>Clear filters</Button>} />
          ) : view === 'grid' ? (
            <div className={cx('grid grid-cols-2 gap-x-3 gap-y-7 transition-opacity sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 2xl:grid-cols-4', last.isPlaceholderData && 'opacity-60')}>
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className={cx('space-y-3 transition-opacity sm:space-y-4', last.isPlaceholderData && 'opacity-60')}>{items.map((p) => <ListCard key={p.id} p={p} />)}</div>
          )}

          {/* Pagination (tablet+) / load more (mobile) */}
          {meta && (
            <>
              <div className="pt-2 max-sm:hidden"><Pagination current={meta.current_page} last={meta.last_page} onPage={(page) => { set({ page: page > 1 ? page : null }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} /></div>
              {items.length > 0 && (
                <div className="space-y-3 pt-1 text-center sm:hidden">
                  {meta.current_page < meta.last_page && (
                    <Button variant="outline" size="lg" className="w-full" disabled={last.isFetching} onClick={() => set({ page: f.page + 1 })}>
                      {last.isFetching ? 'Loading…' : 'Load more products'}
                    </Button>
                  )}
                  <p className="text-xs text-mute">Showing {items.length} of {total}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <FilterSheet open={sheet} onClose={() => setSheet(false)} onClear={clear} resultCount={total} {...filterProps} />
    </>
  )
}
