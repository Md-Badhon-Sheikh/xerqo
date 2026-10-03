import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import { Loader2, MapPin, Plus } from 'lucide-react'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import { OtpInput, useCountdown, mmss } from '../../components/store/OtpInput'
import Select2 from '../../components/common/Select2'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { DISTRICTS, prettyPhone } from '../../lib/bd'
import { PasswordInput } from './Login'

const Card = ({ className, children }) => <div className={cx('rounded-lg bg-white p-4 sm:p-6', className)}>{children}</div>
const Spinner = () => <Loader2 className="size-4 animate-spin" />
const ME = ['customer', 'me']
const ADDRESSES = ['customer', 'addresses']
const TODAY = new Date().toISOString().slice(0, 10) // latest allowed date of birth

function Toggle({ label, sub, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3 text-[13px]">
      <span>{label}{sub && <span className="block text-[11px] text-mute">{sub}</span>}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50', checked ? 'bg-leaf' : 'bg-line')}>
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  )
}

function useSaveMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.put('/me', body),
    onSuccess: (res) => qc.setQueryData(ME, res.data),
  })
}

function PersonalInfo({ user }) {
  const save = useSaveMe()
  const [form, setForm] = useState({ name: user.name, email: user.email ?? '', phone: user.phone ?? '', date_of_birth: user.date_of_birth ?? '' })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [left, setLeft] = useCountdown()
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const phoneChanged = form.phone !== (user.phone ?? '')

  useEffect(() => {
    if (!avatar) { setPreview(null); return }
    const url = URL.createObjectURL(avatar); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatar])

  const sendCode = async () => {
    setSending(true); setErrors({})
    try {
      const res = await api.post('/me/phone/otp', { phone: form.phone })
      setCodeSent(true); setCode(''); setLeft(res.resend_in ?? 60)
      toast.success(res.message)
      if (res.debug_otp) toast.info(`Dev mode code: ${res.debug_otp}`)
    } catch (err) { setErrors({ phone: err.fields?.phone || err.message }) } finally { setSending(false) }
  }

  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    const body = { name: form.name, email: form.email || null, date_of_birth: form.date_of_birth || null, ...(phoneChanged ? { phone: form.phone, phone_otp: code } : {}) }
    let payload = body
    if (avatar) {
      payload = new FormData()
      Object.entries(body).forEach(([k, v]) => payload.append(k, v ?? ''))
      payload.append('avatar', avatar)
    }
    save.mutate(payload, {
      onSuccess: () => { toast.success('Profile saved'); setAvatar(null); setCodeSent(false); setCode('') },
      onError: (err) => { setErrors(err.fields || {}); if (!Object.keys(err.fields || {}).length) toast.error(err.message) },
    })
  }

  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const img = preview || user.avatar
  return (
    <Card>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <div className="flex items-center gap-4">
          {img ? <img src={img} alt="" className="size-14 rounded-full object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-tan text-lg font-bold text-white">{initials}</span>}
          <div>
            <h2 className="text-base font-semibold">Personal info</h2>
            <label className="cursor-pointer text-xs font-semibold text-tan underline underline-offset-2">
              Change photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatar(f); e.target.value = '' }} />
            </label>
            {errors.avatar && <p className="text-xs text-rust">{errors.avatar}</p>}
          </div>
        </div>
        <Field label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Field label="Mobile" error={errors.phone || errors.phone_otp} help={phoneChanged ? 'A code will be sent to the new number to confirm it.' : undefined}>
          <div className="relative">
            <input className={cx('input pr-28', (errors.phone || errors.phone_otp) && 'border-rust')} inputMode="tel" value={form.phone} onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })); setCodeSent(false) }} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold">
              {!phoneChanged ? (user.phone_verified ? <span className="text-leaf">✓ Verified</span> : <span className="text-mute">Not verified</span>)
                : left > 0 ? <span className="text-mute">{mmss(left)}</span>
                  : <button type="button" disabled={sending || form.phone.length !== 11} onClick={sendCode} className="text-tan disabled:opacity-40">{sending ? 'Sending…' : codeSent ? 'Resend' : 'Send code'}</button>}
            </span>
          </div>
        </Field>
        {phoneChanged && codeSent && <OtpInput value={code} onChange={setCode} invalid={!!errors.phone_otp} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} error={errors.date_of_birth} max={TODAY} />
        </div>
        <Button size="sm" className="sm:!px-4 sm:!py-3" disabled={save.isPending || (phoneChanged && code.length !== 6)}>{save.isPending && <Spinner />}Save changes</Button>
      </form>
    </Card>
  )
}

