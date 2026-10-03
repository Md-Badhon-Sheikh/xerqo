import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Trash2 } from 'lucide-react'
import { Avatar, Badge, Btn, Card, Col, PageHead, Select, Textarea, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, Spin, TextInput } from '../../components/admin/form'
import { fmtDateTime } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'
import { memberStatus } from './Staff'

const LABEL = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' }
// what each action means in practice, shown under the matrix
const HINT = 'View opens the page. Create adds new records, Edit changes them (status, verify payments, settings), Delete removes them. Anything other than View also needs View.'

function Box({ on, onClick, label, disabled }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick} disabled={disabled}
      className={cx('grid size-[18px] place-items-center rounded border transition disabled:opacity-50', on ? 'border-tan bg-tan text-white' : 'border-[#CFC3B5] bg-white hover:border-tan')}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </button>
  )
}

function Matrix({ modules, actions, perms, toggle, toggleRow, toggleCol, readOnly }) {
  const has = (m, a) => (perms[m] ?? []).includes(a)
  return (
    <>
      <div className="overflow-x-auto max-md:hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>
              <th className="px-4 py-3 font-semibold">Module</th>
              {actions.map((a) => (
                <th key={a} className="w-[14%] px-2 py-3 text-center font-semibold">
                  <button type="button" disabled={readOnly} onClick={() => toggleCol(a)} className="uppercase hover:text-ink disabled:hover:text-amute" title={`Toggle ${LABEL[a]} for every module`}>{LABEL[a]}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-aline border-b border-aline">
            {modules.map(({ key, label }) => (
              <tr key={key} className="hover:bg-abg/60">
                <td className="px-4 py-2.5 font-medium"><button type="button" disabled={readOnly} onClick={() => toggleRow(key)} className="text-left hover:text-tan disabled:hover:text-ink" title="Toggle the whole row">{label}</button></td>
                {actions.map((a) => <td key={a} className="px-2 py-2.5"><div className="grid place-items-center"><Box on={has(key, a)} disabled={readOnly} onClick={() => toggle(key, a)} label={`${label} ${LABEL[a]}`} /></div></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-aline md:hidden">
        {modules.map(({ key, label }) => {
          const n = actions.filter((a) => has(key, a)).length
          return (
            <div key={key} className="space-y-2 py-3 first:pt-0">
              <div className="flex items-center justify-between text-[13px]">
                <p className="font-semibold">{label}</p>
                <span className={cx('text-xs', n ? 'font-semibold text-ok' : 'text-amute')}>{n ? `${n} of ${actions.length}` : 'No access'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {actions.map((a) => (
                  <button key={a} type="button" disabled={readOnly} aria-pressed={has(key, a)} onClick={() => toggle(key, a)}
                    className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium', has(key, a) ? 'bg-tan/15 font-semibold text-tan' : 'bg-asoft text-amute')}>
                    {has(key, a) && <Check className="size-3" strokeWidth={3} />}{LABEL[a]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-amute">{HINT}</p>
    </>
  )
}

function RoleForm({ role, roles, matrix, members }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = useAdminAuth()
  const isNew = !role
  const locked = role?.slug === 'super-admin'
  const readOnly = locked || !can('staff', isNew ? 'create' : 'edit')
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [perms, setPerms] = useState(() => (role ? { ...role.permissions } : { dashboard: ['view'] }))
  const [copyFrom, setCopyFrom] = useState('')
  const { modules, actions } = matrix

  const setActions = (mod, list) => setPerms((p) => {
    // anything beyond View needs View, and removing View removes everything
    let next = actions.filter((a) => list.includes(a))
    if (next.some((a) => a !== 'view') && !next.includes('view')) next = ['view', ...next]
    return { ...p, [mod]: next }
  })
  const toggle = (mod, a) => {
    const cur = perms[mod] ?? []
    if (cur.includes(a)) setActions(mod, a === 'view' ? [] : cur.filter((x) => x !== a))
    else setActions(mod, [...cur, a])
  }
  const toggleRow = (mod) => setActions(mod, (perms[mod] ?? []).length === actions.length ? [] : actions)
  const toggleCol = (a) => {
    const all = modules.every((m) => (perms[m.key] ?? []).includes(a))
    setPerms((p) => Object.fromEntries(modules.map(({ key }) => {
      const cur = p[key] ?? []
      let next = all ? (a === 'view' ? [] : cur.filter((x) => x !== a)) : [...new Set([...cur, a])]
      if (next.some((x) => x !== 'view') && !next.includes('view')) next = ['view', ...next]
      return [key, actions.filter((x) => next.includes(x))]
    })))
  }
  const selectAll = () => setPerms(Object.fromEntries(modules.map(({ key }) => [key, [...actions]])))
  const clearAll = () => setPerms({})
  const copy = (id) => {
    setCopyFrom(id)
    const src = roles.find((r) => String(r.id) === id)
    if (src) { setPerms({ ...src.permissions }); toast.info(`Copied permissions from ${src.name}`) }
  }

  const save = useAdminMutation((body) => (isNew ? adminApi.post('/admin/roles', body) : adminApi.put(`/admin/roles/${role.id}`, body)), {
    invalidate: ['roles', 'staff'], success: isNew ? 'Role created' : 'Role saved',
    onSuccess: async (res) => {
      if (!isNew) return
      // put the new role in the cached list first, so its page can find it right away
      qc.setQueryData(['admin', 'roles', {}], (old) => old && { ...old, data: [...old.data, res.data] })
      navigate(`/admin/staff/roles/${res.data.id}`, { replace: true })
    },
  })
  const err = save.error?.fields ?? {}
  const submit = () => {
    const clean = Object.fromEntries(Object.entries(perms).filter(([, list]) => list.length))
    save.mutate({ name, description: description || null, permissions: clean })
  }
  const remove = async () => {
    const done = await confirmAndRun({ title: `Delete the ${role.name} role?`, text: 'This cannot be undone.', confirmText: 'Delete', danger: true }, () => adminApi.del(`/admin/roles/${role.id}`))
    if (done) { toast.success('Role deleted'); navigate('/admin/staff') }
  }
  const granted = Object.values(perms).reduce((n, list) => n + list.length, 0)

  return (
    <>
      <Link to="/admin/staff" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-4" />Staff & roles</Link>
      <PageHead
        title={isNew ? 'New role' : role.name}
        extra={!isNew && <Badge tone={role.is_system ? 'tan' : 'green'}>{role.is_system ? 'Built-in role' : 'Custom role'}</Badge>}
        sub={isNew ? 'Pick what this role can do, then add staff to it' : `${members.length} member${members.length === 1 ? '' : 's'} · last changed ${fmtDateTime(role.updated_at ?? role.created_at)}`}
        actions={!readOnly && <><Btn v="white" to="/admin/staff">Cancel</Btn><Btn disabled={save.isPending || !name.trim()} onClick={submit}>{save.isPending && <Spin />}{isNew ? 'Create role' : 'Save role'}</Btn></>}
      />
      {locked && <p className="rounded-xl border border-tan/30 bg-tan/10 px-4 py-3 text-[13px]">The Super Admin role always has full access — including the SMS gateway, SMS wallet and other Super Admins — and can’t be changed.</p>}
      <Two ratio="main">
        <Col>
          <Card title="Role details">
            <div className="grid gap-3.5 md:grid-cols-2">
              <FormField label="Role name" error={err.name || err.slug}><TextInput value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} maxLength={100} placeholder="e.g. Warehouse / Packer" /></FormField>
              {!readOnly && <FormField label="Copy permissions from"><Select value={copyFrom} onChange={copy} placeholder="Start from another role…" search={false} options={roles.filter((r) => r.id !== role?.id).map((r) => ({ value: String(r.id), label: r.name }))} /></FormField>}
            </div>
            <FormField label="Description" error={err.description}><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={readOnly} maxLength={255} placeholder="What this role is for" /></FormField>
          </Card>
          <Card title="Permissions" sub={`${granted} permission${granted === 1 ? '' : 's'} granted`} right={!readOnly && <div className="flex gap-3 text-xs font-semibold"><button type="button" onClick={selectAll} className="text-tan">Select all</button><button type="button" onClick={clearAll} className="text-amute hover:text-ink">Clear</button></div>}>
            {err.permissions && <p className="text-xs text-bad">{err.permissions}</p>}
            <Matrix modules={modules} actions={actions} perms={perms} toggle={toggle} toggleRow={toggleRow} toggleCol={toggleCol} readOnly={readOnly} />
          </Card>
        </Col>
        <Col>
          {!isNew && (
            <Card title="Members with this role" right={<Link to="/admin/staff" className="text-xs font-semibold text-tan">Manage staff</Link>}>
              {members.length ? members.map((m) => {
                const [label, tone] = memberStatus(m)
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar name={m.name || '?'} />
                    <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{m.name}</p><p className="truncate text-[11px] text-amute">{m.email}</p></div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>
                )
              }) : <p className="text-[13px] text-amute">No one has this role yet. Add staff from the Staff page.</p>}
            </Card>
          )}
          <Card title="Good to know">
            <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-amute">
              <li>Changes apply the next time each member’s page loads.</li>
              <li>The SMS gateway keys and SMS balance are only ever available to the Super Admin.</li>
              <li>Brands follow Categories, invoices follow Orders, flash sales follow Coupons.</li>
            </ul>
          </Card>
          {!isNew && !role.is_system && can('staff', 'delete') && (
            <Card title="Delete role">
              <p className="text-xs text-amute">{members.length ? 'Move its members to another role first.' : 'Nobody uses this role.'}</p>
              <Btn v="danger" icon={Trash2} disabled={members.length > 0} onClick={remove}>Delete role</Btn>
            </Card>
          )}
        </Col>
      </Two>
    </>
  )
}

export default function AdminRoleEdit() {
  const { id } = useParams()
  const rolesQ = useAdminList('roles')
  const staffQ = useAdminList('staff')
  if (rolesQ.isPending || staffQ.isPending) return <LoadingBlock rows={8} />
  const roles = rolesQ.data?.data ?? []
  const role = id === 'new' ? null : roles.find((r) => String(r.id) === id)
  if (id !== 'new' && !role) return <EmptyBlock title="Role not found" action={<Btn v="white" to="/admin/staff">Back to staff</Btn>} />
  const members = role ? (staffQ.data?.data ?? []).filter((m) => m.role?.id === role.id) : []
  return <RoleForm key={`${id}-${role?.updated_at}`} role={role} roles={roles} matrix={rolesQ.data.matrix} members={members} />
}
