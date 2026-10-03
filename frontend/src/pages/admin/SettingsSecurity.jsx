import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Download, Monitor, ShieldCheck, Smartphone, Tablet } from 'lucide-react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Badge, Btn, Card, PageHead, Select, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox } from '../../components/admin/form'
import { ago, fmtDateTime } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'

const KIND = { phone: Smartphone, tablet: Tablet, desktop: Monitor }
const CATEGORIES = [['', 'Type: All'], ['auth', 'Sign-ins'], ['orders', 'Orders'], ['payments', 'Payments'], ['returns', 'Returns'], ['catalog', 'Catalogue & stock'], ['customers', 'Customers'], ['reviews', 'Reviews'], ['marketing', 'Coupons & sales'], ['content', 'Content'], ['accounts', 'Accounts'], ['settings', 'Settings'], ['sms', 'SMS'], ['staff', 'Staff & roles']].map(([value, label]) => ({ value, label }))

// what XERQO enforces today (shown so staff know the rules)
const PROTECTION = [
  ['Sign-in attempts are rate-limited', '10 tries a minute per address; failed staff sign-ins are logged below'],
  ['Passwords are hashed (bcrypt)', 'At least 8 characters; changing it signs out your other devices'],
  ['SMS codes expire in 5 minutes', 'At most 5 tries per code and 5 codes per number per hour'],
  ['Role-based access', 'Every admin page and action is checked against the staff member’s role'],
  ['SMS gateway and balance are Super Admin only', 'No role can be given access to the Reve keys or the SMS wallet'],
]

async function exportCsv(params) {
  try {
    const res = await adminApi.get('/admin/security/activity', { ...params, per_page: 200, page: 1 })
    const rows = [['Time', 'Staff', 'Role', 'Type', 'Action', 'IP', 'Device'], ...res.data.map((a) => [a.created_at, a.user, a.role, a.category, a.description, a.ip, a.device])]
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `xerqo-activity-${new Date().toISOString().slice(0, 10)}.csv` })
    link.click(); URL.revokeObjectURL(link.href)
  } catch (e) { toast.error(e.message) }
}

