import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Upload } from 'lucide-react'
import { Badge, Btn, PageHead, Pager, Select, Table, Tabs, Thumb, Toggle, cx } from '../../components/admin/ui'
import { products } from '../../data/admin'
import { Tk } from './Orders'

const ROWS = [
  [products[5], 'XQ-LW-COG', 48, 4, true],
  [products[0], 'XQ-BF-BLK', 126, 3, true],
  [products[11], 'XQ-PC-NVY', 34, 3, true],
  [products[25], 'XQ-TB-BRN', 9, 2, true],
  [{ ...products[30], name: 'Slim Card Holder', image: '/images/card-tan.jpg' }, 'XQ-CH-TAN', 4, 4, true],
  [products[20], 'XQ-PR-WIN', 0, 2, false],
  [{ ...products[15], name: 'Loop Key Holder', price: 590 }, 'XQ-KH-TAN', 210, 5, true],
  [products[31], 'XQ-BT-BLK', null, 2, false],
].map(([p, sku, stock, variants, active]) => ({ p, sku, stock, variants, active }))

export const stockStatus = (n) => (n === null ? 'Draft' : n === 0 ? 'Out of stock' : n < 10 ? 'Low stock' : 'In stock')

function ActiveToggle({ on: initial }) {
  const [on, setOn] = useState(initial)
  return <button type="button" onClick={() => setOn(!on)} aria-label="Toggle active" className="inline-flex"><Toggle on={on} /></button>
}

function StockChip({ n }) {
  if (n === null) return <Badge tone="gray">Draft</Badge>
  return <Badge tone={n === 0 ? 'red' : n < 10 ? 'amber' : 'green'}>{n} in stock</Badge>
}

export default function Products() {
  const [view, setView] = useState('list')
  const cols = [
    { h: '', className: 'w-10 !pr-0' }, { h: 'Product' }, { h: 'Category', mute: true, className: 'max-xl:hidden' }, { h: 'Price', b: true },
    { h: 'Stock' }, { h: 'Variants', className: 'max-lg:hidden' }, { h: 'Active' }, { h: '', right: true, className: 'w-20' },
  ]
  const rows = ROWS.map((r, i) => [
    <input type="checkbox" defaultChecked={i === 3} className="size-4 accent-tan" aria-label={`Select ${r.p.name}`} />,
    <div className="flex items-center gap-3"><Thumb src={r.p.image} size={40} /><div className="min-w-0"><p className="font-semibold">{r.p.name}</p><p className="text-[11px] text-amute">{r.sku}</p></div></div>,
    r.p.category,
    <span className="whitespace-nowrap">{Tk(r.p.price)}</span>,
    <div className="space-y-0.5"><Badge>{stockStatus(r.stock)}</Badge><p className="text-[11px] text-amute">{r.stock === null ? '—' : `${r.stock} units`}</p></div>,
    <span className="whitespace-nowrap">{r.variants} colours</span>,
    <ActiveToggle on={r.active} />,
    <div className="flex items-center justify-end gap-3 text-amute"><Link to="/admin/products/new" aria-label="Edit"><Pencil className="size-3.5 hover:text-ink" /></Link><MoreHorizontal className="size-4" /></div>,
  ])

  return (
    <>
      <PageHead
        title="Products"
        sub="86 products · 8 categories"
        actions={<>
          <Btn v="white" icon={Upload}><span className="sm:hidden">Import</span><span className="max-sm:hidden">Import CSV</span></Btn>
          <Btn to="/admin/products/new" icon={Plus}>Add product</Btn>
        </>}
      />
      <Tabs items={[['All', '86'], ['Active', '78'], ['Draft', '5'], ['Low stock', '6'], ['Out of stock', '3']]} />

      <div className="flex flex-col gap-2.5 md:flex-row">
        <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-aline bg-white px-3 py-2.5 text-[13px]">
          <Search className="size-4 text-amute" />
          <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-amute" placeholder="Search products or SKU" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <Select options={['Category: All', 'Wallets', 'Long Wallets', 'Passport Covers', 'Bags']} className="sm:w-44" />
          <Select options={['Stock: All', 'In stock', 'Low stock', 'Out of stock']} className="sm:w-36" />
          <div className="hidden shrink-0 rounded-lg border border-aline bg-white p-1 md:flex">
            {[['grid', LayoutGrid], ['list', List]].map(([k, I]) => (
              <button key={k} onClick={() => setView(k)} aria-label={`${k} view`} className={cx('grid size-8 place-items-center rounded-md', view === k ? 'bg-asoft text-ink' : 'text-amute')}><I className="size-4" /></button>
            ))}
          </div>
        </div>
      </div>

      {view === 'list'
        ? <Table cols={cols} rows={rows} className="max-md:hidden" />
        : (
          <div className="grid gap-4 max-md:hidden md:grid-cols-3 xl:grid-cols-4">
            {ROWS.map((r) => (
              <div key={r.sku} className="overflow-hidden rounded-xl border border-aline bg-white">
                <img src={r.p.image} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="space-y-2 p-3.5">
                  <div className="flex items-start justify-between gap-2"><p className="text-[13px] font-semibold">{r.p.name}</p><ActiveToggle on={r.active} /></div>
                  <p className="text-[11px] text-amute">{r.p.category} · {r.sku}</p>
                  <div className="flex items-center justify-between"><b className="text-sm">{Tk(r.p.price)}</b><StockChip n={r.stock} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {ROWS.map((r) => (
          <div key={r.sku} className="flex gap-3 rounded-xl border border-aline bg-white p-3">
            <Thumb src={r.p.image} size={64} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.p.name}</p>
              <p className="truncate text-[11px] text-amute">{r.p.category} · {r.sku}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2"><b className="text-sm">{Tk(r.p.price)}</b><StockChip n={r.stock} /></div>
            </div>
            <div className="flex flex-col items-end justify-between"><ActiveToggle on={r.active} /><MoreHorizontal className="size-4 text-amute" /></div>
          </div>
        ))}
        <button className="w-full rounded-xl border border-aline bg-white py-3 text-[13px] font-semibold">Load more</button>
      </div>

      <div className="max-md:hidden"><Pager text="Showing 1–8 of 86" /></div>
    </>
  )
}
