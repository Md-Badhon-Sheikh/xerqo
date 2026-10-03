import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Truck, X } from 'lucide-react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Card, PageHead, Select, Textarea, cx } from '../../components/admin/ui'
import { FormField, LoadingBlock, MoneyInput, Spin, Switch, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

/* Saves one settings key; field errors come back as "settings.<key>.<field>" */
export function useSettingSave(key, { success = 'Settings saved' } = {}) {
  const save = useAdminMutation((value) => adminApi.put('/admin/settings', { settings: { [key]: value } }), { invalidate: ['settings'], success })
  const errors = save.error?.fields ?? {}
  const err = (path) => errors[`settings.${key}.${path}`] ?? (path === '' ? errors[`settings.${key}`] : undefined)
  return { save, err }
}

export const useSettingsData = () => {
  const q = useAdminList('settings')
  return { ...q, values: q.data?.data }
}

const SaveBar = ({ save, onSave, disabled, children = 'Save' }) => (
  <div className="flex justify-end border-t border-aline pt-4">
    <Btn disabled={disabled || save.isPending} onClick={onSave} className="max-sm:w-full">{save.isPending && <Spin />}{children}</Btn>
  </div>
)

function Zones({ initial, canEdit }) {
  const [d, setD] = useState({
    inside_dhaka: String(initial.inside_dhaka ?? 60), outside_dhaka: String(initial.outside_dhaka ?? 120),
    inside_dhaka_eta: initial.inside_dhaka_eta ?? '', outside_dhaka_eta: initial.outside_dhaka_eta ?? '',
    free: (initial.free_delivery_threshold ?? 0) > 0, threshold: String(initial.free_delivery_threshold || 2000),
  })
  const set = (patch) => setD((x) => ({ ...x, ...patch }))
  const { save, err } = useSettingSave('delivery', { success: 'Delivery charges saved' })
  const submit = () => save.mutate({
    inside_dhaka: Number(d.inside_dhaka) || 0, outside_dhaka: Number(d.outside_dhaka) || 0,
    inside_dhaka_eta: d.inside_dhaka_eta || null, outside_dhaka_eta: d.outside_dhaka_eta || null,
    free_delivery_threshold: d.free ? Number(d.threshold) || 0 : 0,
  })
  const rows = [
    ['inside_dhaka', 'Inside Dhaka', 'Customers whose district is Dhaka'],
    ['outside_dhaka', 'Outside Dhaka', 'All other 63 districts'],
  ]

  return (
    <Card title="Delivery charges" sub="The zone is picked automatically from the district at checkout">
      <div className="divide-y divide-aline rounded-xl border border-aline">
        {rows.map(([k, name, sub]) => (
          <div key={k} className="grid gap-3 p-3.5 sm:grid-cols-[1fr_130px_150px] sm:items-start">
            <div><p className="text-[13px] font-semibold">{name}</p><p className="text-[11px] text-amute">{sub}</p></div>
            <FormField label="Charge" error={err(k)}><MoneyInput value={d[k]} onChange={(v) => set({ [k]: v })} disabled={!canEdit} aria-label={`${name} charge`} /></FormField>
            <FormField label="Delivery time" error={err(`${k}_eta`)}><TextInput value={d[`${k}_eta`]} onChange={(e) => set({ [`${k}_eta`]: e.target.value })} placeholder="e.g. 1–2 days" maxLength={30} disabled={!canEdit} /></FormField>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-ok/8 p-3.5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">Free delivery</p><p className="text-[11px] text-amute">{d.free ? `Orders of ৳${Number(d.threshold || 0).toLocaleString()} or more ship free` : 'Off — every order pays the delivery charge'}</p></div>
        {d.free && <div className="sm:w-36"><MoneyInput value={d.threshold} onChange={(threshold) => set({ threshold })} disabled={!canEdit} aria-label="Free delivery from" /></div>}
        <Switch checked={d.free} onChange={(free) => set({ free })} label="Free delivery" disabled={!canEdit} />
      </div>
      {err('free_delivery_threshold') && <p className="text-xs text-bad">{err('free_delivery_threshold')}</p>}
      {canEdit && <SaveBar save={save} onSave={submit}>Save delivery charges</SaveBar>}
    </Card>
  )
}

const WALLETS = [['bkash', 'bKash', 'bg-bkash'], ['nagad', 'Nagad', 'bg-nagad'], ['rocket', 'Rocket', 'bg-violet']]
const ACCOUNT_TYPES = ['Merchant', 'Personal', 'Agent'].map((v) => ({ value: v, label: v }))

function MethodRow({ chip, cls, name, sub, on, onToggle, canEdit, children }) {
  return (
    <div className={cx('rounded-xl border p-3.5', on ? 'border-aline' : 'border-dashed border-aline bg-abg/40')}>
      <div className="flex items-center gap-3">
        <span className={cx('grid h-6 w-[50px] shrink-0 place-items-center rounded text-[10px] font-bold text-white', cls)}>{chip}</span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{name}</p><p className="text-xs text-amute">{sub}</p></div>
        <Switch checked={on} onChange={onToggle} label={`${name} on/off`} disabled={!canEdit} />
      </div>
      {on && children && <div className="mt-3.5 space-y-3 border-t border-aline pt-3.5">{children}</div>}
    </div>
  )
}

function Methods({ initial, canEdit }) {
  const [p, setP] = useState(() => structuredClone(initial))
  const setM = (m, patch) => setP((x) => ({ ...x, [m]: { ...x[m], ...patch } }))
  const { save, err } = useSettingSave('payments', { success: 'Payment methods saved' })
  const submit = () => {
    const body = {
      cod: { enabled: !!p.cod?.enabled },
      ...Object.fromEntries(WALLETS.map(([k]) => [k, { enabled: !!p[k]?.enabled, number: p[k]?.number || null, account_type: p[k]?.account_type || 'Personal', instructions: p[k]?.instructions || null }])),
      bank: { enabled: !!p.bank?.enabled, ...Object.fromEntries(['bank_name', 'account_name', 'account_number', 'branch', 'routing_number', 'instructions'].map((f) => [f, p.bank?.[f] || null])) },
    }
    save.mutate(body)
  }
  const rowProps = (m) => ({ on: !!p[m]?.enabled, onToggle: (enabled) => setM(m, { enabled }), canEdit })

  return (
    <Card title="Payment methods" sub="Customers pay to these accounts and send the transaction ID or slip — you verify it in Payments & COD">
      {err('') && <p className="rounded-lg bg-bad/10 px-3.5 py-2.5 text-xs text-bad">{err('')}</p>}
      <MethodRow chip="COD" cls="bg-ink" name="Cash on Delivery" sub="Customer pays the rider; blocked customers never see it" {...rowProps('cod')} />
      {WALLETS.map(([k, name, cls]) => (
        <MethodRow key={k} chip={name} cls={cls} name={name} sub={p[k]?.number ? `${p[k].account_type ?? ''} · ${p[k].number}` : 'Add the number customers pay to'} {...rowProps(k)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={`${name} number`} error={err(`${k}.number`)}><TextInput inputMode="numeric" value={p[k]?.number ?? ''} onChange={(e) => setM(k, { number: e.target.value.replace(/\D/g, '') })} maxLength={12} disabled={!canEdit} placeholder={k === 'rocket' ? '017XXXXXXXXX' : '017XXXXXXXX'} /></FormField>
            <FormField label="Account type" error={err(`${k}.account_type`)}><Select value={p[k]?.account_type ?? 'Personal'} onChange={(account_type) => setM(k, { account_type })} options={ACCOUNT_TYPES} search={false} disabled={!canEdit} /></FormField>
          </div>
          <FormField label="Instructions shown at checkout" error={err(`${k}.instructions`)}><Textarea rows={2} value={p[k]?.instructions ?? ''} onChange={(e) => setM(k, { instructions: e.target.value })} maxLength={500} disabled={!canEdit} /></FormField>
        </MethodRow>
      ))}
      <MethodRow chip="Bank" cls="bg-info" name="Bank transfer / Card" sub="Customer transfers or deposits, then uploads the slip" {...rowProps('bank')}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['bank_name', 'Bank name'], ['account_name', 'Account name'], ['account_number', 'Account number'], ['branch', 'Branch'], ['routing_number', 'Routing number']].map(([f, l]) => (
            <FormField key={f} label={l} error={err(`bank.${f}`)}><TextInput value={p.bank?.[f] ?? ''} onChange={(e) => setM('bank', { [f]: e.target.value })} disabled={!canEdit} /></FormField>
          ))}
        </div>
        <FormField label="Instructions shown at checkout" error={err('bank.instructions')}><Textarea rows={2} value={p.bank?.instructions ?? ''} onChange={(e) => setM('bank', { instructions: e.target.value })} maxLength={500} disabled={!canEdit} /></FormField>
      </MethodRow>
      <p className="text-[11px] text-amute">Online gateways (bKash/Nagad checkout, SSLCommerz) can be added later — for now every payment is checked by hand.</p>
      {canEdit && <SaveBar save={save} onSave={submit}>Save payment methods</SaveBar>}
    </Card>
  )
}

function Couriers({ initial, canEdit }) {
  const [list, setList] = useState(initial.couriers ?? [])
  const [name, setName] = useState('')
  const { save, err } = useSettingSave('delivery', { success: 'Courier list saved' })
  const add = () => {
    const n = name.trim()
    if (!n) return
    if (list.some((c) => c.toLowerCase() === n.toLowerCase())) { toast.error(`${n} is already listed.`); return }
    setList([...list, n]); setName('')
  }
  const fieldErr = err('couriers') || Object.entries(save.error?.fields ?? {}).find(([k]) => k.startsWith('settings.delivery.couriers.'))?.[1]
  return (
    <Card title="Couriers" sub="Names offered when you mark an order shipped" right={<Truck className="size-4 text-amute" />}>
      <div className="flex flex-wrap gap-2">
        {list.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-aline bg-white py-1 pl-3 pr-1.5 text-[13px]">
            {c}
            {canEdit && <button type="button" aria-label={`Remove ${c}`} onClick={() => setList(list.filter((x) => x !== c))} className="grid size-5 place-items-center rounded-full text-amute hover:bg-bad/10 hover:text-bad"><X className="size-3" /></button>}
          </span>
        ))}
      </div>
      {canEdit && (
        <div className="flex gap-2">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder="Add a courier, e.g. Sundarban" maxLength={40} />
          <Btn v="white" icon={Plus} onClick={add}>Add</Btn>
        </div>
      )}
      {fieldErr && <p className="text-xs text-bad">{fieldErr}</p>}
      <p className="text-[11px] text-amute">Booking parcels through courier APIs (Steadfast, Pathao, RedX) is planned for later; tracking numbers are entered by hand for now.</p>
      {canEdit && <SaveBar save={save} onSave={() => save.mutate({ couriers: list })} disabled={!list.length}>Save couriers</SaveBar>}
    </Card>
  )
}

export default function AdminSettings() {
  const { hash } = useLocation()
  const { can } = useAdminAuth()
  const canEdit = can('settings', 'edit')
  const { values, isPending } = useSettingsData()
  useEffect(() => {
    if (!hash || isPending) return
    // wait for the layout's scroll-to-top on route change, then jump to the section
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  }, [hash, isPending])

  return (
    <>
      <PageHead title="Settings" sub="Delivery charges, payment accounts and couriers" />
      <SettingsShell>
        {isPending || !values ? <LoadingBlock /> : <>
          <Zones initial={values.delivery ?? {}} canEdit={canEdit} />
          <section id="payments" className="scroll-mt-24"><Methods initial={values.payments ?? {}} canEdit={canEdit} /></section>
          <section id="couriers" className="scroll-mt-24"><Couriers initial={values.delivery ?? {}} canEdit={canEdit} /></section>
        </>}
      </SettingsShell>
    </>
  )
}
