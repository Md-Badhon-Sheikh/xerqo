import { Link } from 'react-router-dom'
import { Download, Check } from 'lucide-react'
import { Btn, Badge, PayChip, Card, PageHead, KPIs, Tabs, Table, Pager, ToggleRow, Avatar, Two, Col } from '../../components/admin/ui'

const mix = [
  ['COD', 59, 'bg-ink'],
  ['bKash', 24, 'bg-bkash'],
  ['Nagad', 11, 'bg-nagad'],
  ['Card', 6, 'bg-info'],
]

const txns = [
  ['#XQ-24817', 'Rahim Uddin', 'COD', 'Steadfast', '৳2,600', 'Pending'],
  ['#XQ-24815', 'Nusrat Jahan', 'bKash', '—', '৳3,180', 'Paid'],
  ['#XQ-24812', 'Tanvir Ahmed', 'Nagad', '—', '৳1,450', 'Paid'],
  ['#XQ-24809', 'Farzana Akter', 'COD', 'Pathao', '৳4,390', 'Collected'],
  ['#XQ-24802', 'Imran Hasan', 'Card', '—', '৳5,900', 'Refunded'],
  ['#XQ-24798', 'Sabbir Rahman', 'COD', 'Steadfast', '৳1,990', 'Settled'],
]
const TONE = { Collected: 'blue', Settled: 'green' }

const settlements = [
  ['Steadfast', '9 parcels · payout Thu', '৳24,180'],
  ['Pathao', '4 parcels · payout Sun', '৳11,260'],
  ['RedX', '1 parcel · payout Tue', '৳3,200'],
]

const gateways = [['bKash Merchant', 'Live'], ['Nagad Merchant', 'Live'], ['SSLCommerz (Card)', 'Live'], ['Cash on Delivery', 'All districts']]

function MethodMix() {
  return (
    <Card title="Payment method mix" sub="Last 30 days">
      <div className="flex h-3 overflow-hidden rounded-full">
        {mix.map(([m, pct, bg]) => <div key={m} style={{ width: `${pct}%` }} className={bg} />)}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-amute">
        {mix.map(([m, pct, bg]) => <span key={m} className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${bg}`} />{m} {pct}%</span>)}
      </div>
    </Card>
  )
}

function TxnCards() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {txns.map(([id, name, pay, , amt, st]) => (
        <div key={id} className="space-y-2.5 rounded-xl border border-aline bg-white p-3.5">
          <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold">{id}</p><Badge tone={TONE[st]}>{st}</Badge></div>
          <div className="flex items-center gap-2 text-xs"><PayChip m={pay} /><span className="flex-1 text-amute">{name}</span><b className="text-[13px]">{amt}</b></div>
        </div>
      ))}
    </div>
  )
}

export default function AdminPayments() {
  return (
    <>
      <PageHead
        title="Payments & COD"
        sub="Online payments and courier cash-on-delivery settlement"
        actions={<>
          <Btn v="white" icon={Download}><span className="sm:hidden">Export</span><span className="max-sm:hidden">Export CSV</span></Btn>
          <Btn icon={Check}><span className="sm:hidden">Reconcile</span><span className="max-sm:hidden">Reconcile payout</span></Btn>
        </>}
      />
      <KPIs items={[['Collected (30d)', '৳4,82,300', '▲ 12%'], ['COD pending with courier', '৳38,640', '14 parcels', 'amber'], ['Online (bKash/Nagad/Card)', '৳1,96,120', '41%', 'gray'], ['Refunds (30d)', '৳18,450', '9 refunds', 'purple']]} />
      <Two ratio="main">
        <Col>
          <MethodMix />
          <Tabs items={[['Transactions'], ['COD settlements'], ['Refunds']]} />
          <Table
            className="max-sm:hidden"
            cols={[{ h: 'Order', b: true, className: 'whitespace-nowrap' }, { h: 'Customer', className: 'whitespace-nowrap' }, { h: 'Method' }, { h: 'Courier', mute: true, className: 'max-md:hidden' }, { h: 'Amount', b: true }, { h: 'Status' }]}
            rows={txns.map(([id, name, pay, courier, amt, st]) => [id, name, <PayChip m={pay} />, courier, amt, <Badge tone={TONE[st]}>{st}</Badge>])}
          />
          <TxnCards />
          <div className="max-sm:hidden"><Pager text="Showing 1–6 of 312" /></div>
        </Col>
        <Col>
          <Card title="Courier COD settlements">
            <div className="divide-y divide-aline">
              {settlements.map(([n, sub, amt]) => (
                <div key={n} className="flex items-center gap-3 py-3 first:pt-0">
                  <Avatar name={n} size={34} tone="teal" />
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{n}</p><p className="text-[11px] text-amute">{sub}</p></div>
                  <p className="text-sm font-bold text-tan">{amt}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-ok/8 p-3.5">
              <p className="text-xs font-semibold text-ok">Last payout received · 26 Sep</p>
              <p className="mt-1 text-[11px] text-amute">Steadfast ৳52,840 → DBBL ••4521 · matched 21/21</p>
            </div>
          </Card>
          <Card title="Payment gateways" right={<Link to="/admin/settings#payments" className="text-xs font-semibold text-tan">Settings</Link>}>
            {gateways.map(([l, s]) => <ToggleRow key={l} label={l} sub={s} on />)}
          </Card>
        </Col>
      </Two>
    </>
  )
}