function PasswordNotifications({ user }) {
  const save = useSaveMe()
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const change = useMutation({ mutationFn: (body) => api.put('/me/password', body) })
  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    change.mutate({ ...pw, password_confirmation: pw.password }, {
      onSuccess: () => { toast.success('Password updated. Other devices were signed out.'); setPw({ current_password: '', password: '', password_confirmation: '' }) },
      onError: (err) => setErrors(err.fields || { current_password: err.message }),
    })
  }
  const pref = (key) => (value) => save.mutate({ [key]: value }, { onSuccess: () => toast.success('Preference saved'), onError: (err) => toast.error(err.message) })

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold">Password &amp; notifications</h2>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <Field label="Current password" error={errors.current_password}><PasswordInput autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} error={errors.current_password} /></Field>
        <Field label="New password" error={errors.password}><PasswordInput autoComplete="new-password" placeholder="Min. 8 characters" value={pw.password} onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))} error={errors.password} /></Field>
        <Button variant="outline" size="sm" className="sm:!px-4 sm:!py-3" disabled={change.isPending || !pw.current_password || pw.password.length < 8}>{change.isPending && <Spinner />}Update password</Button>
      </form>
      <div className="pt-1">
        <Toggle label="Order updates by SMS" sub="Confirmation, shipping and delivery" checked={user.notify_order_sms} onChange={pref('notify_order_sms')} disabled={save.isPending} />
        <Toggle label="Offers & new arrivals (SMS)" checked={user.marketing_sms} onChange={pref('marketing_sms')} disabled={save.isPending} />
        <Toggle label="Email newsletter" checked={user.marketing_email} onChange={pref('marketing_email')} disabled={save.isPending || !user.email} sub={user.email ? undefined : 'Add an email address first'} />
      </div>
    </Card>
  )
}

function AddressCard({ a, onEdit }) {
  const qc = useQueryClient()
  const setDefault = useMutation({
    mutationFn: () => api.put(`/me/addresses/${a.id}`, { is_default: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ADDRESSES }); toast.success('Default address updated') },
    onError: (err) => toast.error(err.message),
  })
  const remove = async () => {
    const done = await confirmAndRun({ title: 'Delete this address?', text: `${a.label || 'Address'} · ${a.address_line}`, confirmText: 'Delete', danger: true }, () => api.del(`/me/addresses/${a.id}`))
    if (done) { qc.invalidateQueries({ queryKey: ADDRESSES }); toast.success('Address deleted') }
  }
  const inside = a.district === 'Dhaka'
  return (
    <article className={cx('space-y-2 rounded-lg bg-white p-4 sm:p-5', a.is_default ? 'border-[1.5px] border-tan' : 'border border-line')}>
      <p className="flex items-center gap-2 font-semibold">{a.label || 'Address'}{a.is_default && <span className="rounded-full bg-amber/12 px-2 py-0.5 text-[10px] font-semibold text-amber">Default</span>}</p>
      <p className="text-[13px]">{a.name} · {prettyPhone(a.phone)}</p>
      <p className="text-xs leading-relaxed text-mute">{[a.address_line, a.area, a.district].filter(Boolean).join(', ')}</p>
      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold', inside ? 'bg-info/12 text-info' : 'bg-violet/12 text-violet')}>{inside ? 'Inside Dhaka' : 'Outside Dhaka'}</span>
      <div className="flex gap-4 pt-1 text-xs text-mute">
        <button type="button" onClick={() => onEdit(a)} className="font-semibold text-tan underline underline-offset-2">Edit</button>
        <button type="button" onClick={remove} className="hover:text-rust">Delete</button>
        {!a.is_default && <button type="button" disabled={setDefault.isPending} onClick={() => setDefault.mutate()} className="hover:text-ink">Set as default</button>}
      </div>
    </article>
  )
}

