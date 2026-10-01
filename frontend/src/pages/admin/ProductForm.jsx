import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, GripVertical, MoreHorizontal, Plus, Upload, X } from 'lucide-react'
import { Btn, Card, Col, Field, KV, Select, Textarea, Toggle, Two, cx } from '../../components/admin/ui'

const IMAGES = ['/images/fb-long-wallet.jpg', '/images/fb-premium.jpg', '/images/wallet-cash.jpg']
const VARIANTS = [
  ['Cognac', '#8B4A1E', 'XQ-LW-COG', 2450, 48],
  ['Black', '#1E1A18', 'XQ-LW-BLK', 2450, 36],
  ['Dark Brown', '#4A2C1A', 'XQ-LW-BRN', 2450, 12],
  ['Wine', '#6B1F2A', 'XQ-LW-WIN', 2650, 2],
]
const TOOLBAR = ['B', 'I', 'U', 'H2', '• List', '1. List', 'Link', 'Image']

const Money = ({ defaultValue }) => (
  <span className="relative block">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-amute">৳</span>
    <input className="ainput pl-7" defaultValue={defaultValue} />
  </span>
)

function Switch({ initial }) {
  const [on, setOn] = useState(initial)
  return <button type="button" onClick={() => setOn(!on)} aria-label="Toggle" className="inline-flex"><Toggle on={on} /></button>
}

function Tags() {
  const [tags, setTags] = useState(['men', 'gift', 'full-grain', 'bestseller'])
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-asoft px-2.5 py-1 text-xs">
          {t}<button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="size-3 text-amute" /></button>
        </span>
      ))}
    </div>
  )
}

