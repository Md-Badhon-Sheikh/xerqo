import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Minus, Plus, Search } from 'lucide-react'
import { Badge, Btn, Card, Field, KPIs, KV, PageHead, Select, Table, ToggleRow, Two, Col, cx } from '../../components/admin/ui'

const ITEMS = [
  ['Classic Bifold Wallet', 'Brown', 'XQ-WL-001', 42, '/images/fb-wallet.jpg'],
  ['Zip Long Wallet', 'Black', 'XQ-LW-004', 6, '/images/fb-long-wallet.jpg'],
  ['Passport Cover — Black', 'Black', 'XQ-PC-002', 0, '/images/fb-passport-black.jpg'],
  ['Handcrafted Passport Cover', 'Tan', 'XQ-PC-005', 18, '/images/fb-passport-hand.jpg'],
  ['Key Holder — Red', 'Red', 'XQ-KH-003', 4, '/images/keys-red.jpg'],
  ['Rose Clasp Purse', 'Pink', 'XQ-PU-007', 11, '/images/pink-purse.jpg'],
  ['Everyday Tote Bag', 'Tan', 'XQ-BG-010', 3, '/images/tote.jpg'],
]
const LOG = [
  ['+24', 'Zip Long Wallet', 'Restock · Nasir (Inventory) · Today 11:20'],
  ['−1', 'Classic Bifold Wallet', 'Order #XQ-24817 · Today 02:14'],
  ['+1', 'Classic Bifold Wallet', 'Return RT-1038 restocked · Yesterday'],
  ['−2', 'Key Holder — Red', 'Damaged · QC · 28 Sep'],
]

const status = (n) => (n === 0 ? 'Out of stock' : n < 10 ? 'Low stock' : 'In stock')
const tone = (n) => (n === 0 ? 'text-bad' : n < 10 ? 'text-amber' : 'text-ok')

function Stepper({ value, onChange }) {
  const b = 'grid size-7 place-items-center rounded-md border border-aline bg-white hover:border-ink'
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className={b} aria-label="Decrease"><Minus className="size-3" /></button>
      <button type="button" onClick={() => onChange(value + 1)} className={b} aria-label="Increase"><Plus className="size-3" /></button>
      <Link to="/admin/products/new" className="ml-1 text-[13px] font-semibold text-tan">Edit</Link>
    </div>
  )
}

export default function Inventory() {
  const [stock, setStock] = useState(ITEMS.map((i) => i[3]))
  const set = (i) => (v) => setStock(stock.map((s, j) => (j === i ? v : s)))

  const cols = [{ h: 'Product' }, { h: 'SKU', mute: true, className: 'max-lg:hidden' }, { h: 'Stock', b: true }, { h: 'Status' }, { h: '', right: true }]
  const rows = ITEMS.map(([name, variant, sku, , img], i) => [
    <div className="flex items-center gap-3"><img src={img} alt="" className="size-9 shrink-0 rounded-md object-cover" /><div className="min-w-0"><p className="font-semibold">{name}</p><p className="text-[11px] text-amute">{variant}<span className="lg:hidden"> · {sku}</span></p></div></div>,
    sku,
    <span className={tone(stock[i])}>{stock[i]}</span>,
    <Badge>{status(stock[i])}</Badge>,
    <Stepper value={stock[i]} onChange={set(i)} />,
  ])

  return (
    <>
      <PageHead
        title="Inventory"
        sub="Stock levels by product & variant · low-stock alerts at 5 units"
        actions={<>
          <Btn v="white" icon={Download}>Export</Btn>
          <Btn icon={Plus}><span className="sm:hidden">Adjust</span><span className="max-sm:hidden">Stock adjustment</span></Btn>
        </>}
      />

      <KPIs items={[
        ['Total SKUs', '86', '12 products · 74 variants', 'gray'],
        ['Units in stock', '1,248'],
        ['Low stock', '9', 'Reorder soon', 'amber'],
        ['Out of stock', '2', 'Hidden from shop', 'red'],
      ]} />

      <div className="flex flex-col gap-2.5 lg:flex-row">
        <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-aline bg-white px-3 py-2.5 text-[13px]">
          <Search className="size-4 text-amute" />
          <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-amute" placeholder="Search SKU or product…" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2.5">
          <Select options={['All categories', 'Wallets', 'Long Wallets', 'Passport Covers', 'Bags']} className="sm:w-40" />
          <Select options={['All status', 'In stock', 'Low stock', 'Out of stock']} className="sm:w-32" />
          <Select options={['Warehouse: Dhaka', 'Warehouse: Chattogram']} className="max-sm:hidden sm:w-44" />
        </div>
      </div>

      <Two ratio="main">
        <Col>
          <Table cols={cols} rows={rows} className="max-md:hidden" />
          <div className="space-y-2.5 md:hidden">
            {ITEMS.map(([name, variant, sku, , img], i) => (
              <div key={sku} className="flex items-center gap-3 rounded-xl border border-aline bg-white p-3">
                <img src={img} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{name}</p><p className="truncate text-[11px] text-amute">{sku} · {variant}</p></div>
                <div className="shrink-0 space-y-1 text-right"><p className={cx('text-sm font-bold', tone(stock[i]))}>{stock[i]} pcs</p><Badge>{status(stock[i])}</Badge></div>
              </div>
            ))}
          </div>
        </Col>

        <Col className="md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          <Card title="Quick stock adjustment" sub="Every change is logged with reason & staff" className="md:col-span-2 xl:col-span-1">
            <Field label="Product / variant"><Select options={ITEMS.map(([n, v, s]) => `${n} — ${v} (${s})`)} defaultValue="Zip Long Wallet — Black (XQ-LW-004)" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><Select options={['Add (restock)', 'Remove', 'Set exact']} /></Field>
              <Field label="Quantity" defaultValue="+24" />
            </div>
            <Field label="Reason"><Select options={['New batch from workshop', 'Damaged', 'Return restocked', 'Stock count correction']} /></Field>
            <div className="flex justify-between text-[13px]"><span className="text-amute">New stock</span><b className="text-ok">6 → 30</b></div>
            <Btn className="w-full">Save adjustment</Btn>
          </Card>

          <Card title="Stock movement log" right={<button className="text-xs font-semibold text-tan">View all</button>} >
            <div className="divide-y divide-aline">{LOG.map(([d, n, s]) => (
              <div key={s} className="flex items-center gap-3 py-3 first:pt-0">
                <span className={cx('grid h-7 min-w-9 place-items-center rounded-md px-1.5 text-xs font-bold', d.startsWith('+') ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}>{d}</span>
                <div className="min-w-0"><p className="text-[13px] font-semibold">{n}</p><p className="truncate text-[11px] text-amute">{s}</p></div>
              </div>
            ))}</div>
          </Card>

          <Card title="Low-stock alerts">
            <KV k="Alert threshold" v="5 units" />
            <KV k="Email + SMS to" v="Inventory team" />
            <ToggleRow label="Auto-hide out-of-stock items" on />
          </Card>
        </Col>
      </Two>
    </>
  )
}
