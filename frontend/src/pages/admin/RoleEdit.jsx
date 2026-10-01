import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { PERMISSIONS, roles as baseRoles } from '../../data/admin'
import { Btn, Badge, Card, PageHead, Field, Select, Textarea, Toggle, Avatar, Two, Col, cx } from '../../components/admin/ui'
import { ROLES, TEAM, STATUS } from './Staff'

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Export']

// Default grants per role: module -> actions string (V C E D X)
const PRESETS = {
  'order-manager': { Dashboard: 'V', Orders: 'VCEX', Returns: 'VCE', Shipments: 'VCE', Products: 'V', Categories: 'V', Inventory: 'V', Customers: 'VE', Reviews: 'V', 'Payments & COD': 'V', Reports: 'VX' },
  'store-manager': Object.fromEntries(PERMISSIONS.filter((p) => p !== 'Staff & Roles').map((p) => [p, p === 'Settings' ? 'V' : 'VCED'])),
  'customer-support': { Dashboard: 'V', Orders: 'V', Returns: 'VE', Customers: 'VE', Reviews: 'VCE' },
  'content-editor': { Dashboard: 'V', Products: 'VCE', Categories: 'VCE', 'Content & Banners': 'VCED', Coupons: 'V' },
  warehouse: { Dashboard: 'V', Orders: 'V', Shipments: 'VCE', Inventory: 'VE', Products: 'V' },
}
const KEY = { V: 'View', C: 'Create', E: 'Edit', D: 'Delete', X: 'Export' }

function initialMatrix(id) {
  const preset = id === 'super-admin' ? Object.fromEntries(PERMISSIONS.map((p) => [p, 'VCEDX'])) : PRESETS[id] || PRESETS['order-manager']
  return Object.fromEntries(PERMISSIONS.map((m) => [m, Object.fromEntries(ACTIONS.map((a) => [a, [...(preset[m] || '')].some((k) => KEY[k] === a)]))]))
}

const special = [
  ['See full customer phone numbers', true],
  ['Change order price / add discount', false],
  ['Issue refunds (max ৳5,000)', true],
  ['Book & cancel courier', true],
  ['Export customer data', false],
]

const audit = [
  ['Dip enabled “Issue refunds”', '12 Sep, 4:10 PM'],
  ['Dip removed “Delete orders”', '12 Sep, 4:08 PM'],
  ['Role created from Store Manager', '2 Aug, 11:30 AM'],
]

function Box({ on, onClick, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={cx('grid size-[18px] place-items-center rounded border transition', on ? 'border-tan bg-tan text-white' : 'border-[#CFC3B5] bg-white hover:border-tan')}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </button>
  )
}

function Matrix({ m, toggle }) {
  return (
    <div className="overflow-x-auto max-md:hidden">
      <table className="w-full text-[13px]">
        <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
          <tr>
            <th className="px-4 py-3 font-semibold">Module</th>
            {ACTIONS.map((a) => <th key={a} className="w-[13%] px-2 py-3 text-center font-semibold">{a}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-aline border-b border-aline">
          {PERMISSIONS.map((mod) => (
            <tr key={mod} className="hover:bg-abg/60">
              <td className="px-4 py-2.5 font-medium">{mod}</td>
              {ACTIONS.map((a) => <td key={a} className="px-2 py-2.5"><div className="grid place-items-center"><Box on={m[mod][a]} onClick={() => toggle(mod, a)} label={`${mod} ${a}`} /></div></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModuleCards({ m, toggle }) {
  return (
    <div className="divide-y divide-aline md:hidden">
      {PERMISSIONS.map((mod) => {
        const n = ACTIONS.filter((a) => m[mod][a]).length
        return (
          <div key={mod} className="space-y-2 py-3 first:pt-0">
            <div className="flex items-center justify-between text-[13px]">
              <p className="font-semibold">{mod}</p>
              <span className={cx('text-xs', n ? 'font-semibold text-ok' : 'text-amute')}>{n ? `${n} of ${ACTIONS.length}` : 'No access'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACTIONS.map((a) => (
                <button key={a} type="button" aria-pressed={m[mod][a]} onClick={() => toggle(mod, a)}
                  className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium', m[mod][a] ? 'bg-tan/15 font-semibold text-tan' : 'bg-asoft text-amute')}>
                  {m[mod][a] && <Check className="size-3" strokeWidth={3} />}{a}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SpecialRow({ label, on: init }) {
  const [on, setOn] = useState(init)
  return (
    <button type="button" onClick={() => setOn(!on)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-[13px] first:pt-0 last:pb-0">
      {label}<Toggle on={on} />
    </button>
  )
}

export default function AdminRoleEdit() {
  const { id = 'order-manager' } = useParams()
  const base = baseRoles.find((r) => r.id === id)
  const role = ROLES.find((r) => r.id === id) || (base && { id, name: base.name, desc: base.desc, members: [] }) || ROLES[2]
  const [m, setM] = useState(() => initialMatrix(role.id))
  const toggle = (mod, a) => setM((p) => ({ ...p, [mod]: { ...p[mod], [a]: !p[mod][a] } }))
  const selectAll = () => setM(Object.fromEntries(PERMISSIONS.map((mod) => [mod, Object.fromEntries(ACTIONS.map((a) => [a, true]))])))
  const members = TEAM.filter((t) => t.role === role.id)
  const n = role.members.length

  return (
    <>
      <Link to="/admin/staff" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-4" />Staff & roles</Link>
      <PageHead
        title={role.name}
        extra={<Badge tone={role.locked ? 'tan' : 'green'}>{role.locked ? 'System role' : 'Custom role'}</Badge>}
        sub={`${n} member${n === 1 ? '' : 's'} · last edited by Dip, 12 Sep`}
        actions={<><Btn v="white" to="/admin/staff">Cancel</Btn><Btn>Save role</Btn></>}
      />
      <Two ratio="main">
        <Col>
          <Card title="Role details">
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Role name" defaultValue={role.name} />
              <Field label="Based on"><Select defaultValue="Store Manager" options={ROLES.map((r) => r.name)} /></Field>
            </div>
            <Field label="Description"><Textarea rows={2} defaultValue="Handles orders, returns and courier bookings. No access to pricing or staff." /></Field>
          </Card>
          <Card title="Permissions" sub="Tick what this role can do in each module" right={<button type="button" onClick={selectAll} className="text-xs font-semibold text-tan">Select all</button>}>
            <Matrix m={m} toggle={toggle} />
            <ModuleCards m={m} toggle={toggle} />
          </Card>
        </Col>
        <Col>
          <Card title="Special permissions" bodyClass="space-y-0! divide-y divide-aline">
            {special.map(([l, on]) => <SpecialRow key={l} label={l} on={on} />)}
          </Card>
          <Card title="Members with this role" right={<button className="text-xs font-semibold text-tan">+ Add</button>}>
            {members.length ? members.map((t) => (
              <div key={t.email} className="flex items-center gap-2.5">
                <Avatar name={t.name} />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{t.name}</p><p className="truncate text-[11px] text-amute">{t.email}</p></div>
                <Badge tone={STATUS[t.status]}>{t.status}</Badge>
              </div>
            )) : <p className="text-[13px] text-amute">No members yet.</p>}
          </Card>
          <Card title="Audit log">
            {audit.map(([t, d]) => <div key={t}><p className="text-[13px]">{t}</p><p className="mt-0.5 text-[11px] text-amute">{d}</p></div>)}
          </Card>
        </Col>
      </Two>
    </>
  )
}
