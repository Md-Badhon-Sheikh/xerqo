import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Monitor, Smartphone, Tablet, Trash2, Upload } from 'lucide-react'
import { useAdminAuth } from '../../context/AuthContext'
import { Badge, Btn, Card, Col, PageHead, Two, cx } from '../../components/admin/ui'
import { FormField, LoadingBlock, Spin, TextInput } from '../../components/admin/form'
import { ago, fmtDateTime } from '../../components/admin/orderUi'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const KIND = { phone: Smartphone, tablet: Tablet, desktop: Monitor }

function Password({ label, value, onChange, error, autoComplete = 'new-password' }) {
  const [show, setShow] = useState(false)
  return (
    <FormField label={label} error={error}>
      <div className="relative">
        <TextInput type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} className="pr-16" invalid={!!error} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-tan">{show ? 'Hide' : 'Show'}</button>
      </div>
    </FormField>
  )
}

const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) && p.length >= 12].filter(Boolean).length
const LABEL = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong']

function ChangePassword() {
  const qc = useQueryClient()
  const [f, setF] = useState({ current_password: '', password: '', password_confirmation: '' })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation(() => adminApi.put('/admin/profile/password', f), {
    success: (res) => res.message, onSuccess: () => { setF({ current_password: '', password: '', password_confirmation: '' }); qc.invalidateQueries({ queryKey: ['admin', 'profile/sessions'] }) },
  })
  const err = save.error?.fields ?? {}
  const s = strength(f.password)
  const good = s >= 3
  const mismatch = f.password_confirmation && f.password_confirmation !== f.password
  return (
    <Card title="Change password" sub="Other devices are signed out when you change it">
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
        <Password label="Current password" value={f.current_password} onChange={(e) => set({ current_password: e.target.value })} error={err.current_password} autoComplete="current-password" />
        <div className="space-y-2.5">
          <Password label="New password" value={f.password} onChange={(e) => set({ password: e.target.value })} error={err.password} />
          {f.password && <>
            <div className="grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={cx('h-1 rounded-full', i < s ? (good ? 'bg-ok' : 'bg-amber') : 'bg-aline')} />)}</div>
            <p className={cx('text-[11px] font-semibold', good ? 'text-ok' : 'text-amber')}>{LABEL[s]} · {f.password.length} characters{f.password.length < 8 ? ' (at least 8)' : ''}</p>
          </>}
        </div>
        <Password label="Confirm new password" value={f.password_confirmation} onChange={(e) => set({ password_confirmation: e.target.value })} error={mismatch ? 'Passwords do not match' : undefined} />
        <Btn type="submit" className="w-full" disabled={save.isPending || !f.current_password || f.password.length < 8 || f.password !== f.password_confirmation}>{save.isPending && <Spin />}Update password</Btn>
      </form>
    </Card>
  )
}

function Details({ user }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '' })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation(() => adminApi.put('/admin/profile', { ...f, phone: f.phone || null }), {
    success: 'Details saved', onSuccess: (res) => qc.setQueryData(['admin', 'me'], (old) => ({ ...old, ...res.data })),
  })
  const err = save.error?.fields ?? {}
  return (
    <Card title="Personal information">
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
        <FormField label="Full name" error={err.name}><TextInput value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} /></FormField>
        <div className="grid gap-3.5 md:grid-cols-2">
          <FormField label="Email" error={err.email} help="Used to sign in"><TextInput type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></FormField>
          <FormField label="Mobile" error={err.phone} help="For password reset codes by SMS"><TextInput value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="01XXXXXXXXX" inputMode="tel" /></FormField>
        </div>
        <FormField label="Role" help={user.is_super_admin ? 'Super Admins always keep full access' : 'Only someone who manages staff can change your role'}>
          <input className="ainput bg-abg text-amute" value={user.role?.name ?? '—'} readOnly />
        </FormField>
        <Btn type="submit" disabled={save.isPending}>{save.isPending && <Spin />}Save details</Btn>
      </form>
    </Card>
  )
}

function Devices() {
  const { data, isPending } = useAdminList('profile/sessions')
  const list = data?.data ?? []
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'profile/sessions'] })
  const revoke = async (id) => {
    const done = await confirmAndRun({ title: id ? 'Sign out this device?' : 'Sign out all other devices?', text: 'They will need to sign in again.', confirmText: 'Sign out', danger: true }, () => adminApi.del(`/admin/profile/sessions${id ? `/${id}` : ''}`))
    if (done) { toast.success(done.message); refresh() }
  }
  const others = list.filter((s) => !s.current).length
  return (
    <Card title="Signed-in devices" right={others > 0 && <button type="button" onClick={() => revoke(null)} className="text-xs font-semibold text-bad">Sign out all others</button>}>
      {isPending ? <LoadingBlock rows={2} /> : (
        <div className="divide-y divide-aline">
          {list.map((s) => {
            const I = KIND[s.kind] ?? Monitor
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-asoft text-amute"><I className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{s.device}</p><p className="truncate text-[11px] text-amute">{s.ip ? `${s.ip} · ` : ''}active {ago(s.last_used_at)}</p></div>
                {s.current ? <Badge tone="green">This device</Badge> : <button type="button" onClick={() => revoke(s.id)} className="text-xs font-semibold text-bad">Sign out</button>}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function AdminProfile() {
  const { user, logout, loading } = useAdminAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }) }

  const setAvatar = async (file) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = file ? await adminApi.post('/admin/profile/avatar', form) : await adminApi.del('/admin/profile/avatar')
      qc.setQueryData(['admin', 'me'], (old) => ({ ...old, ...res.data }))
      toast.success(file ? 'Photo updated' : 'Photo removed')
    } catch (e) { toast.error(e.message) } finally { setUploading(false) }
  }

  if (loading || !user) return <LoadingBlock rows={6} />

  return (
    <>
      <PageHead title="My profile" sub="Your details, password and signed-in devices" />

      <section className="flex flex-col gap-4 rounded-xl border border-aline bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        {user.avatar
          ? <img src={user.avatar} alt="" className="size-[60px] shrink-0 rounded-full object-cover sm:size-[72px]" />
          : <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-tan text-xl font-bold text-white sm:size-[72px] sm:text-2xl">{initials(user.name)}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{user.name}</h2><Badge tone="tan">{user.role?.name ?? 'Staff'}</Badge></div>
          <p className="mt-1 text-xs text-amute">{user.email}{user.last_login_at ? ` · last sign-in ${fmtDateTime(user.last_login_at)}` : ''}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setAvatar(f) }} />
          <Btn v="white" icon={Upload} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading && <Spin />}{user.avatar ? 'Change photo' : 'Add photo'}</Btn>
          {user.avatar && <Btn v="white" icon={Trash2} disabled={uploading} onClick={() => setAvatar(null)} aria-label="Remove photo" />}
        </div>
      </section>

      <Two ratio="even">
        <Col>
          <Details key={user.id} user={user} />
          <Devices />
        </Col>
        <Col>
          <ChangePassword />
          <Btn v="danger" onClick={signOut} icon={LogOut} className="w-full">Log out</Btn>
        </Col>
      </Two>
    </>
  )
}
