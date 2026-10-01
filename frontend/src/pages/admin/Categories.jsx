import { useState } from 'react'
import { ChevronRight, GripVertical, Pencil, Plus, Upload } from 'lucide-react'
import { Badge, Btn, Card, Field, PageHead, Select, Textarea, Toggle, ToggleRow, cx } from '../../components/admin/ui'

const CATS = [
  { name: 'Wallets', slug: 'wallets', image: '/images/fb-wallet.jpg', products: 38, on: true, subs: [['Bifold', 18], ['Slim', 12], ['Card-slot', 8]] },
  { name: 'Long Wallets', slug: 'long-wallets', image: '/images/fb-long-wallet.jpg', products: 22, on: true },
  { name: 'Passport Covers', slug: 'passport-covers', image: '/images/fb-passport-black.jpg', products: 14, on: true },
  { name: 'Key Holders', slug: 'key-holders', image: '/images/keys-red.jpg', products: 19, on: true },
  { name: 'Women’s Purses', slug: 'womens-purses', image: '/images/pink-purse.jpg', products: 26, on: true, subs: [['Clutches', 8], ['Mini Purses', 12]], seo: 'Leather Purses for Women | XERQO', desc: 'Handcrafted purses and clutches in full-grain leather…' },
  { name: 'Bags', slug: 'bags', image: '/images/messenger.jpg', products: 17, on: true, subs: [['Tote', 6], ['Crossbody', 7], ['Laptop', 4]] },
  { name: 'Belts', slug: 'belts', image: '/images/belt-tan.jpg', products: 12, on: false },
]

function Row({ c, active, onSelect }) {
  const [on, setOn] = useState(c.on)
  return (
    <>
      <div className={cx('flex items-center gap-3 border-b border-aline px-1 py-3 sm:px-0', active && 'bg-abg')}>
        <GripVertical className="size-4 shrink-0 cursor-grab text-amute max-sm:hidden" />
        <img src={c.image} alt="" className="size-11 shrink-0 rounded-md object-cover" />
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          <p className="truncate text-xs text-amute">{c.products} products{c.subs ? ` · ${c.subs.length} sub` : ''}</p>
        </button>
        <button type="button" onClick={() => setOn(!on)} aria-label="Shown on homepage" className="inline-flex"><Toggle on={on} /></button>
        <button type="button" onClick={onSelect} aria-label="Edit" className="text-amute hover:text-ink max-sm:hidden"><Pencil className="size-3.5" /></button>
        <button type="button" onClick={onSelect} aria-label="Open" className="pr-1 text-amute hover:text-ink"><ChevronRight className="size-4" /></button>
      </div>
      {active && c.subs?.map(([s, n]) => (
        <div key={s} className="flex items-center justify-between border-b border-aline py-2.5 pl-7 pr-1 text-[13px] sm:pl-20">
          <span className="flex items-center gap-2.5"><span className="h-px w-2.5 bg-ink" />{s}</span>
          <span className="text-xs text-amute">{n} items</span>
        </div>
      ))}
    </>
  )
}

export default function Categories() {
  const [sel, setSel] = useState(4)
  const c = CATS[sel]

  return (
    <>
      <PageHead
        title="Categories"
        sub="8 categories · 11 sub-categories · drag to reorder menu"
        actions={<Btn icon={Plus}>Add category</Btn>}
      />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[1.5fr_1fr] xl:items-start">
        <Card title="All categories" right={<span className="pt-1 text-[11px] text-amute">Shown on homepage</span>}>
          <div className="-mt-2">
            {CATS.map((cat, i) => <Row key={cat.slug} c={cat} active={i === sel} onSelect={() => setSel(i)} />)}
          </div>
        </Card>

        <Card key={c.slug} title="Edit category" sub={c.name} right={<Badge tone="amber">Unsaved</Badge>}>
          <Field label="Name *"><input className="ainput border-tan" defaultValue={c.name} /></Field>
          <Field label="URL slug">
            <span className="flex items-center rounded-lg border border-aline bg-white text-[13px] focus-within:border-tan">
              <span className="pl-3 text-tan">/shop/</span>
              <input className="min-w-0 flex-1 bg-transparent px-2 py-2.5 outline-none" defaultValue={c.slug} />
            </span>
          </Field>
          <Field label="Parent category"><Select options={['None (top level)', ...CATS.map((x) => x.name)]} /></Field>
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold">Category image</span>
            <div className="flex items-center gap-3.5">
              <img src={c.image} alt="" className="size-[72px] rounded-lg object-cover" />
              <div className="space-y-1.5">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-aline bg-white px-3 py-1.5 text-xs font-semibold hover:border-ink">
                  <Upload className="size-3.5" />Replace image<input type="file" accept="image/*" className="hidden" />
                </label>
                <p className="text-[11px] text-amute">Square, min 600×600px</p>
              </div>
            </div>
          </div>
          <Field label="Description"><Textarea rows={3} defaultValue={c.desc || `Handcrafted ${c.name.toLowerCase()} in full-grain leather…`} /></Field>
          <ToggleRow label="Show on homepage category row" on={c.on} />
          <ToggleRow label="Show in main menu" on />
          <Field label="SEO title" defaultValue={c.seo || `Leather ${c.name} | XERQO`} />
          <div className="grid grid-cols-[auto_1fr] gap-2.5">
            <Btn v="white">Delete</Btn>
            <Btn>Save category</Btn>
          </div>
        </Card>
      </div>
    </>
  )
}
