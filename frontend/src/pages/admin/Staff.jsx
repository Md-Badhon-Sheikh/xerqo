import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Shield, ArrowRight, Check, MoreHorizontal } from 'lucide-react'
import { Btn, Badge, Card, PageHead, Field, Select, Toggle, Avatar, cx } from '../../components/admin/ui'

// Role + team demo data (shared with RoleEdit)
export const ROLES = [
  { id: 'super-admin', name: 'Super Admin', desc: 'Full access to everything', members: ['Dip Hossain'], tone: 'tan', locked: true },
  { id: 'store-manager', name: 'Store Manager', desc: 'All except staff & billing', members: ['Arif Chowdhury', 'Nasir Ahmed'], tone: 'blue' },
  { id: 'order-manager', name: 'Order Manager', desc: 'Orders, returns, shipping', members: ['Sabbir Rahman', 'Jamal Uddin', 'Rakib Hasan'], tone: 'green', avatars: 2 },
  { id: 'customer-support', name: 'Customer Support', desc: 'Orders (view), customers, reviews', members: ['Nabila Akter', 'Sumaiya Khan'], tone: 'purple', avatars: 1 },
  { id: 'content-editor', name: 'Content Editor', desc: 'Products, banners, blog', members: ['Mitu Das'], tone: 'teal' },
  { id: 'warehouse', name: 'Warehouse / Packer', desc: 'Packing list, stock, labels', members: ['Rakib Hasan', 'Selim Mia'], tone: 'amber', avatars: 1 },
]
export const roleById = (id) => ROLES.find((r) => r.id === id)

export const TEAM = [
  { name: 'Dip Hossain', email: 'dip@xerqo.com', role: 'super-admin', status: 'Active', tfa: true, last: 'Now' },
  { name: 'Nabila Akter', email: 'nabila@xerqo.com', role: 'customer-support', status: 'Active', tfa: true, last: '5 min ago' },
  { name: 'Sabbir Rahman', email: 'sabbir@xerqo.com', role: 'order-manager', status: 'Active', tfa: true, last: '1 h ago' },
  { name: 'Mitu Das', email: 'mitu@xerqo.com', role: 'content-editor', status: 'Active', tfa: false, last: 'Yesterday' },
  { name: 'Rakib Hasan', email: 'rakib@xerqo.com', role: 'warehouse', status: 'Invited', tfa: false, last: '—' },
  { name: 'Jamal Uddin', email: 'jamal@xerqo.com', role: 'order-manager', status: 'Suspended', tfa: false, last: '12 Sep' },
]
export const STATUS = { Active: 'green', Invited: 'blue', Suspended: 'red' }

const TILE = { tan: 'bg-tan/12 text-tan', blue: 'bg-info/12 text-info', green: 'bg-ok/12 text-ok', purple: 'bg-violet/12 text-violet', teal: 'bg-teal/12 text-teal', amber: 'bg-amber/12 text-amber' }

export const RoleBadge = ({ id }) => {
  const r = roleById(id)
  return <Badge tone={r.tone}>{r.name}</Badge>
}

function RoleCard({ r }) {
  const n = r.members.length
  return (
    <div className="flex flex-col rounded-xl border border-aline bg-white p-4 sm:p-[18px]">
      <div className="flex items-center gap-3">
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', TILE[r.tone])}><Shield className="size-4" /></span>
        <p className="flex-1 text-[15px] font-bold">{r.name}</p>
        <span className="text-xs text-amute">{n} member{n > 1 && 's'}</span>
      </div>
      <p className="mt-2.5 text-xs text-amute">{r.desc}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex -space-x-1.5">
          {r.members.slice(0, r.avatars ?? 1).map((m) => <span key={m} className="rounded-full ring-2 ring-white"><Avatar name={m} size={22} tone={r.tone} /></span>)}
        </div>
        {r.locked
          ? <span className="text-xs font-semibold text-amute">Locked</span>
          : <Link to={`/admin/staff/roles/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-tan">Edit permissions <ArrowRight className="size-3.5" /></Link>}
      </div>
    </div>
  )
}

const th = 'whitespace-nowrap px-4 py-3 font-semibold'

function TeamTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white max-sm:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>
              <th className={th}>Member</th><th className={th}>Role</th><th className={th}>Status</th>
              <th className={`${th} max-lg:hidden`}>2FA</th><th className={`${th} max-md:hidden`}>Last active</th><th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {TEAM.map((m) => (
              <tr key={m.email} className="hover:bg-abg/60">
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={m.name} /><div className="min-w-0"><p className="font-semibold">{m.name}</p><p className="text-[11px] text-amute">{m.email}</p></div></div></td>
                <td className="px-4 py-3"><RoleBadge id={m.role} /></td>
                <td className="px-4 py-3"><Badge tone={STATUS[m.status]}>{m.status}</Badge></td>
                <td className="px-4 py-3 max-lg:hidden">{m.tfa ? <span className="inline-flex items-center gap-1 font-semibold text-ok"><Check className="size-3.5" />On</span> : <span className="text-amute">Off</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-amute max-md:hidden">{m.last}</td>
                <td className="pr-4 text-right"><button aria-label="More"><MoreHorizontal className="size-4 text-amute" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeamCards() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {TEAM.map((m) => (
        <div key={m.email} className="space-y-2.5 rounded-xl border border-aline bg-white p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{m.name}</p><p className="truncate text-[11px] text-amute">{m.email}</p></div>
            <Badge tone={STATUS[m.status]}>{m.status}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2"><RoleBadge id={m.role} /><span className="text-[11px] text-amute">Last active: {m.last}</span></div>
        </div>
      ))}
    </div>
  )
}

function Invite() {
  const [tfa, setTfa] = useState(true)
  return (
    <Card title="Invite a team member" sub="They get an email + SMS to set a password">
      <div className="grid gap-3.5 md:grid-cols-3">
        <Field label="Full name" placeholder="e.g. Rakib Hasan" />
        <Field label="Email" type="email" placeholder="name@xerqo.com" />
        <Field label="Mobile" placeholder="01XXXXXXXXX" />
      </div>
      <div className="grid gap-3.5 md:grid-cols-2">
        <Field label="Role"><Select defaultValue="Order Manager" options={ROLES.map((r) => r.name)} /></Field>
        <Field label="Branch / warehouse"><Select options={['Dhanmondi HQ', 'Mirpur warehouse', 'Chattogram hub']} /></Field>
      </div>
      <button type="button" onClick={() => setTfa(!tfa)} className="flex items-center gap-2.5 text-[13px]"><Toggle on={tfa} />Require 2-step verification</button>
      <Btn className="max-sm:w-full">Send invite</Btn>
    </Card>
  )
}

export default function AdminStaff() {
  return (
    <>
      <PageHead
        title="Staff & roles"
        sub="11 team members · 6 roles · 2FA enforced for admins"
        actions={<>
          <Btn v="white" icon={Shield}><span className="sm:hidden">Roles</span><span className="max-sm:hidden">Create role</span></Btn>
          <Btn icon={Plus}><span className="sm:hidden">Invite</span><span className="max-sm:hidden">Invite staff</span></Btn>
        </>}
      />
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Roles</h2>
        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">{ROLES.map((r) => <RoleCard key={r.id} r={r} />)}</div>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Team members</h2>
        <TeamTable />
        <TeamCards />
      </section>
      <Invite />
    </>
  )
}
