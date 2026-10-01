import { useState } from 'react'
import { Eye, Plus, ArrowUpDown, GripVertical } from 'lucide-react'
import { Btn, Badge, Card, PageHead, Tabs, Field, Select, Toggle, cx } from '../../components/admin/ui'

const slides = [
  { n: 1, title: 'Crafted for class', img: '/images/cover.jpg', status: 'Active' },
  { n: 2, title: 'Passport cover — custom', img: '/images/fb-passport-custom.jpg', status: 'Active' },
  { n: 3, title: 'Premium today', img: '/images/fb-premium.jpg', status: 'Scheduled 10 Oct', tone: 'blue' },
  { n: 4, title: 'Elegance you can carry', img: '/images/fb-wallet.jpg', status: 'Draft' },
]

const promos = [
  { title: 'Personalised passport cover', link: '/passport-covers', img: '/images/fb-passport-hand.jpg' },
  { title: 'bKash 10% cashback', link: '/offers/bkash', img: '/images/cover.jpg' },
]

const sections = [
  ['Category tiles row', '8 categories', true],
  ['Flash Sale (countdown)', 'Ends 3 Oct, 11:59 PM', true],
  ['Best sellers', 'Auto · by sales', true],
  ['Craft story', 'Static', true],
  ['Name engraving banner', 'Static', true],
  ['Reviews', 'Top rated · 3', true],
  ['Instagram feed', 'Not connected', false],
]

function Slide({ s, active, onSelect }) {
  return (
    <div onClick={onSelect} className={cx('w-[80%] shrink-0 cursor-pointer rounded-xl border bg-white p-2 sm:w-auto', active ? 'border-tan ring-1 ring-tan' : 'border-aline')}>
      <img src={s.img} alt="" className="aspect-[16/7] w-full rounded-md object-cover" />
      <div className="space-y-1.5 px-1 pb-1 pt-2.5">
        <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold">Slide {s.n}</p><Badge tone={s.tone}>{s.status}</Badge></div>
        <p className="text-xs text-amute">{s.title}</p>
        <div className="flex items-center gap-3 pt-1 text-xs">
          <button className="font-semibold text-tan">Edit</button>
          <button className="inline-flex items-center gap-1 text-amute"><ArrowUpDown className="size-3" />Reorder</button>
          <button className="text-bad">Delete</button>
        </div>
      </div>
    </div>
  )
}

function HeroSlider() {
  const [sel, setSel] = useState(1)
  return (
    <Card title="Hero slider" sub="Recommended 1920×760 · max 5 slides · autoplay 5s" right={<Btn v="white" sm icon={Plus}>Add slide</Btn>}>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
        {slides.map((s) => <Slide key={s.n} s={s} active={sel === s.n} onSelect={() => setSel(s.n)} />)}
      </div>
      <div className="space-y-3.5 rounded-xl bg-asoft p-3.5 sm:p-4">
        <p className="text-[13px] font-semibold">Editing slide {sel}</p>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Desktop image" defaultValue="xerqo-cover-1920.jpg" />
          <Field label="Mobile image" defaultValue="xerqo-cover-mobile.jpg" />
        </div>
        <div className="grid gap-3.5 md:grid-cols-3">
          <Field label="Button text" defaultValue="Shop Now" />
          <Field label="Link" defaultValue="/collections/new-season" />
          <Field label="Schedule"><Select options={['Always', 'Date range', 'Hidden']} /></Field>
        </div>
      </div>
    </Card>
  )
}

function SectionRow({ label, sub, on: initial }) {
  const [on, setOn] = useState(initial)
  return (
    <div className="flex items-center gap-2.5 py-3">
      <GripVertical className="size-4 shrink-0 cursor-grab text-amute/60" />
      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{label}</p><p className="text-[11px] text-amute">{sub}</p></div>
      <button type="button" onClick={() => setOn(!on)} aria-label={`Toggle ${label}`}><Toggle on={on} /></button>
    </div>
  )
}

export default function AdminContent() {
  const [bar, setBar] = useState(true)
  return (
    <>
      <PageHead
        title="Content & banners"
        sub="Manage the homepage slider, promo banners, categories row and announcement bar"
        actions={<><Btn v="white" icon={Eye}>Preview</Btn><Btn>Publish</Btn></>}
      />
      <Tabs items={[['Homepage'], ['Pages'], ['Menus'], ['Blog']]} />

      <Card title="Announcement bar" right={<button type="button" onClick={() => setBar(!bar)} aria-label="Toggle announcement bar"><Toggle on={bar} /></button>}>
        <textarea rows={1} className="ainput resize-none max-sm:min-h-16" defaultValue="Free delivery across Bangladesh on orders over Tk 2,000 · Cash on Delivery · bKash & Nagad" />
        <div className="grid gap-3.5 md:grid-cols-2">
          <Field label="Link text" defaultValue="Shop Now" />
          <Field label="Link" defaultValue="/shop" />
        </div>
      </Card>

      <HeroSlider />

      <Card title="Promo banners (right of slider)">
        <div className="grid gap-3 md:grid-cols-2">
          {promos.map((p) => (
            <div key={p.title} className="flex items-center gap-3.5 rounded-xl border border-aline p-2">
              <img src={p.img} alt="" className="h-14 w-[70px] shrink-0 rounded-md object-cover sm:h-[62px] sm:w-[92px]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">{p.title}</p>
                <p className="text-[11px] text-amute">{p.link}</p>
                <button className="mt-1 text-xs font-semibold text-tan">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Homepage sections" sub="Drag to reorder · toggle to show/hide" bodyClass="space-y-0! divide-y divide-aline">
        {sections.map(([l, s, on]) => <SectionRow key={l} label={l} sub={s} on={on} />)}
      </Card>
    </>
  )
}
