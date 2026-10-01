import { useState } from 'react'
import { Plus, Copy } from 'lucide-react'
import { Btn, Badge, Card, PageHead, KPIs, Field, Select, Toggle, Two, Col, cx } from '../../components/admin/ui'

const coupons = [
  { code: 'XERQO500', title: '৳500 off', min: '৳2,000', used: 142, limit: 500, expires: '31 Oct 2026', status: 'Active' },
  { code: 'EID25', title: '25% off', min: '৳1,500', used: 388, limit: 1000, expires: '15 Oct 2026', status: 'Active' },
  { code: 'FREESHIP', title: 'Free delivery', min: '৳1,000', used: 96, expires: 'No expiry', status: 'Active' },
  { code: 'BKASH10', title: '10% (bKash only)', min: '৳1,500', used: 211, limit: 500, expires: '30 Nov 2026', status: 'Active' },
  { code: 'WELCOME15', title: '15% first order', min: '—', used: 74, expires: 'No expiry', status: 'Paused' },
  { code: 'PUJA20', title: '20% off', min: '৳1,200', used: 500, limit: 500, expires: '5 Oct 2026', status: 'Expired' },
]

const Code = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-md border border-dashed border-tan/50 bg-asoft px-2.5 py-1 text-xs font-bold tracking-wide">
    {children}<Copy className="size-3 text-amute" />
  </span>
)

function Usage({ used, limit, full }) {
  if (!limit) return <p className="text-[13px] font-semibold">{used} used</p>
  const pct = Math.min(100, (used / limit) * 100)
  return (
    <div className={full ? 'w-full' : 'w-[110px]'}>
      <p className="text-xs font-semibold">{used} / {limit}</p>
      <div className="mt-1.5 h-1 rounded-full bg-asoft">
        <div style={{ width: `${pct}%` }} className={cx('h-full rounded-full', pct >= 100 ? 'bg-amute' : 'bg-tan')} />
      </div>
    </div>
  )
}

const tone = (s) => (s === 'Paused' ? 'amber' : undefined)

function CouponTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white max-sm:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Discount</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold max-md:hidden">Expires</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-abg/60">
                <td className="px-4 py-3.5"><Code>{c.code}</Code></td>
                <td className="px-4 py-3.5"><p className="font-semibold">{c.title}</p><p className="text-[11px] text-amute">Min {c.min}</p></td>
                <td className="px-4 py-3.5"><Usage {...c} /></td>
                <td className="whitespace-nowrap px-4 py-3.5 text-amute max-md:hidden">{c.expires}</td>
                <td className="px-4 py-3.5"><Badge tone={tone(c.status)}>{c.status}</Badge></td>
                <td className="px-4 py-3.5 text-right"><Toggle on={c.status === 'Active'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CouponCards() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {coupons.map((c) => (
        <div key={c.code} className="space-y-2.5 rounded-xl border border-aline bg-white p-3.5">
          <div className="flex items-center justify-between gap-2"><Code>{c.code}</Code><Badge tone={tone(c.status)}>{c.status}</Badge></div>
          <p className="text-xs text-amute">{c.title} · Min {c.min} · {c.expires}</p>
          <Usage {...c} full />
        </div>
      ))}
    </div>
  )
}

function Segmented({ items, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-asoft p-1">
      {items.map((t) => (
        <button key={t} type="button" onClick={() => onChange(t)} className={cx('flex-1 rounded-md py-2 text-xs', value === t ? 'bg-white font-semibold shadow-sm' : 'text-amute')}>{t}</button>
      ))}
    </div>
  )
}

function CreateCoupon() {
  const [type, setType] = useState('Flat ৳')
  const [walletOnly, setWalletOnly] = useState(false)
  return (
    <Card title="Create coupon" sub="Quick create — all fields editable later">
      <Field label="Coupon code" help="Customers type this at checkout" defaultValue="XERQO500" />
      <div className="space-y-1.5"><p className="text-xs font-semibold">Discount type</p><Segmented items={['Percent', 'Flat ৳', 'Free delivery']} value={type} onChange={setType} /></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" defaultValue={type === 'Percent' ? '10%' : '৳  500'} />
        <Field label="Min. order" defaultValue="৳  2,000" />
        <Field label="Usage limit" defaultValue="500" />
        <Field label="Per customer" defaultValue="1" />
      </div>
      <Field label="Valid until"><Select options={['31 Oct 2026', '15 Nov 2026', '31 Dec 2026', 'No expiry']} /></Field>
      <Field label="Applies to"><Select options={['All products', 'Wallets', 'Passport Covers', 'Selected products']} /></Field>
      <button type="button" onClick={() => setWalletOnly(!walletOnly)} className="flex w-full items-center justify-between gap-3 text-left text-[13px]">
        Only for bKash / Nagad payment <Toggle on={walletOnly} />
      </button>
      <Btn className="w-full">Create coupon</Btn>
    </Card>
  )
}

export default function AdminCoupons() {
  return (
    <>
      <PageHead title="Coupons & offers" sub="6 coupons · Tk 1.8L discount given this month" actions={<Btn icon={Plus}>Create coupon</Btn>} />
      <KPIs items={[['Active coupons', '4'], ['Redemptions (30d)', '911'], ['Discount given', 'Tk 1.8L'], ['Revenue with coupons', 'Tk 9.6L']]} />
      <Two ratio="main">
        <Col><CouponTable /><CouponCards /></Col>
        <Col><CreateCoupon /></Col>
      </Two>
    </>
  )
}
