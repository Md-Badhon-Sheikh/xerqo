import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronDown, Search as SearchIcon, X } from 'lucide-react'
import { tk } from '../../data/store'
import { useProducts } from '../../lib/queries'
import { Button, ProductCard, ProductCardSkeleton, EmptyState, cx } from '../../components/store/ui'
import { ErrorState } from '../../components/common/feedback'

const POPULAR = ['long wallet', 'passport cover', 'card holder', 'key holder', 'purse', 'belt', 'tote bag', 'backpack']
const SORTS = [['', 'Relevance'], ['popular', 'Best selling'], ['newest', 'Newest'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low']]
const RECENT_KEY = 'xq_recent_searches'

const readRecent = () => { try { return JSON.parse(window.localStorage.getItem(RECENT_KEY)) || [] } catch { return [] } }
const saveRecent = (q) => {
  const list = [q, ...readRecent().filter((x) => x !== q)].slice(0, 5)
  try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(list)) } catch { /* storage blocked */ }
  return list
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id) }, [value, ms])
  return v
}

function Suggestions({ q, recent, onPick }) {
  const term = useDebounced(q.trim())
  const { data, isFetching } = useProducts({ q: term, per_page: 4 }, { enabled: term.length >= 2 })
  const results = term.length >= 2 ? data?.data ?? [] : []
  return (
    <div className="grid gap-6 rounded-b-lg border border-t-0 border-line bg-white p-5 shadow-[0_12px_30px_rgba(35,26,21,0.08)] sm:grid-cols-[1fr_1.4fr] sm:gap-10 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Search for</p>
          <button onClick={() => onPick(q.trim())} className="flex items-center gap-2.5 text-sm font-semibold hover:text-tan"><SearchIcon className="size-3.5 text-mute" /> “{q.trim()}”</button>
        </div>
        {recent.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Recent</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((t) => <button key={t} onClick={() => onPick(t)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] hover:border-ink">{t}</button>)}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Products</p>
        {term.length < 2 ? <p className="text-[13px] text-mute">Keep typing…</p>
          : isFetching && !results.length ? <p className="text-[13px] text-mute">Searching…</p>
            : !results.length ? <p className="text-[13px] text-mute">No products match “{term}”.</p>
              : results.map((p) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-3 hover:text-tan">
                  <img src={p.image} alt="" className="size-12 rounded object-cover" />
                  <span><b className="block text-sm font-semibold">{p.name}</b><span className="text-[13px] font-semibold text-tan">{tk(p.price)}</span></span>
                </Link>
              ))}
        {data?.meta?.total > results.length && (
          <button onClick={() => onPick(term)} className="flex items-center gap-1 text-[13px] font-semibold text-tan underline underline-offset-4">See all {data.meta.total} results <ArrowRight className="size-3.5" /></button>
        )}
      </div>
    </div>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = (params.get('q') || '').trim()
  const cat = params.get('c') || ''
  const sort = params.get('sort') || ''
  const [value, setValue] = useState(query)
  const [open, setOpen] = useState(!query)
  const [recent, setRecent] = useState(readRecent)

  // keep the box in sync when the URL query changes (back/forward, popular-search clicks)
  const [shownQuery, setShownQuery] = useState(query)
  if (shownQuery !== query) { setShownQuery(query); setValue(query) }

  // facets (category counts) for the whole search, then the (optionally category-filtered) results
  const facetsQ = useProducts({ q: query, per_page: 1, with_facets: 1 }, { enabled: !!query })
  const results = useProducts(
    query ? { q: query, category: cat, sort, per_page: 24 } : { featured: 1, per_page: 8 },
  )
  const cats = facetsQ.data?.facets?.categories ?? []
  const total = facetsQ.data?.meta?.total
  const items = results.data?.data ?? []

  const submit = (q) => {
    const term = q.trim()
    if (!term) return
    setValue(term)
    setOpen(false)
    setRecent(saveRecent(term))
    setParams({ q: term })
  }
  const setParam = (k, v) => setParams((prev) => { const n = new URLSearchParams(prev); if (v) n.set(k, v); else n.delete(k); return n })

  return (
    <>
      {/* Search box + live suggestions */}
      <section className="border-b border-line bg-white">
        <div className="container-x py-4 sm:py-6">
          <form role="search" onSubmit={(e) => { e.preventDefault(); submit(value) }} className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" />
            <input
              value={value}
              autoFocus={!query}
              onChange={(e) => { setValue(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Search wallets, bags, passport covers…"
              aria-label="Search products"
              className="w-full rounded-lg border-[1.5px] border-ink bg-white py-3.5 pl-12 pr-12 text-base outline-none sm:py-4 sm:text-lg"
            />
            {value && <button type="button" onClick={() => { setValue(''); setOpen(false) }} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-mute hover:text-ink"><X className="size-5" /></button>}
          </form>
          {open && value.trim() && value.trim() !== query && <Suggestions q={value} recent={recent} onPick={submit} />}
        </div>
      </section>

      <section className="container-x space-y-6 py-7 sm:space-y-8 sm:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">
              {query ? (total == null ? `Searching for “${query}”…` : `${total} ${total === 1 ? 'result' : 'results'} for “${query}”`) : 'Featured products'}
            </h1>
            {cats.length > 0 && <p className="text-[13px] text-mute">In {cats.map((c) => c.name).join(', ')}</p>}
          </div>
          {query && (
            <label className="relative flex items-center self-start lg:self-auto">
              <span className="sr-only">Sort results</span>
              <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="appearance-none rounded-full border border-line bg-white py-2 pl-3.5 pr-9 text-[13px] outline-none hover:border-ink">
                {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-mute" />
            </label>
          )}
        </div>

        {/* Category chips */}
        {cats.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: '', name: 'All', count: total }, ...cats].map((c) => (
              <button key={c.slug || 'all'} onClick={() => setParam('c', c.slug)} className={cx('shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition', cat === c.slug ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>
                {c.name} <span className={cat === c.slug ? 'text-white/60' : 'text-mute'}>({c.count})</span>
              </button>
            ))}
          </div>
        )}

        {results.error ? (
          <ErrorState error={results.error} onRetry={results.refetch} />
        ) : results.isPending ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : items.length > 0 ? (
          <div className={cx('grid grid-cols-2 gap-x-3 gap-y-7 transition-opacity sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4', results.isPlaceholderData && 'opacity-60')}>
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <EmptyState icon={SearchIcon} title={`No results for “${query}”`} text="Check the spelling or try a broader term." action={<Button to="/shop" variant="outlineTan" size="sm">Browse all products</Button>} />
        )}

        {/* Popular searches */}
        <div className="space-y-3 rounded-lg bg-sand p-5 sm:p-7">
          <p className="eyebrow">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((t) => <button key={t} onClick={() => submit(t)} className="rounded-full bg-white px-4 py-2 text-[13px] transition hover:bg-ink hover:text-white">{t}</button>)}
          </div>
        </div>
      </section>
    </>
  )
}
