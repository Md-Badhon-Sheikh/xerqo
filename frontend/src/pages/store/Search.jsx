import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronDown, Search as SearchIcon, X } from 'lucide-react'
import { products, tk } from '../../data/store'
import { Button, ProductCard, EmptyState, cx } from '../../components/store/ui'

/* Static suggestion data — will come from GET /search/suggest later */
const RECENT = ['passport cover', 'belt', 'gift']
const POPULAR = ['long wallet', 'passport cover with name', 'card holder', 'key holder', 'ladies purse', 'gift set', 'leather belt', 'tote bag']

const matches = (p, q) => `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())

function Suggestions({ q, results, onPick }) {
  const terms = [`${q} for men`, `${q} zipper`, `${q} engraved`, `ladies ${q}`]
  return (
    <div className="grid gap-6 rounded-b-lg border border-t-0 border-line bg-white p-5 shadow-[0_12px_30px_rgba(35,26,21,0.08)] sm:grid-cols-[1fr_1.4fr] sm:gap-10 sm:p-6">
      <div className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Suggestions</p>
          {terms.map((t, i) => (
            <button key={t} onClick={() => onPick(t)} className={cx('flex items-center gap-2.5 text-sm hover:text-tan', i === 0 && 'font-semibold')}>
              <SearchIcon className="size-3.5 text-mute" /> {t}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Recent</p>
          <div className="flex flex-wrap gap-2">
            {RECENT.map((t) => <button key={t} onClick={() => onPick(t)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] hover:border-ink">{t}</button>)}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Products</p>
        {results.slice(0, 3).map((p) => (
          <Link key={p.id} to={`/product/${p.slug}`} className="flex items-center gap-3 hover:text-tan">
            <img src={p.image} alt="" className="size-12 rounded object-cover" />
            <span><b className="block text-sm font-semibold">{p.name}</b><span className="text-[13px] font-semibold text-tan">{tk(p.price)}</span></span>
          </Link>
        ))}
        <button className="flex items-center gap-1 text-[13px] font-semibold text-tan underline underline-offset-4">See all {results.length} results <ArrowRight className="size-3.5" /></button>
      </div>
    </div>
  )
}

const FilterPill = ({ children, className }) => (
  <button className={cx('flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] hover:border-ink', className)}>
    {children} <ChevronDown className="size-3.5 text-mute" />
  </button>
)

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || 'wallet'
  const [value, setValue] = useState(query)
  const [open, setOpen] = useState(true)
  const [cat, setCat] = useState('All')

  const results = products.filter((p) => matches(p, query))
  const cats = [...new Set(results.map((p) => p.category))]
  const shown = cat === 'All' ? results : results.filter((p) => p.category === cat)

  const submit = (q) => {
    setValue(q)
    setCat('All')
    setOpen(false)
    setParams({ q })
  }

  return (
    <>
      {/* Search box + live suggestions */}
      <section className="border-b border-line bg-white">
        <div className="container-x py-4 sm:py-6">
          <form onSubmit={(e) => { e.preventDefault(); submit(value) }} className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" />
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Search wallets, bags, passport covers…"
              aria-label="Search products"
              className="w-full rounded-lg border-[1.5px] border-ink bg-white py-3.5 pl-12 pr-12 text-base outline-none sm:py-4 sm:text-lg"
            />
            {value && <button type="button" onClick={() => { setValue(''); setOpen(false) }} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-mute hover:text-ink"><X className="size-5" /></button>}
          </form>
          {open && value && <Suggestions q={value} results={products.filter((p) => matches(p, value))} onPick={submit} />}
        </div>
      </section>

      <section className="container-x space-y-6 py-7 sm:space-y-8 sm:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="h-display text-[28px] sm:text-4xl lg:text-[44px]">{results.length} results for “{query}”</h1>
            {cats.length > 0 && <p className="text-[13px] text-mute">In {cats.join(', ')}</p>}
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <FilterPill>Price</FilterPill>
            <FilterPill>Colour</FilterPill>
            <FilterPill className="max-sm:hidden">Sort: Relevance</FilterPill>
          </div>
        </div>

        {/* Category chips */}
        {results.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {['All', ...cats].map((c) => {
              const n = c === 'All' ? results.length : results.filter((p) => p.category === c).length
              return (
                <button key={c} onClick={() => setCat(c)} className={cx('shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition', cat === c ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>
                  {c} <span className={cat === c ? 'text-white/60' : 'text-mute'}>({n})</span>
                </button>
              )
            })}
          </div>
        )}

        {shown.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
            {shown.map((p) => <ProductCard key={p.id} p={p} />)}
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