function ActivityLog() {
  const [f, setF] = useState({ q: '', category: '', user_id: '', page: 1 })
  const set = (patch) => setF((x) => ({ ...x, ...patch, page: patch.page ?? 1 }))
  const { data, isPending, isPlaceholderData } = useAdminList('security/activity', { ...f, per_page: 25 })
  const list = data?.data ?? []
  const staff = [{ value: '', label: 'Staff: Everyone' }, ...(data?.staff ?? []).map((s) => ({ value: String(s.id), label: s.name }))]

  return (
    <Card title="Activity log" sub={`Every change made in the admin, plus staff sign-ins${data?.failed_logins_7d ? ` · ${data.failed_logins_7d} failed sign-in${data.failed_logins_7d === 1 ? '' : 's'} this week` : ''}`}
      right={<Btn v="white" sm icon={Download} onClick={() => exportCsv(f)}><span className="max-sm:hidden">Export</span></Btn>}>
      <div className="flex flex-col gap-2.5 md:flex-row">
        <SearchBox value={f.q} onChange={(q) => set({ q })} placeholder="Search actions, e.g. XQ-24817" />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select options={CATEGORIES} search={false} value={f.category} onChange={(category) => set({ category })} className="md:w-44" aria-label="Type" />
          <Select options={staff} value={f.user_id} onChange={(user_id) => set({ user_id })} className="md:w-44" aria-label="Staff" />
        </div>
      </div>
      {isPending ? <LoadingBlock rows={4} /> : !list.length ? <EmptyBlock title="No activity yet" text="Changes made in the admin appear here." /> : (
        <div className={cx('space-y-3 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <div className="overflow-hidden rounded-xl border border-aline max-sm:hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
                <tr><th className="px-3.5 py-3 font-semibold">Staff</th><th className="px-3.5 py-3 font-semibold">Action</th><th className="px-3.5 py-3 font-semibold max-lg:hidden">IP · device</th><th className="px-3.5 py-3 font-semibold">Time</th></tr>
              </thead>
              <tbody className="divide-y divide-aline">
                {list.map((l) => (
                  <tr key={l.id}>
                    <td className="px-3.5 py-3"><p className={cx('whitespace-nowrap font-semibold', l.failed && 'text-bad')}>{l.user}</p><p className="text-[11px] text-amute">{l.role ?? '—'}</p></td>
                    <td className="px-3.5 py-3">{l.description}</td>
                    <td className="px-3.5 py-3 text-[11px] text-amute max-lg:hidden"><p>{l.ip ?? '—'}</p><p>{l.device}</p></td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-amute" title={fmtDateTime(l.created_at)}>{ago(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-aline sm:hidden">
            {list.map((l) => (
              <div key={l.id} className="space-y-1 py-3 first:pt-0">
                <div className="flex justify-between gap-2 text-xs"><b className={cx('font-semibold', l.failed && 'text-bad')}>{l.user}{l.role ? ` · ${l.role}` : ''}</b><span className="shrink-0 text-amute">{ago(l.created_at)}</span></div>
                <p className="text-[13px]">{l.description}</p>
                <p className="text-[11px] text-amute">{l.ip ?? ''} {l.device ? `· ${l.device}` : ''}</p>
              </div>
            ))}
          </div>
          <Paginator meta={data?.meta} onPage={(page) => set({ page })} />
        </div>
      )}
    </Card>
  )
}

function StaffSessions() {
  const { isSuperAdmin } = useAdminAuth()
  const qc = useQueryClient()
  const { data, isPending } = useAdminList('security/sessions')
  const list = data?.data ?? []
  const revoke = async (id) => {
    const done = await confirmAndRun({
      title: id ? 'Sign out this device?' : 'Sign out every other staff device?',
      text: id ? 'That person will need to sign in again on it.' : 'Everyone except you will need to sign in again — useful if a password or phone may be lost.',
      confirmText: 'Sign out', danger: true,
    }, () => adminApi.del(`/admin/security/sessions${id ? `/${id}` : ''}`))
    if (done) { toast.success(done.message); qc.invalidateQueries({ queryKey: ['admin', 'security/sessions'] }) }
  }
  return (
    <Card title="Signed-in staff devices" sub={`${list.length} active session${list.length === 1 ? '' : 's'}`} right={isSuperAdmin && list.some((s) => !s.current) && <button type="button" onClick={() => revoke(null)} className="text-xs font-semibold text-bad">Sign out all others</button>}>
      {isPending ? <LoadingBlock rows={2} /> : (
        <div className="divide-y divide-aline">
          {list.map((s) => {
            const I = KIND[s.kind] ?? Monitor
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-asoft text-amute"><I className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{s.user} · {s.device}</p><p className="truncate text-[11px] text-amute">{s.ip ? `${s.ip} · ` : ''}active {ago(s.last_used_at)}</p></div>
                {s.current ? <Badge tone="green">You</Badge> : isSuperAdmin && <button type="button" onClick={() => revoke(s.id)} className="text-xs font-semibold text-bad">Sign out</button>}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function AdminSettingsSecurity() {
  const { can } = useAdminAuth()
  return (
    <>
      <PageHead title="Settings" sub="How the admin is protected, who is signed in, and the activity log" />
      <SettingsShell>
        <Card title="Protection in place" right={<ShieldCheck className="size-4 text-ok" />}>
          <ul className="space-y-3">
            {PROTECTION.map(([t, s]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ok/12 text-ok"><Check className="size-3" strokeWidth={3} /></span>
                <div><p className="text-[13px] font-medium">{t}</p><p className="text-[11px] text-amute">{s}</p></div>
              </li>
            ))}
          </ul>
        </Card>
        {can('staff') ? <>
          <StaffSessions />
          <ActivityLog />
        </> : <Card title="Activity log"><p className="text-[13px] text-amute">The activity log and staff devices are visible to people who manage staff.</p></Card>}
      </SettingsShell>
    </>
  )
}