export default function ProductForm() {
  const [desc, setDesc] = useState('Slim long wallet with 12 card slots and zip coin pocket.')
  const [cover, setCover] = useState(0)

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Products</Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold sm:text-[26px]">Add product</h1>
            <p className="mt-1 text-[13px] text-amute">Fill in the details — it goes live when you publish.</p>
          </div>
          <div className="flex gap-2 max-sm:hidden">
            <Btn v="white" to="/admin/products">Discard</Btn>
            <Btn v="white">Save draft</Btn>
            <Btn>Publish</Btn>
          </div>
        </div>
      </div>

      <Two ratio="main">
        <Col>
          <Card title="General">
            <Field label="Product name *"><input className="ainput border-tan" defaultValue="Heritage Long Wallet" /></Field>
            <label className="block space-y-1.5">
              <span className="flex justify-between text-xs font-semibold">Short description<span className="font-normal text-amute">{desc.length} / 160</span></span>
              <input className="ainput" maxLength={160} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </label>
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold">Description</span>
              <div className="overflow-hidden rounded-lg border border-aline focus-within:border-tan">
                <div className="no-scrollbar flex gap-3.5 overflow-x-auto bg-asoft px-3 py-2 text-xs font-semibold text-amute">
                  {TOOLBAR.map((t) => <button key={t} type="button" className="shrink-0 hover:text-ink">{t}</button>)}
                </div>
                <textarea rows={5} className="w-full resize-y px-3 py-3 text-[13px] leading-relaxed outline-none"
                  defaultValue={'Cut from vegetable-tanned full-grain leather that darkens beautifully with use. 12 card slots, 2 note compartments, zip coin pocket and a hidden SIM/ID sleeve.\n\nSize: 19 × 9.5 × 2 cm · Weight: 140 g'} />
              </div>
            </div>
          </Card>

          <Card title="Media" sub="Up to 8 images · 1:1 or 4:5 · max 5 MB each">
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
              {IMAGES.map((src, i) => (
                <button type="button" key={src} onClick={() => setCover(i)} className={cx('relative aspect-square overflow-hidden rounded-lg', cover === i && 'ring-2 ring-tan ring-offset-2')}>
                  <img src={src} alt="" className="size-full object-cover" />
                  {cover === i && <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold">Cover</span>}
                  <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-white text-ink"><X className="size-3" /></span>
                </button>
              ))}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-tan/60 bg-asoft/60 text-center text-tan">
                <input type="file" accept="image/*" multiple className="hidden" />
                <span className="space-y-1"><Upload className="mx-auto size-4" /><span className="block text-[11px] font-semibold sm:text-xs"><span className="sm:hidden">Add</span><span className="max-sm:hidden">Drop images or browse</span></span></span>
              </label>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Field label="Price *"><Money defaultValue="2,450" /></Field>
              <Field label="Compare-at price" help="Shows as strikethrough"><Money defaultValue="2,950" /></Field>
              <Field label="Cost per item" help="Margin 55% · Profit ৳1,350"><Money defaultValue="1,100" /></Field>
            </div>
          </Card>

          <Card title="Variants" sub="Colour options" right={<Btn v="white" sm icon={Plus}>Add variant</Btn>}>
            <div className="overflow-hidden rounded-lg border border-aline">
              <table className="w-full text-[13px]">
                <thead className="bg-asoft text-left text-[10px] uppercase tracking-wider text-amute">
                  <tr>
                    <th className="w-8 max-sm:hidden" /><th className="px-3 py-2.5 font-semibold">Colour</th>
                    <th className="px-3 py-2.5 font-semibold max-sm:hidden">SKU</th><th className="px-3 py-2.5 font-semibold max-sm:hidden">Price</th>
                    <th className="px-3 py-2.5 font-semibold">Stock</th><th className="w-10 max-sm:hidden" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-aline">
                  {VARIANTS.map(([name, hex, sku, price, stock]) => (
                    <tr key={sku}>
                      <td className="pl-3 text-amute max-sm:hidden"><GripVertical className="size-3.5" /></td>
                      <td className="px-3 py-2.5"><span className="flex items-center gap-2.5"><span className="size-4 shrink-0 rounded-full border border-black/10" style={{ background: hex }} />{name}</span></td>
                      <td className="px-3 py-2.5 max-sm:hidden">{sku}</td>
                      <td className="px-3 py-2.5 max-sm:hidden">৳{price.toLocaleString('en-IN')}</td>
                      <td className={cx('px-3 py-2.5 font-semibold', stock < 5 && 'text-bad')}>{stock}</td>
                      <td className="pr-3 text-amute max-sm:hidden"><MoreHorizontal className="size-4" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Personalisation">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[13px] font-semibold">Allow name engraving</p><p className="text-[11px] text-amute">Customer can add initials at checkout</p></div>
              <Switch initial />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Field label="Max characters" defaultValue="12" />
              <Field label="Extra fee"><Money defaultValue="0 (free)" /></Field>
              <Field label="Extra lead time"><Select options={['1 day', 'Same day', '2 days']} /></Field>
            </div>
          </Card>

          <Card title="Search engine listing" right={<button type="button" className="text-xs font-semibold text-tan">Edit</button>}>
            <div className="rounded-lg bg-asoft p-3.5">
              <p className="truncate text-[11px] text-ok">xerqo.com › products › heritage-long-wallet</p>
              <p className="mt-0.5 text-[15px] font-semibold text-info">Heritage Long Wallet — Genuine Leather | XERQO</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amute">Slim long wallet in full-grain leather with 12 card slots. Free engraving, Cash on Delivery across Bangladesh.</p>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Meta title" defaultValue="Heritage Long Wallet — Genuine Leather | XERQO" />
              <Field label="URL handle" defaultValue="heritage-long-wallet" />
            </div>
          </Card>
        </Col>

        <Col>
          <Card title="Status">
            <Field label="Visibility"><Select options={['Active — visible on store', 'Draft', 'Hidden']} /></Field>
            <div className="space-y-2.5"><KV k="Publish on" v="1 Oct 2026, 10:00 AM" /><KV k="Sales channels" v="Website · Facebook Shop" /></div>
          </Card>

          <Card title="Organisation">
            <Field label="Category *"><Select options={['Long Wallets', 'Wallets', 'Passport Covers', 'Card Holders', 'Key Holders', "Women's Purses", 'Bags', 'Belts']} /></Field>
            <Field label="Collection"><Select options={['Festive Gift Sets', 'Everyday Carry', 'Travel']} /></Field>
            <div className="space-y-1.5"><span className="block text-xs font-semibold">Tags</span><Tags /></div>
            <Field label="Leather type"><Select options={['Full-grain · Veg-tanned', 'Top-grain', 'Croc-embossed', 'Suede']} /></Field>
          </Card>

          <Card title="Inventory">
            <Field label="SKU (base)" defaultValue="XQ-LW" />
            <Field label="Barcode" placeholder="Auto-generate" />
            <div className="flex items-center justify-between text-[13px]"><span>Track quantity</span><Switch initial /></div>
            <div className="flex items-center justify-between text-[13px]"><span>Alert when stock below 5</span><Switch initial /></div>
          </Card>

          <Card title="Shipping">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight" defaultValue="0.14 kg" />
              <Field label="Package"><Select options={['Gift box', 'Pouch', 'Mailer']} /></Field>
            </div>
          </Card>
        </Col>
      </Two>

      {/* Mobile action bar, sits above the bottom tabs */}
      <div className="sticky bottom-[72px] z-20 -mx-4 grid grid-cols-2 gap-2.5 border-t border-aline bg-white px-4 py-3 sm:hidden">
        <Btn v="white">Save draft</Btn>
        <Btn>Publish</Btn>
      </div>
    </>
  )
}
