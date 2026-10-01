import { useState } from 'react'
import { Monitor, Tablet, Smartphone, Download } from 'lucide-react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Badge, Card, PageHead, Field, Select, Check, Toggle, cx } from '../../components/admin/ui'

const protection = [
  ['Require 2-step verification for all staff', 'OTP via SMS or authenticator app', true],
  ['Lock account after 5 failed attempts', 'Locked for 15 minutes · owner gets an alert', true],
  ['Restrict admin to allowed IPs', 'Office & home IPs only', false],
  ['Auto logout after inactivity', '30 minutes', true],
]

const sessions = [
  { icon: Monitor, name: 'Chrome · macOS', sub: 'Dhaka · 103.xx.xx.12 · this device', current: true },
  { icon: Tablet, name: 'Safari · iPadOS', sub: 'Dhaka · 2 h ago' },
  { icon: Smartphone, name: 'Chrome · Android', sub: 'Chattogram · yesterday' },
]

const log = [
  { user: 'Dip Hossain', role: 'Super Admin', action: 'Changed delivery charge Outside Dhaka ৳110 → ৳120', ip: '103.xx.xx.12', time: 'Today 11:42' },
  { user: 'Nasir', role: 'Inventory', action: 'Stock adjusted Zip Long Wallet +24', ip: '103.xx.xx.40', time: 'Today 11:20' },
  { user: 'Sumaiya', role: 'Support', action: 'Approved return RT-1041', ip: '37.xx.xx.8', time: 'Yesterday' },
  { user: 'Rakib', role: 'Order Manager', action: 'Order #XQ-24790 marked Failed', ip: '103.xx.xx.40', time: '25 Sep' },
  { user: 'Unknown', role: '—', action: 'Failed login ×5 · account locked 15 min', ip: '45.xx.xx.201', time: '24 Sep', bad: true },
]

function Switch({ label, sub, on: init }) {
  const [on, setOn] = useState(init)
  return (
    <button type="button" onClick={() => setOn(!on)} className="flex w-full items-center gap-3 text-left">
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium">{label}</span><span className="block text-[11px] text-amute">{sub}</span></span>
      <Toggle on={on} />
    </button>
  )
}

function ActivityLog() {
  return (
    <Card title="Activity log" sub="Every admin action is recorded · kept 12 months"
      right={<Btn v="white" sm icon={Download} aria-label="Export"><span className="max-sm:hidden">Export</span></Btn>}>
      <div className="overflow-hidden rounded-xl border border-aline max-sm:hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr><th className="px-3.5 py-3 font-semibold">User</th><th className="px-3.5 py-3 font-semibold">Action</th><th className="px-3.5 py-3 font-semibold max-lg:hidden">IP</th><th className="px-3.5 py-3 font-semibold">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {log.map((l) => (
              <tr key={l.action}>
                <td className="px-3.5 py-3"><p className={cx('whitespace-nowrap font-semibold', l.bad && 'text-bad')}>{l.user}</p><p className="text-[11px] text-amute">{l.role}</p></td>
                <td className="px-3.5 py-3">{l.action}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-amute max-lg:hidden">{l.ip}</td>
                <td className="whitespace-nowrap px-3.5 py-3 text-amute">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-aline sm:hidden">
        {log.map((l) => (
          <div key={l.action} className="space-y-1 py-3 first:pt-0">
            <div className="flex justify-between gap-2 text-xs"><b className={cx('font-semibold', l.bad && 'text-bad')}>{l.user} · {l.role}</b><span className="shrink-0 text-amute">{l.time}</span></div>
            <p className="text-[13px]">{l.action}</p>
            <p className="text-[11px] text-amute">IP {l.ip}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function AdminSettingsSecurity() {
  return (
    <>
      <PageHead title="Settings" sub="Login protection, password policy and audit trail" actions={<Btn>Save changes</Btn>} />
      <SettingsShell>
        <Card title="Login protection">
          {protection.map(([l, s, on]) => <Switch key={l} label={l} sub={s} on={on} />)}
        </Card>

        <Card title="Password policy">
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Minimum length"><Select options={['10 characters', '8 characters', '12 characters']} /></Field>
            <Field label="Force change every"><Select options={['90 days', '30 days', '180 days', 'Never']} /></Field>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {['Uppercase', 'Number', 'Symbol', 'Not same as last 3'].map((c) => <Check key={c} on label={c} />)}
          </div>
        </Card>

        <Card title="Active sessions" right={<button className="text-xs font-semibold text-bad">Log out all others</button>}>
          <div className="divide-y divide-aline">
            {sessions.map(({ icon: I, name, sub, current }) => (
              <div key={name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-asoft text-amute"><I className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{name}</p><p className="truncate text-[11px] text-amute">{sub}</p></div>
                {current ? <Badge tone="green">Current</Badge> : <button className="text-xs font-semibold text-bad">Revoke</button>}
              </div>
            ))}
          </div>
        </Card>

        <ActivityLog />

        <section className="rounded-xl border border-bad/40 bg-white p-4 sm:p-5">
          <h3 className="mb-4 text-base font-semibold">Danger zone</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1"><p className="text-[13px] font-semibold">Transfer store ownership</p><p className="text-[11px] text-amute">Only the Super Admin can do this · requires OTP</p></div>
            <Btn v="danger" className="self-start sm:self-auto">Transfer</Btn>
          </div>
        </section>
      </SettingsShell>
    </>
  )
}
