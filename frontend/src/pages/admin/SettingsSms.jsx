import { useState } from 'react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Badge, Card, PageHead, Field, Select, Textarea, Toggle, cx } from '../../components/admin/ui'

const TEMPLATES = [
  { name: 'Order confirmed', on: true, body: 'Hi {name}, your XERQO order {order_id} (৳{total}) is confirmed. We’ll call before dispatch. Thank you!' },
  { name: 'Shipped', on: true, body: '{name}, order {order_id} is on the way with {courier}. Track: {tracking_link}' },
  { name: 'Out for delivery', on: true, body: 'Your XERQO parcel {order_id} will arrive today. Please keep ৳{cod_amount} ready.' },
  { name: 'Delivered + review request', on: true, body: 'Delivered! Loved your {product}? Rate it in 10 sec & get 50 reward points: {review_link}', delay: 'Sent 2 hours after courier marks the parcel delivered' },
  { name: 'Return approved', on: true, body: 'Return {return_id} approved. Rider will pick up on {date}.' },
  { name: 'Abandoned cart', on: false, body: '{name}, your items are waiting. Complete order: {cart_link}' },
]

const VARS = ['{name}', '{order_id}', '{product}', '{review_link}', '{total}', '{courier}']
const SAMPLE = {
  name: 'Rahim', order_id: 'XQ-24817', product: 'Classic Bifold Wallet', review_link: 'xerqo.com/r/24817', total: '2,600', courier: 'Steadfast',
  tracking_link: 'xerqo.com/t/24817', cod_amount: '2,600', return_id: 'RT-1042', date: '3 Oct', cart_link: 'xerqo.com/c/8812',
}
const fill = (t) => t.replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] ?? m)

const emails = [
  ['Order confirmation email to customer', 'With invoice PDF attached', true],
  ['New order alert to admin', 'orders@xerqo.com', true],
  ['Weekly sales report', 'Every Saturday 9:00 AM', true],
  ['Review request email', 'If customer has an email address', false],
]

function Switch({ on: init, label }) {
  const [on, setOn] = useState(init)
  return <button type="button" aria-label={label} onClick={(e) => { e.stopPropagation(); setOn(!on) }} className="shrink-0"><Toggle on={on} /></button>
}

function Gateway() {
  return (
    <Card title="SMS gateway" right={<Badge tone="green">Connected</Badge>}>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field label="Provider"><Select options={['BulkSMS BD', 'SSL Wireless', 'Alpha SMS']} /></Field>
        <Field label="Sender ID" defaultValue="XERQO" />
      </div>
      <Field label="API key">
        <div className="relative"><input className="ainput pr-16" defaultValue="••••••••••••••••3f9a" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-tan">Reveal</button></div>
      </Field>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-asoft p-3.5">
        <div><p className="text-[11px] text-amute">SMS balance</p><p className="text-base font-bold">4,210 SMS</p></div>
        <Btn v="white" sm>Recharge</Btn>
      </div>
    </Card>
  )
}

function Phone({ text }) {
  return (
    <div className="rounded-[22px] bg-espresso p-3.5 text-white lg:self-start">
      <p className="pb-3 pt-1 text-center text-[11px] font-bold tracking-wider">XERQO</p>
      <div className="rounded-xl bg-white/10 p-3 text-[11px] leading-relaxed">
        <p className="break-words">{text}</p>
        <p className="mt-1.5 text-[9px] text-white/40">Now</p>
      </div>
    </div>
  )
}

export default function AdminSettingsSms() {
  const [sel, setSel] = useState(3)
  const [bodies, setBodies] = useState(() => TEMPLATES.map((t) => t.body))
  const t = TEMPLATES[sel]
  const body = bodies[sel]
  const setBody = (v) => setBodies((b) => b.map((x, i) => (i === sel ? v : x)))

  return (
    <>
      <PageHead title="Settings" sub="Customer SMS, email templates and SMS gateway" actions={<Btn>Save changes</Btn>} />
      <SettingsShell>
        <Gateway />

        <Card title="Customer SMS templates" sub="Sent automatically when the order status changes" bodyClass="space-y-2.5!">
          {TEMPLATES.map((tp, i) => (
            <div key={tp.name} role="button" tabIndex={0} onClick={() => setSel(i)} onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
              className={cx('flex cursor-pointer items-center gap-3 rounded-xl border p-3 sm:px-3.5', sel === i ? 'border-tan ring-1 ring-tan' : 'border-aline hover:border-tan/40')}>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{tp.name}</p><p className="text-[11px] text-amute">{bodies[i]}</p></div>
              <Switch on={tp.on} label={tp.name} />
            </div>
          ))}
        </Card>

        <Card title={`Edit template · ${t.name}`} sub={t.delay || 'Sent instantly when the status changes'}>
          <div className="grid gap-4 lg:grid-cols-[1fr_200px] lg:gap-x-5">
            <div className="min-w-0 space-y-3.5 lg:col-start-1">
              <Field label="Message" help={`${body.length} / 160 characters · ${Math.max(1, Math.ceil(body.length / 160))} SMS`}>
                <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} className="ainput resize-y border-tan leading-relaxed" />
              </Field>
              <div className="space-y-2">
                <p className="text-xs font-semibold">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARS.map((v) => <button key={v} type="button" onClick={() => setBody(`${body} ${v}`)} className="rounded-md bg-tan/10 px-2 py-1 text-[11px] font-medium text-tan hover:bg-tan/20">{v}</button>)}
                </div>
              </div>
              <div className="grid gap-3.5 md:grid-cols-2">
                <Field label="Send delay"><Select options={['2 hours after delivered', 'Immediately', '1 day after delivered']} /></Field>
                <Field label="Language"><Select options={['English', 'বাংলা']} /></Field>
              </div>
            </div>
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1"><Phone text={fill(body)} /></div>
            <div className="flex gap-2.5 lg:col-start-1"><Btn v="white">Send test SMS</Btn><Btn>Save template</Btn></div>
          </div>
        </Card>

        <Card title="Email notifications">
          {emails.map(([l, s, on]) => (
            <div key={l} className="flex items-center gap-3">
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{l}</p><p className="text-[11px] text-amute">{s}</p></div>
              <Switch on={on} label={l} />
            </div>
          ))}
        </Card>
      </SettingsShell>
    </>
  )
}
