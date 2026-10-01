import { useState } from 'react'
import { Check, Settings2, ClipboardList, Star, Undo2, Layers, Wallet, Truck, Users } from 'lucide-react'
import { Btn, PageHead, Tabs, Card, Two, Col, cx } from '../../components/admin/ui'

const TILE = { tan: 'bg-tan/12 text-tan', amber: 'bg-amber/12 text-amber', red: 'bg-bad/10 text-bad', green: 'bg-ok/10 text-ok', blue: 'bg-info/10 text-info' }

const ITEMS = [
  { group: 'Today', icon: ClipboardList, tone: 'tan', title: 'New order #XQ-24817', sub: 'Rahim Uddin · ৳2,600 · COD', time: '2 min ago', unread: true },
  { group: 'Today', icon: Star, tone: 'amber', title: 'New 5★ review', sub: 'Classic Bifold Wallet · “Excellent stitching…”', time: '18 min ago', unread: true },
  { group: 'Today', icon: Undo2, tone: 'amber', title: 'Return requested RT-1042', sub: 'Rose Clasp Purse · Colour mismatch', time: '1 h ago', unread: true },
  { group: 'Earlier', icon: Layers, tone: 'red', title: 'Low stock: Zip Long Wallet', sub: '6 left · threshold 5', time: '3 h ago' },
  { group: 'Earlier', icon: Wallet, tone: 'green', title: 'COD payout received', sub: 'Steadfast ৳52,840 · matched', time: '26 Sep' },
  { group: 'Earlier', icon: Truck, tone: 'red', title: 'Delivery failed #XQ-24790', sub: 'Customer unreachable · reattempt tomorrow', time: '25 Sep' },
  { group: 'Earlier', icon: Users, tone: 'blue', title: 'New staff login', sub: 'Nasir (Inventory) · Chrome, Dhaka', time: '25 Sep' },
]

const CHANNELS = ['In-app', 'Email', 'SMS']
const PREFS = [
  ['New order', [1, 1, 1]], ['New review', [1, 1, 0]], ['Return request', [1, 1, 1]],
  ['Low stock', [1, 1, 0]], ['COD payout', [1, 1, 0]], ['Staff login', [1, 0, 0]],
]

function Box({ on, onClick, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={cx('grid size-4 place-items-center rounded border', on ? 'border-tan bg-tan text-white' : 'border-[#CFC3B5] bg-white')}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </button>
  )
}

function Feed({ items, dismiss }) {
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white">
      {['Today', 'Earlier'].map((g) => {
        const list = items.filter((n) => n.group === g)
        if (!list.length) return null
        return (
          <div key={g}>
            <p className="border-b border-aline bg-asoft px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-amute">{g}</p>
            <ul className="divide-y divide-aline border-b border-aline last:border-b-0">
              {list.map((n) => (
                <li key={n.title} className={cx('flex gap-3.5 px-4 py-3.5', n.unread && 'bg-abg/70')}>
                  <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', TILE[n.tone])}><n.icon className="size-[17px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">{n.title}</p>
                    <p className="text-xs text-amute">{n.sub}</p>
                    {n.unread && <div className="mt-1.5 flex gap-4 text-xs max-sm:hidden"><button className="font-semibold text-tan">View</button><button onClick={() => dismiss(n.title)} className="text-amute">Dismiss</button></div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-amute">{n.time}</span>
                    {n.unread && <span className="size-1.5 rounded-full bg-tan" />}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function Preferences() {
  const [prefs, setPrefs] = useState(PREFS)
  const flip = (r, c) => setPrefs((p) => p.map(([e, v], i) => [e, i === r ? v.map((x, j) => (j === c ? 1 - x : x)) : v]))
  return (
    <Card title="Notification preferences" sub="Where you get alerted">
      <table className="w-full text-[13px]">
        <thead className="text-[11px] uppercase tracking-wider text-amute">
          <tr><th className="pb-2 text-left font-semibold">Event</th>{CHANNELS.map((c) => <th key={c} className="w-14 pb-2 font-semibold normal-case tracking-normal">{c}</th>)}</tr>
        </thead>
        <tbody>
          {prefs.map(([e, v], r) => (
            <tr key={e}>
              <td className="py-2">{e}</td>
              {v.map((on, c) => <td key={c} className="py-2"><div className="grid place-items-center"><Box on={!!on} onClick={() => flip(r, c)} label={`${e} ${CHANNELS[c]}`} /></div></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <Btn>Save preferences</Btn>
    </Card>
  )
}

export default function AdminNotifications() {
  const [items, setItems] = useState(ITEMS)
  const markAll = () => setItems((l) => l.map((n) => ({ ...n, unread: false })))
  const dismiss = (t) => setItems((l) => l.filter((n) => n.title !== t))
  const count = (k) => String(items.filter((n) => n.title.toLowerCase().includes(k)).length)
  return (
    <>
      <PageHead
        title="Notifications"
        sub="Everything that needs your attention, in one place"
        actions={<>
          <Btn v="white" icon={Check} onClick={markAll}><span className="sm:hidden">Mark read</span><span className="max-sm:hidden">Mark all as read</span></Btn>
          <Btn v="white" icon={Settings2} aria-label="Preferences"><span className="max-sm:hidden">Preferences</span></Btn>
        </>}
      />
      <Tabs items={[['All', String(items.length)], ['Orders', count('order')], ['Reviews', count('review')], ['Stock', count('stock')], ['Returns', count('return')], ['System']]} />
      <Two ratio="wide">
        <Col><Feed items={items} dismiss={dismiss} /></Col>
        <Col><Preferences /></Col>
      </Two>
    </>
  )
}