function AddressForm({ initial, user, onDone }) {
  const qc = useQueryClient()
  const [f, setF] = useState(initial ?? { label: 'Home', name: user.name, phone: user.phone ?? '', district: '', area: '', address_line: '', is_default: false })
  const [errors, setErrors] = useState({})
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useMutation({
    mutationFn: (body) => (initial?.id ? api.put(`/me/addresses/${initial.id}`, body) : api.post('/me/addresses', body)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ADDRESSES }); toast.success(initial?.id ? 'Address updated' : 'Address added'); onDone() },
    onError: (err) => { setErrors(err.fields || {}); if (!Object.keys(err.fields || {}).length) toast.error(err.message) },
  })
  const submit = (e) => { e.preventDefault(); setErrors({}); save.mutate({ ...f, area: f.area || null, label: f.label || null }) }
  return (
    <Card>
      <form className="space-y-4" onSubmit={submit} noValidate>
        <h3 className="text-base font-semibold">{initial?.id ? 'Edit address' : 'Add new address'}</h3>
        <div className="flex flex-wrap gap-2">
          {['Home', 'Office', 'Other'].map((t) => (
            <button key={t} type="button" onClick={() => set({ label: t })} aria-pressed={f.label === t} className={cx('rounded-full border px-3.5 py-1.5 text-xs font-medium', f.label === t ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{t}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Recipient name" placeholder="Full name" value={f.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
          <Field label="Phone" inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} error={errors.phone} />
          <Field label="District" error={errors.district}><Select2 variant="store" search placeholder="Select district" options={DISTRICTS} value={f.district} onChange={(district) => set({ district })} invalid={!!errors.district} /></Field>
          <Field label="Area / Thana" placeholder="e.g. Dhanmondi" value={f.area} onChange={(e) => set({ area: e.target.value })} error={errors.area} />
        </div>
        <Field label="Full address" placeholder="House, road, landmark" value={f.address_line} onChange={(e) => set({ address_line: e.target.value })} error={errors.address_line} />
        <Checkbox label="Set as default address" checked={f.is_default} onChange={(e) => set({ is_default: e.target.checked })} />
        <div className="flex gap-2">
          <Button size="sm" className="sm:!px-4 sm:!py-3" disabled={save.isPending}>{save.isPending && <Spinner />}Save address</Button>
          <Button type="button" variant="outline" size="sm" className="sm:!px-4 sm:!py-3" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  )
}

async function deleteAccount(logout, navigate) {
  const res = await Swal.fire({
    icon: 'warning', title: 'Delete your account?',
    text: 'Your profile, addresses and wishlist are removed for good. Past orders stay on record. Enter your password to confirm.',
    input: 'password', inputPlaceholder: 'Your password', showCancelButton: true, confirmButtonText: 'Delete account', reverseButtons: true, focusCancel: true,
    buttonsStyling: false, customClass: { confirmButton: 'xq-swal-btn xq-swal-danger', cancelButton: 'xq-swal-btn xq-swal-cancel', input: 'input !mx-6 !w-auto' },
    showLoaderOnConfirm: true, allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async (password) => {
      if (!password) { Swal.showValidationMessage('Enter your password'); return false }
      try { return await api.del('/me', { body: { password } }) } catch (e) { Swal.showValidationMessage(e.fields?.password || e.message); return false }
    },
  })
  if (res.isConfirmed) {
    // leave the account area first, otherwise the sign-in guard redirects to /login
    navigate('/', { replace: true })
    await logout()
    toast.success('Your account has been deleted')
  }
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(null) // null | 'new' | address
  const { data: addresses = [], isPending } = useQuery({ queryKey: ADDRESSES, queryFn: () => api.get('/me/addresses').then((r) => r.data), enabled: !!user })
  if (!user) return null

  return (
    <AccountShell title="Profile & addresses">
      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-2">
        <PersonalInfo key={`${user.id}-${user.phone}`} user={user} />
        <PasswordNotifications user={user} />
      </div>

      <section id="addresses" className="scroll-mt-32 space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="h-display text-[26px] sm:text-[32px]">Address book</h2>
          {editing !== 'new' && <Button variant="tan" size="sm" className="sm:!px-4 sm:!py-2.5" onClick={() => setEditing('new')}><Plus className="size-3.5" />Add address</Button>}
        </div>
        {isPending ? <div className="h-28 animate-pulse rounded-lg bg-white" /> : addresses.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {addresses.map((a) => <AddressCard key={a.id} a={a} onEdit={(x) => setEditing(x)} />)}
          </div>
        ) : editing !== 'new' && (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-8 text-center">
            <MapPin className="size-6 text-tan" />
            <p className="text-sm text-mute">No saved addresses yet — add one for faster checkout.</p>
          </div>
        )}
        {editing && <AddressForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} user={user} onDone={() => setEditing(null)} />}
      </section>

      <button type="button" onClick={() => deleteAccount(logout, navigate)} className="text-xs text-rust underline underline-offset-2">Delete my account</button>
    </AccountShell>
  )
}
