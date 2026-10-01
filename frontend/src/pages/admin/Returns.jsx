import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Btn, Badge, Card, PageHead, KPIs, Tabs, Field, Select, Textarea, Two, Col, Thumb, cx } from '../../components/admin/ui'

const returns = [
  { id: 'RT-1042', order: '#XQ-23877', product: 'Rose Clasp Purse', customer: 'Sadia Rahman', reason: 'Colour mismatch', amount: '৳2,150', type: 'Refund', status: 'Requested', tone: 'amber', img: '/images/pink-purse.jpg' },
  { id: 'RT-1041', order: '#XQ-23790', product: 'Zip Long Wallet', customer: 'Karim Sheikh', reason: 'Zipper faulty', amount: '৳1,990', type: 'Exchange', status: 'Pickup scheduled', tone: 'blue', img: '/images/zip-key.jpg' },
  { id: 'RT-1040', order: '#XQ-23512', product: 'Everyday Tote Bag', customer: 'Mitu Akter', reason: 'Changed mind', amount: '৳5,900', type: 'Refund', status: 'Inspecting', tone: 'purple', img: '/images/tote.jpg' },
  { id: 'RT-1038', order: '#XQ-23301', product: 'Classic Bifold Wallet', customer: 'Arif Hossain', reason: 'Wrong colour sent', amount: '৳1,450', type: 'Exchange', status: 'Completed', tone: 'green', img: '/images/fb-wallet.jpg' },
]

const STEPS = ['Requested', 'Approved', 'Pickup', 'Inspect', 'Refund']

function ReturnCard({ r, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cx('w-full space-y-3 rounded-xl border bg-white p-3.5 text-left sm:p-4', active ? 'border-tan ring-1 ring-tan' : 'border-aline hover:border-tan/40')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold">{r.id} · {r.order}</p>
        <Badge tone={r.tone}>{r.status}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <Thumb src={r.img} size={42} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{r.product}</p>
          <p className="truncate text-xs text-amute">{r.customer} · {r.reason}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold">{r.amount}</p>
          <p className="text-[11px] font-semibold text-tan">{r.type}</p>
        </div>
      </div>
    </button>
  )
}

function Detail({ r }) {
  return (
    <Card title={`${r.id} · ${r.product}`} sub="Requested 2 days after delivery · within 7-day window">
      <div className="space-y-2.5">
        <p className="text-xs font-semibold">Customer photos</p>
        <div className="flex gap-2">
          <img src={r.img} alt="" className="size-[72px] rounded-lg object-cover" />
          <img src="/images/teal-bag.jpg" alt="" className="size-[72px] rounded-lg object-cover" />
        </div>
        <p className="text-[13px] text-amute">“Colour looks different from the photo. Clasp is a bit loose.”</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => <span key={s} className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', i === 0 ? 'bg-tan text-white' : 'bg-asoft text-amute')}>{s}</span>)}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Resolution"><Select options={['Refund to bKash', 'Refund to Nagad', 'Bank transfer', 'Exchange']} /></Field>
        <Field label="Refund amount" defaultValue={r.amount} />
      </div>
      <Field label="Pickup"><Select options={['Steadfast return pickup · free (Inside Dhaka)', 'Pathao return pickup', 'Customer drop-off']} /></Field>
      <Field label="Note to customer"><Textarea rows={2} defaultValue="We’ve approved your return. Rider will pick up tomorrow." /></Field>
      <div className="flex gap-2.5">
        <Btn v="green" className="flex-1">Approve return</Btn>
        <Btn v="danger">Reject</Btn>
      </div>
    </Card>
  )
}

export default function AdminReturns() {
  const [sel, setSel] = useState(0)
  return (
    <>
      <PageHead
        title="Returns & refunds"
        sub="7-day return window · refunds via bKash / Nagad / bank"
        actions={<><Btn v="white">Return policy</Btn><Btn icon={Plus}><span className="sm:hidden">New</span><span className="max-sm:hidden">Create return</span></Btn></>}
      />
      <KPIs items={[['Open requests', '3', 'Needs action', 'amber'], ['Return rate', '1.8%', '▼ 0.4%'], ['Refunded (30d)', '৳18,450'], ['Avg resolution', '2.4 days', '▼ 0.6 d']]} />
      <Tabs items={[['All', '42'], ['Requested', '1'], ['Pickup', '1'], ['Inspecting', '1'], ['Completed', '37'], ['Rejected', '2']]} />
      <Two ratio="even">
        <Col className="space-y-3! sm:space-y-4!">
          {returns.map((r, i) => <ReturnCard key={r.id} r={r} active={sel === i} onClick={() => setSel(i)} />)}
        </Col>
        <Col><Detail r={returns[sel]} /></Col>
      </Two>
    </>
  )
}
