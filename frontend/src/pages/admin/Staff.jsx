import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, Mail, Plus, Shield, Trash2 } from 'lucide-react'
import { Avatar, Badge, Btn, Card, Col, PageHead, Select, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, Spin, SwitchRow, TextInput } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const TONES = ['tan', 'blue', 'green', 'purple', 'teal', 'amber']
const TILE = { tan: 'bg-tan/12 text-tan', blue: 'bg-info/12 text-info', green: 'bg-ok/12 text-ok', purple: 'bg-violet/12 text-violet', teal: 'bg-teal/12 text-teal', amber: 'bg-amber/12 text-amber' }
export const roleTone = (role) => (role?.slug === 'super-admin' ? 'tan' : TONES[((role?.id ?? 0) % (TONES.length - 1)) + 1])

// Active / Invited (never signed in) / Disabled
export const memberStatus = (m) => (!m.is_active ? ['Disabled', 'red'] : !m.last_login_at ? ['Invited', 'blue'] : ['Active', 'green'])

function RoleCard({ r, members }) {
  const tone = roleTone(r)
  const locked = r.slug === 'super-admin'
  return (
    <div className="flex flex-col rounded-xl border border-aline bg-white p-4 sm:p-[18px]">
      <div className="flex items-center gap-3">
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', TILE[tone])}><Shield className="size-4" /></span>
        <p className="flex-1 text-[15px] font-bold">{r.name}</p>
        <span className="text-xs text-amute">{r.users_count} member{r.users_count === 1 ? '' : 's'}</span>
      </div>
      <p className="mt-2.5 text-xs text-amute">{r.description || (locked ? 'Full access, including the SMS gateway and wallet' : 'Custom role')}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex -space-x-1.5">
          {members.slice(0, 4).map((m) => <span key={m.id} title={m.name} className="rounded-full ring-2 ring-white"><Avatar name={m.name} size={22} tone={tone} /></span>)}
        </div>
        {locked
          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-amute"><Lock className="size-3" />Locked</span>
          : <Link to={`/admin/staff/roles/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-tan">Edit permissions <ArrowRight className="size-3.5" /></Link>}
      </div>
    </div>
  )
}

function roleOptions(roles, isSuperAdmin) {
  return roles.filter((r) => isSuperAdmin || r.slug !== 'super-admin').map((r) => ({ value: String(r.id), label: r.name }))
}

function InviteCard({ roles }) {
  const { isSuperAdmin } = useAdminAuth()
  const empty = { name: '', email: '', phone: '', role_id: '', password: '' }
  const [f, setF] = useState(empty)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation((body) => adminApi.post('/admin/staff', body), {
    invalidate: ['staff', 'roles'], success: (res) => res.message, onSuccess: () => setF(empty),
  })
  const err = save.error?.fields ?? {}
  return (
    <Card title="Invite a team member" sub="Leave the password empty and they get an email to set their own">
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); save.mutate({ ...f, role_id: f.role_id ? Number(f.role_id) : null, phone: f.phone || null, password: f.password || null }) }}>
        <div className="grid gap-3.5 md:grid-cols-3">
          <FormField label="Full name" error={err.name}><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Rakib Hasan" maxLength={100} /></FormField>
          <FormField label="Email" error={err.email}><TextInput type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@xerqo.com" /></FormField>
          <FormField label="Mobile (optional)" error={err.phone}><TextInput value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" /></FormField>
        </div>
        <div className="grid gap-3.5 md:grid-cols-2">
          <FormField label="Role" error={err.role_id}><Select value={f.role_id} onChange={(role_id) => set({ role_id })} options={roleOptions(roles, isSuperAdmin)} placeholder="Choose a role" search={false} /></FormField>
          <FormField label="Password (optional)" error={err.password} help="Only if you want to hand it over yourself — at least 8 characters">
            <TextInput type="password" autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} />
          </FormField>
        </div>
        <Btn type="submit" icon={f.password ? Plus : Mail} disabled={save.isPending} className="max-sm:w-full">{save.isPending && <Spin />}{f.password ? 'Add member' : 'Send invite'}</Btn>
      </form>
    </Card>
  )
}

function MemberCard({ m, roles, onClose }) {
  const { user, isSuperAdmin, can } = useAdminAuth()
  const self = user?.id === m.id
  const protectedSuper = m.role?.slug === 'super-admin' && !isSuperAdmin
  const canEdit = can('staff', 'edit') && !protectedSuper
  const [f, setF] = useState({ name: m.name, email: m.email, phone: m.phone ?? '', role_id: String(m.role?.id ?? ''), is_active: m.is_active, password: '' })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation((body) => adminApi.put(`/admin/staff/${m.id}`, body), { invalidate: ['staff', 'roles'], success: 'Member updated', onSuccess: () => set({ password: '' }) })
  const err = save.error?.fields ?? {}
  const [status] = memberStatus(m)

  const remove = async () => {
    const done = await confirmAndRun({ title: `Remove ${m.name}?`, text: 'They lose access to the admin panel straight away.', confirmText: 'Remove', danger: true }, () => adminApi.del(`/admin/staff/${m.id}`))
    if (done) { toast.success('Staff member removed'); save.reset(); onClose(true) }
  }
  const resend = async () => {
    try { toast.success((await adminApi.post(`/admin/staff/${m.id}/invite`)).message) } catch (e) { toast.error(e.message) }
  }

  return (
    <Card title={m.name} sub={`${status} · ${m.last_login_at ? `last signed in ${ago(m.last_login_at)}` : 'has not signed in yet'}`} right={<button type="button" onClick={() => onClose()} className="text-xs font-semibold text-amute hover:text-ink">Close</button>}>
      {protectedSuper && <p className="rounded-lg bg-asoft px-3.5 py-2.5 text-xs text-amute">Only a Super Admin can change another Super Admin.</p>}
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); save.mutate({ ...f, role_id: Number(f.role_id), phone: f.phone || null, password: f.password || null }) }}>
        <FormField label="Full name" error={err.name}><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} disabled={!canEdit} /></FormField>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="Email" error={err.email}><TextInput type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} disabled={!canEdit} /></FormField>
          <FormField label="Mobile" error={err.phone}><TextInput value={f.phone} onChange={(e) => set({ phone: e.target.value })} disabled={!canEdit} /></FormField>
        </div>
        <FormField label="Role" error={err.role_id} help={self ? 'You can’t change your own role' : undefined}>
          <Select value={f.role_id} onChange={(role_id) => set({ role_id })} options={roleOptions(roles, isSuperAdmin)} search={false} disabled={!canEdit || self} />
        </FormField>
        <FormField label="New password" error={err.password} help="Leave empty to keep the current one">
          <TextInput type="password" autoComplete="new-password" value={f.password} onChange={(e) => set({ password: e.target.value })} disabled={!canEdit} />
        </FormField>
        <SwitchRow label="Can sign in" sub={f.is_active ? 'Active' : 'Disabled — signed out everywhere'} checked={f.is_active} onChange={(is_active) => set({ is_active })} disabled={!canEdit || self} />
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Btn type="submit" disabled={save.isPending}>{save.isPending && <Spin />}Save</Btn>
            {!m.last_login_at && can('staff', 'create') && <Btn type="button" v="white" icon={Mail} onClick={resend}>Resend invite</Btn>}
            {!self && can('staff', 'delete') && <button type="button" onClick={remove} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-bad hover:bg-bad/10"><Trash2 className="size-3.5" />Remove</button>}
          </div>
        )}
      </form>
    </Card>
  )
}

function TeamList({ staff, sel, onSelect }) {
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white">
      <div className="divide-y divide-aline">
        {staff.map((m) => {
          const [label, tone] = memberStatus(m)
          return (
            <button key={m.id} type="button" onClick={() => onSelect(m.id)} className={cx('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-abg/60', sel === m.id && 'bg-asoft')}>
              <Avatar name={m.name || '?'} />
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{m.name}</p><p className="truncate text-[11px] text-amute">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p></div>
              <span className="max-sm:hidden"><Badge tone={roleTone(m.role)}>{m.role?.name ?? '—'}</Badge></span>
              <Badge tone={tone}>{label}</Badge>
              <span className="w-20 text-right text-[11px] text-amute max-lg:hidden">{m.last_login_at ? ago(m.last_login_at) : '—'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminStaff() {
  const { can } = useAdminAuth()
  const rolesQ = useAdminList('roles')
  const staffQ = useAdminList('staff')
  const [sel, setSel] = useState(null)
  const roles = rolesQ.data?.data ?? []
  const staff = staffQ.data?.data ?? []
  const current = staff.find((m) => m.id === sel)
  const active = staff.filter((m) => m.is_active).length

  return (
    <>
      <PageHead
        title="Staff & roles"
        sub={staffQ.data ? `${staff.length} team member${staff.length === 1 ? '' : 's'} (${active} active) · ${roles.length} roles` : 'Loading…'}
        actions={can('staff', 'create') && <Btn v="white" icon={Shield} to="/admin/staff/roles/new"><span className="sm:hidden">Role</span><span className="max-sm:hidden">Create role</span></Btn>}
      />
      {rolesQ.isPending || staffQ.isPending ? <LoadingBlock /> : <>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Roles</h2>
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((r) => <RoleCard key={r.id} r={r} members={staff.filter((m) => m.role?.id === r.id)} />)}
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Team members</h2>
          <Two ratio="main">
            <Col>{staff.length ? <TeamList staff={staff} sel={sel} onSelect={setSel} /> : <EmptyBlock title="No staff yet" />}</Col>
            <Col>
              {current
                ? <MemberCard key={`${current.id}-${current.role?.id}-${current.is_active}-${current.name}`} m={current} roles={roles} onClose={() => setSel(null)} />
                : can('staff', 'create') ? <InviteCard roles={roles} /> : <Card title="Team member"><p className="text-[13px] text-amute">Select someone to see their details.</p></Card>}
            </Col>
          </Two>
        </section>
        {current && can('staff', 'create') && <InviteCard roles={roles} />}
      </>}
    </>
  )
}
