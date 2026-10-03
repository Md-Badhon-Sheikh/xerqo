import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GitCompareArrows, X } from 'lucide-react'
import { api } from '../../lib/api'
import { tk } from '../../data/store'
import { useCompare, COMPARE_MAX } from '../../context/CompareContext'
import { useQuickAdd } from '../../context/StoreUIContext'
import { normalizeProduct } from '../../lib/product'
import { Breadcrumb, Button, EmptyState, Stars, Bone, cx } from '../../components/store/ui'

// One row per attribute; each cell renders a product
const ROWS = [
  ['Price', (p) => (
    <span className="flex flex-wrap items-baseline gap-2"><b className="text-base text-tan">{tk(p.price)}</b>{p.compare_price > p.price && <span className="text-xs text-mute line-through">{tk(p.compare_price)}</span>}</span>
  )],
  ['Rating', (p) => (p.reviews_count > 0 ? <Stars n={p.rating} count={p.reviews_count} /> : <span className="text-mute">No reviews yet</span>)],
  ['Category', (p) => p.category?.name ?? '—'],
  ['Brand', (p) => p.brand?.name ?? '—'],
  ['Colours', (p) => (p.variants?.length ? (
    <span className="flex flex-wrap gap-1.5">{p.variants.map((v) => <span key={v.id} title={v.name} className="flex items-center gap-1 text-xs"><span className="size-3.5 rounded-full ring-1 ring-line" style={{ backgroundColor: v.color_hex || '#ccc' }} />{v.name}</span>)}</span>
  ) : '—')],
  ['Availability', (p) => (p.in_stock ? <span className="text-leaf">In stock</span> : <span className="text-rust">Out of stock</span>)],
  ['Name engraving', (p) => (p.is_engravable ? 'Free' : '—')],
  ['Flash sale', (p) => (p.flash_sale ? <span className="text-rust">{p.flash_sale.title}</span> : '—')],
  ['Description', (p) => <span className="line-clamp-6 text-mute">{p.description || '—'}</span>],
]

function AddCell({ p }) {
  const quickAdd = useQuickAdd()
  const q = normalizeProduct(p)
  return <Button size="sm" className="w-full" disabled={!q.inStock} onClick={() => quickAdd(q)}>{!q.inStock ? 'Sold out' : q.hasVariants ? 'Choose colour' : 'Add to cart'}</Button>
}

export default function Compare() {
  const { items, remove, clear } = useCompare()
  const results = useQueries({
    queries: items.map((i) => ({ queryKey: ['product', i.slug], queryFn: () => api.get(`/products/${i.slug}`) })),
  })
  const products = items.map((i, idx) => ({ item: i, p: results[idx]?.data?.data, loading: results[idx]?.isPending, missing: results[idx]?.error?.status === 404 }))

  return (
    <section className="container-x space-y-6 py-6 sm:space-y-8 sm:py-10">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Compare' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="h-display text-[34px] sm:text-[44px]">Compare products</h1>
          {items.length > 0 && <button onClick={clear} className="text-[13px] font-semibold text-tan underline underline-offset-4">Clear all</button>}
        </div>
        <p className="text-[13px] text-mute">Compare up to {COMPARE_MAX} products side by side. Add products with the compare button on any product page.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={GitCompareArrows} title="Nothing to compare yet" text="Open a product and tap “Compare” to add it here." action={<Button to="/shop" variant="outlineTan" size="sm">Browse products</Button>} />
      ) : (
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 rounded-lg bg-white text-[13px]">
            <colgroup><col className="w-[130px] sm:w-[170px]" />{products.map(({ item }) => <col key={item.slug} />)}</colgroup>
            <thead>
              <tr>
                <th className="border-b border-line p-4 text-left align-bottom text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">{items.length} {items.length === 1 ? 'product' : 'products'}</th>
                {products.map(({ item, p, loading, missing }) => (
                  <th key={item.slug} className="relative border-b border-l border-line p-4 text-left align-top font-normal">
                    <button onClick={() => remove(item.slug)} aria-label={`Remove ${item.name} from compare`} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 shadow-sm hover:text-rust"><X className="size-4" /></button>
                    <Link to={`/product/${item.slug}`} className="block space-y-2.5">
                      <img src={p?.image || item.image} alt="" className="aspect-square w-full rounded object-cover" />
                      <span className="block font-display text-lg font-semibold leading-tight hover:text-tan">{p?.name || item.name}</span>
                    </Link>
                    {missing && <p className="mt-1 text-xs text-rust">No longer available</p>}
                    {loading && <Bone className="mt-2 h-8" />}
                    {p && <div className="mt-3"><AddCell p={p} /></div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, render], r) => (
                <tr key={label}>
                  <th scope="row" className={cx('p-4 text-left align-top font-semibold', r < ROWS.length - 1 && 'border-b border-line')}>{label}</th>
                  {products.map(({ item, p }) => (
                    <td key={item.slug} className={cx('border-l border-line p-4 align-top', r < ROWS.length - 1 && 'border-b')}>{p ? render(p) : <Bone className="h-4 w-2/3" />}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
