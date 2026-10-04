import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Mail, MessageSquare, RefreshCw, Send, Wallet } from 'lucide-react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Badge, Btn, Card, PageHead, Select, Tabs, Textarea, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, MoneyInput, Paginator, SearchBox, Spin, Switch, SwitchRow, TextInput } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm, confirmAndRun, promptAndRun, toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'
import { smsParts } from '../../lib/sms'

const SMS_KEYS = ['sms', 'sms/gateway', 'sms/recharges', 'sms/logs']
const tk = (n) => `৳${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const num = (n) => Number(n ?? 0).toLocaleString('en-US')

// when each template goes out, and the {variables} it is given
const TEMPLATE_INFO = {
  order_placed: ['When the customer places an order', ['name', 'order_id', 'total']],
  order_confirmed: ['When you confirm the order', ['name', 'order_id', 'total']],
  order_processing: ['When the order moves to processing', ['name', 'order_id']],
  payment_verified: ['When you verify a bKash, Rocket, Nagad or bank payment', ['name', 'order_id', 'amount']],
  payment_rejected: ['When you reject a payment', ['name', 'order_id', 'reason', 'tracking_link']],
  order_shipped: ['When the order is marked shipped', ['name', 'order_id', 'courier', 'tracking_link']],
  out_for_delivery: ['Not sent automatically yet — comes with the courier integration', ['order_id', 'cod_amount']],
  order_delivered_review: ['When the order is marked delivered', ['name', 'product', 'review_link']],
  order_cancelled: ['When the order is cancelled', ['name', 'order_id', 'total']],
  return_approved: ['When you approve a return', ['name', 'return_id', 'order_id', 'date']],
  abandoned_cart: ['Not sent automatically yet', ['name', 'cart_link']],
  password_otp: ['When a customer resets their password (always sent, even if order SMS are off)', ['otp', 'minutes']],
}
const SAMPLE = {
  name: 'Rahim', order_id: 'XQ-24817', total: '2,600', amount: '2,600', courier: 'Steadfast', tracking_link: 'xerqo.com/track?order=XQ-24817',
  cod_amount: '2,600', product: 'Classic Bifold Wallet', review_link: 'xerqo.com/account/review/XQ-24817', reason: 'transaction ID not found',
  return_id: 'R-1042', date: '3 Oct', cart_link: 'xerqo.com/cart', otp: '482913', minutes: '5',
}
const fill = (t) => t.replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] ?? m)

// show a gateway change at once (the refetch that follows fills in the usage numbers)
function applyGateway(qc, gw) {
  qc.setQueryData(['admin', 'sms/gateway', {}], { data: gw })
  qc.setQueryData(['admin', 'sms', {}], (old) => old && {
    ...old,
    gateway: { ...old.gateway, is_enabled: gw.is_enabled, is_configured: gw.is_configured, sender_id: gw.sender_id, balance: gw.balance, rate_paisa: gw.rate_paisa, sms_left: gw.sms_left, low_balance: gw.balance < gw.low_balance },
  })
}

/* ---------- wallet: balance, usage and (Super Admin) top-up + on/off ---------- */
function WalletCard({ overview }) {
  const { isSuperAdmin } = useAdminAuth()
  const qc = useQueryClient()
  const g = overview.gateway
  const s = overview.stats
  const [kind, setKind] = useState('add')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const toggle = useAdminMutation((is_enabled) => adminApi.put('/admin/sms/gateway', { is_enabled }), {
    invalidate: SMS_KEYS, success: (_, on) => (on ? 'SMS sending is on' : 'SMS sending is off'), onSuccess: (res) => applyGateway(qc, res.data),
  })

  const switchSms = async (on) => {
    if (!on && !(await confirm({ title: 'Turn SMS off?', text: 'No SMS goes out until you turn it back on — including order updates and sign-in codes.', confirmText: 'Turn off', danger: true }))) return
    toggle.mutate(on)
  }

  const recharge = async () => {
    const value = Number(amount)
    if (!value) { toast.error('Enter an amount.'); return }
    const signed = kind === 'add' ? value : -value
    const done = await confirmAndRun({
      title: kind === 'add' ? `Add ${tk(value)} SMS balance?` : `Remove ${tk(value)} from the balance?`,
      text: `≈ ${num(Math.floor((value * 100) / g.rate_paisa))} SMS at ${g.rate_paisa} paisa each.`,
      confirmText: kind === 'add' ? 'Add balance' : 'Remove',
      danger: kind !== 'add',
    }, () => adminApi.post('/admin/sms/recharges', { amount: signed, note: note || null }))
    if (done) {
      toast.success(done.message); setAmount(''); setNote('')
      applyGateway(qc, done.data)
      SMS_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: ['admin', k] }))
    }
  }

  const status = !g.is_enabled ? ['Switched off', 'red'] : !g.live ? ['Test mode', 'blue'] : g.balance <= 0 ? ['No balance', 'red'] : g.low_balance ? ['Low balance', 'amber'] : ['Live', 'green']

  return (
    <Card title="SMS balance" sub="Every SMS is paid from this prepaid balance — when it runs out, SMS stop." right={<Badge tone={status[1]}>{status[0]}</Badge>}>
      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl bg-espresso p-4 text-white">
          <p className="flex items-center gap-1.5 text-[11px] text-white/60"><Wallet className="size-3.5" /> Balance</p>
          <p className="mt-1 text-[26px] font-bold leading-tight">{tk(g.balance)}</p>
          <p className="mt-1 text-xs text-white/70">≈ {num(g.sms_left)} SMS left · {g.rate_paisa} paisa per SMS</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[['Sent today', num(s.sent_today)], ['Sent this month', num(s.sent_month)], ['Spent this month', tk(s.cost_month)], ['Not sent (month)', num(s.not_sent_month)]].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-asoft px-3 py-2.5"><p className="text-[11px] text-amute">{l}</p><p className="text-[15px] font-bold">{v}</p></div>
          ))}
        </div>
      </div>
      {!g.live && <p className="rounded-lg bg-info/10 px-3.5 py-2.5 text-xs text-info"><b>Test mode — no SMS reaches any phone.</b> SMS_DRIVER=log in backend/.env: messages are only written to the server log and nothing is charged. Set SMS_DRIVER=reve (then php artisan config:clear) to send through Reve.</p>}

      {isSuperAdmin ? (
        <>
          <SwitchRow label="SMS sending" sub={g.is_enabled ? 'On — order updates and codes are sent' : 'Off — nothing is sent until you turn it on'} checked={g.is_enabled} onChange={switchSms} disabled={toggle.isPending} />
          <div className="grid gap-2.5 border-t border-aline pt-4 sm:grid-cols-[150px_140px_1fr_auto] sm:items-end">
            <FormField label="Action"><Select search={false} value={kind} onChange={setKind} options={[{ value: 'add', label: 'Add balance' }, { value: 'remove', label: 'Correction (remove)' }]} aria-label="Balance action" /></FormField>
            <FormField label="Amount"><MoneyInput value={amount} onChange={setAmount} placeholder="500" aria-label="Amount" /></FormField>
            <FormField label="Note"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid Reve by bKash, TrxID…" maxLength={255} /></FormField>
            <Btn v={kind === 'add' ? 'tan' : 'danger'} onClick={recharge}>{kind === 'add' ? 'Add balance' : 'Remove'}</Btn>
          </div>
        </>
      ) : (
        <p className="text-xs text-amute">Only the Super Admin can add balance, change the per-SMS price or switch SMS off.</p>
      )}
    </Card>
  )
}

/* ---------- Reve credentials (Super Admin) ---------- */
function GatewayCard({ g }) {
  const [f, setF] = useState({ api_url: g.api_url, balance_url: g.balance_url, sender_id: g.sender_id ?? '', client_id: g.client_id ?? '', rate_paisa: String(g.rate_paisa), low_balance: String(g.low_balance), api_key: '', secret_key: '' })
  const qc = useQueryClient()
  const [remote, setRemote] = useState(null)
  const [checking, setChecking] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation((body) => adminApi.put('/admin/sms/gateway', body), {
    invalidate: SMS_KEYS, success: 'SMS gateway saved', onSuccess: (res) => { set({ api_key: '', secret_key: '' }); applyGateway(qc, res.data) },
  })
  const err = save.error?.fields ?? {}

  const submit = (e) => {
    e.preventDefault()
    save.mutate({ ...f, rate_paisa: Number(f.rate_paisa) || 0, low_balance: Number(f.low_balance) || 0, client_id: f.client_id || null, sender_id: f.sender_id || null })
  }
  const checkRemote = async () => {
    setChecking(true)
    try { setRemote((await adminApi.get('/admin/sms/gateway/remote-balance')).data.balance) } catch (e) { toast.error(e.message) } finally { setChecking(false) }
  }

  return (
    <Card title="Reve SMS gateway" sub="Only you (Super Admin) can see or change this." right={<Badge tone={g.is_configured ? 'green' : 'amber'}>{g.is_configured ? 'Connected' : 'Keys missing'}</Badge>}>
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid gap-3.5 md:grid-cols-2">
          <FormField label="API key" error={err.api_key} help={g.api_key ? `Saved: ${g.api_key} — leave blank to keep it` : 'From your Reve SMS panel'}>
            <TextInput type="password" autoComplete="off" value={f.api_key} onChange={(e) => set({ api_key: e.target.value })} placeholder={g.api_key ?? 'Not set'} />
          </FormField>
          <FormField label="Secret key" error={err.secret_key} help={g.secret_key ? `Saved: ${g.secret_key} — leave blank to keep it` : 'From your Reve SMS panel'}>
            <TextInput type="password" autoComplete="off" value={f.secret_key} onChange={(e) => set({ secret_key: e.target.value })} placeholder={g.secret_key ?? 'Not set'} />
          </FormField>
          <FormField label="Approved sender ID" error={err.sender_id} help="Masking name or the number Reve approved for you">
            <TextInput value={f.sender_id} onChange={(e) => set({ sender_id: e.target.value })} placeholder="XERQO" maxLength={30} />
          </FormField>
          <FormField label="Reve client ID (optional)" error={err.client_id} help="Only needed to check your Reve account balance">
            <TextInput value={f.client_id} onChange={(e) => set({ client_id: e.target.value })} maxLength={60} />
          </FormField>
          <FormField label="Price per SMS (paisa)" error={err.rate_paisa} help={`One SMS part = ${tk((Number(f.rate_paisa) || 0) / 100)}`}>
            <TextInput inputMode="numeric" value={f.rate_paisa} onChange={(e) => set({ rate_paisa: e.target.value.replace(/\D/g, '') })} />
          </FormField>
          <FormField label="Low-balance alert" error={err.low_balance} help="Super Admins get an email when the balance falls below this">
            <MoneyInput value={f.low_balance} onChange={(low_balance) => set({ low_balance })} />
          </FormField>
          <FormField label="Send API URL" error={err.api_url}><TextInput value={f.api_url} onChange={(e) => set({ api_url: e.target.value })} /></FormField>
          <FormField label="Balance API URL" error={err.balance_url}><TextInput value={f.balance_url} onChange={(e) => set({ balance_url: e.target.value })} /></FormField>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Btn type="submit" disabled={save.isPending}>{save.isPending && <Spin />}Save gateway</Btn>
          <Btn type="button" v="white" icon={RefreshCw} disabled={!g.client_id || checking} onClick={checkRemote} title={g.client_id ? '' : 'Save your Reve client ID first'}>
            {checking ? 'Checking…' : 'Check Reve balance'}
          </Btn>
          {remote != null && <span className="text-[13px]">Reve account: <b>{tk(remote)}</b></span>}
        </div>
      </form>
    </Card>
  )
}

function RechargeHistory() {
  const [page, setPage] = useState(1)
  const { data, isPending } = useAdminList('sms/recharges', { page })
  const list = data?.data ?? []
  return (
    <Card title="Balance history" sub="Top-ups and corrections">
      {isPending ? <LoadingBlock rows={2} /> : !list.length ? <p className="text-[13px] text-amute">No top-ups yet.</p> : (
        <div className="divide-y divide-aline">
          {list.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{r.amount > 0 ? '+' : '−'}{tk(Math.abs(r.amount))} <span className="font-normal text-amute">· {num(Math.abs(r.sms))} SMS at {r.rate_paisa} paisa</span></p>
                <p className="truncate text-[11px] text-amute">{r.by ?? 'System'} · {ago(r.created_at)}{r.note ? ` · ${r.note}` : ''}</p>
              </div>
              <p className="shrink-0 text-xs text-amute">Balance {tk(r.balance_after)}</p>
            </div>
          ))}
          <Paginator meta={data?.meta} onPage={setPage} className="pt-3" />
        </div>
      )}
    </Card>
  )
}

/* ---------- templates ---------- */
function Phone({ text, sender }) {
  return (
    <div className="rounded-[22px] bg-espresso p-3.5 text-white lg:self-start">
      <p className="pb-3 pt-1 text-center text-[11px] font-bold tracking-wider">{sender || 'XERQO'}</p>
      <div className="rounded-xl bg-white/10 p-3 text-[11px] leading-relaxed">
        <p className="whitespace-pre-wrap break-words">{text}</p>
        <p className="mt-1.5 text-[9px] text-white/40">Now</p>
      </div>
    </div>
  )
}

function TemplateEditor({ tkey, t, rate, sender, canEdit }) {
  const [body, setBody] = useState(t.body)
  const [enabled, setEnabled] = useState(!!t.enabled)
  const [info, vars] = TEMPLATE_INFO[tkey] ?? ['', []]
  const parts = smsParts(fill(body))
  const dirty = body !== t.body || enabled !== !!t.enabled
  const save = useAdminMutation(() => adminApi.put(`/admin/sms/templates/${tkey}`, { enabled, body }), { invalidate: ['sms'], success: 'Template saved' })

  const sendTest = () => promptAndRun({
    title: 'Send a test SMS',
    text: `Sends "${t.name}" with sample values${dirty ? ' (the saved version)' : ''}. It is charged like any SMS.`,
    input: 'tel', placeholder: '01712345678', confirmText: 'Send', inputAttributes: { maxlength: 11, inputmode: 'numeric' },
  }, (phone) => adminApi.post('/admin/sms/test', { phone, template: tkey })).then((res) => { if (res) toast.success(res.message) })

  return (
    <Card title={`Edit template · ${t.name}`} sub={info} right={canEdit && <Switch checked={enabled} onChange={setEnabled} label={`${t.name} on/off`} />}>
      <div className="grid gap-4 lg:grid-cols-[1fr_200px] lg:gap-x-5">
        <div className="min-w-0 space-y-3.5 lg:col-start-1">
          <FormField label="Message" error={save.error?.fields?.body}
            help={<>
              {parts.length} / {parts.perSegment} characters · <b>{parts.segments} SMS</b> · {(parts.segments * rate / 100).toFixed(2)} Tk each time
              {parts.encoding === 'unicode' && <span className="text-amber"> · Unicode{parts.firstNonGsm ? ` because of “${parts.firstNonGsm}”` : ''} — only 70 characters per SMS. Use “Tk” instead of ৳ and straight quotes to fit 160.</span>}
            </>}>
            <Textarea rows={3} value={body} disabled={!canEdit} onChange={(e) => setBody(e.target.value)} maxLength={670} className="ainput resize-y border-tan leading-relaxed" />
          </FormField>
          {canEdit && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">Insert variable</p>
              <div className="flex flex-wrap gap-1.5">
                {vars.map((v) => <button key={v} type="button" onClick={() => setBody(`${body.trimEnd()} {${v}}`)} className="rounded-md bg-tan/10 px-2 py-1 text-[11px] font-medium text-tan hover:bg-tan/20">{`{${v}}`}</button>)}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1"><Phone text={fill(body)} sender={sender} /></div>
        {canEdit && (
          <div className="flex flex-wrap gap-2.5 lg:col-start-1">
            <Btn v="white" icon={Send} onClick={sendTest}>Send test SMS</Btn>
            <Btn disabled={!dirty || save.isPending || !body.trim()} onClick={() => save.mutate()}>{save.isPending && <Spin />}Save template</Btn>
            {dirty && <Btn v="soft" onClick={() => { setBody(t.body); setEnabled(!!t.enabled) }}>Undo</Btn>}
          </div>
        )}
      </div>
    </Card>
  )
}

function Templates({ templates, rate, sender, canEdit }) {
  const keys = Object.keys(templates)
  const [sel, setSel] = useState('order_confirmed')
  const current = templates[sel] ? sel : keys[0]
  const toggle = useAdminMutation(({ key, t }) => adminApi.put(`/admin/sms/templates/${key}`, { enabled: !t.enabled, body: t.body }), {
    invalidate: ['sms'], success: (res) => `${res.data.name} ${res.data.enabled ? 'on' : 'off'}`,
  })
  if (!keys.length) return null

  return (
    <>
      <Card title="Customer SMS templates" sub="Sent automatically as orders move along. Customers can turn order SMS off in their profile." bodyClass="space-y-2.5!">
        {keys.map((k) => {
          const t = templates[k]
          const parts = smsParts(fill(t.body ?? ''))
          return (
            <div key={k} role="button" tabIndex={0} onClick={() => setSel(k)} onKeyDown={(e) => e.key === 'Enter' && setSel(k)}
              className={cx('flex cursor-pointer items-center gap-3 rounded-xl border p-3 sm:px-3.5', current === k ? 'border-tan ring-1 ring-tan' : 'border-aline hover:border-tan/40', !t.enabled && 'opacity-60')}>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{t.name} <span className="ml-1 text-[11px] font-normal text-amute">{parts.segments} SMS{parts.encoding === 'unicode' ? ' · Unicode' : ''}</span></p>
                <p className="truncate text-[11px] text-amute">{t.body}</p>
              </div>
              {canEdit && <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation"><Switch checked={!!t.enabled} onChange={() => toggle.mutate({ key: k, t })} label={t.name} disabled={toggle.isPending} /></span>}
            </div>
          )
        })}
      </Card>
      <TemplateEditor key={`${current}-${templates[current].body}-${templates[current].enabled}`} tkey={current} t={templates[current]} rate={rate} sender={sender} canEdit={canEdit} />
    </>
  )
}

/* ---------- email ---------- */
function EmailCard({ email, canEdit }) {
  const [f, setF] = useState({ customer_order: email.customer_order, customer_status: email.customer_status, admin_new_order: email.admin_new_order, admin_email: email.admin_email ?? '' })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const save = useAdminMutation(() => adminApi.put('/admin/sms/email', { ...f, admin_email: f.admin_email || null }), { invalidate: ['sms'], success: 'Email settings saved' })
  const err = save.error?.fields ?? {}
  const sendTest = () => promptAndRun({
    title: 'Send a test email', text: 'Sends the order confirmation email for the latest order right now, so you can check the SMTP settings.',
    input: 'email', placeholder: 'you@example.com', value: f.admin_email, confirmText: 'Send',
  }, (to) => adminApi.post('/admin/sms/email/test', { email: to })).then((res) => { if (res) toast.success(res.message) })

  return (
    <Card title="Email notifications" sub={`Sent from ${email.from} through the hosting mailbox (SMTP)${email.mailer === 'log' ? ' · test mode: emails go to the server log' : ''}`} right={<Mail className="size-4 text-amute" />}>
      <SwitchRow label="Order confirmation to customer" sub="When an order is placed and the customer has an email address" checked={f.customer_order} onChange={(v) => set({ customer_order: v })} disabled={!canEdit} />
      <SwitchRow label="Order updates to customer" sub="Confirmed, shipped, delivered and cancelled" checked={f.customer_status} onChange={(v) => set({ customer_status: v })} disabled={!canEdit} />
      <SwitchRow label="New order alert to the store" sub="One email per order to the inbox below" checked={f.admin_new_order} onChange={(v) => set({ admin_new_order: v })} disabled={!canEdit} />
      <FormField label="Store order inbox" error={err.admin_email}>
        <TextInput type="email" value={f.admin_email} onChange={(e) => set({ admin_email: e.target.value })} placeholder="orders@xerqo.com" disabled={!canEdit} />
      </FormField>
      {canEdit && (
        <div className="flex flex-wrap gap-2.5">
          <Btn disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending && <Spin />}Save email settings</Btn>
          <Btn v="white" icon={Send} onClick={sendTest}>Send test email</Btn>
        </div>
      )}
    </Card>
  )
}

/* ---------- delivery log ---------- */
const LOG_TONE = { sent: 'green', failed: 'red', skipped: 'amber', test: 'blue' }
const LOG_LABEL = { test: 'test mode — not sent' }
function SmsLog() {
  const [f, setF] = useState({ status: '', q: '', page: 1 })
  const { data, isPending, isPlaceholderData } = useAdminList('sms/logs', { ...f, per_page: 15 })
  const list = data?.data ?? []
  return (
    <Card title="SMS log" sub="Every message — sent, failed at the gateway, or skipped (switched off, no balance, customer opted out)" right={<MessageSquare className="size-4 text-amute" />}>
      <Tabs items={[['All', null, ''], ['Sent', null, 'sent'], ['Failed', null, 'failed'], ['Skipped', null, 'skipped'], ['Test mode', null, 'test']]} active={f.status} onChange={(status) => setF({ ...f, status, page: 1 })} />
      <SearchBox value={f.q} onChange={(q) => setF({ ...f, q, page: 1 })} placeholder="Search phone or text" />
      {isPending ? <LoadingBlock rows={3} /> : !list.length ? <EmptyBlock title="No messages here" text="Messages appear as orders move along." /> : (
        <div className={cx('divide-y divide-aline transition-opacity', isPlaceholderData && 'opacity-60')}>
          {list.map((l) => (
            <div key={l.id} className="space-y-1 py-3 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold">{l.phone}</p>
                <Badge tone={LOG_TONE[l.status]}>{LOG_LABEL[l.status] ?? l.status}</Badge>
                {l.template_name && <span className="text-[11px] text-amute">{l.template_name}</span>}
                <span className="ml-auto text-[11px] text-amute" title={new Date(l.created_at).toLocaleString()}>{ago(l.created_at)}</span>
              </div>
              <p className="break-words text-xs text-amute">{l.message}</p>
              <p className="text-[11px] text-amute">
                {l.segments} SMS · {l.encoding === 'unicode' ? 'Unicode' : 'GSM'} · {tk(l.cost)}{l.sent_by ? ` · test by ${l.sent_by}` : ''}
                {l.reason && <span className={l.status === 'failed' ? 'text-bad' : 'text-amber'}> · {l.reason}</span>}
              </p>
            </div>
          ))}
          <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} className="pt-3" />
        </div>
      )}
    </Card>
  )
}

export default function AdminSettingsSms() {
  const { isSuperAdmin, can } = useAdminAuth()
  const canEdit = can('settings', 'edit')
  const { data, isPending } = useAdminList('sms')
  const gateway = useAdminList('sms/gateway', {}, { enabled: isSuperAdmin })

  return (
    <>
      <PageHead title="Settings" sub="SMS balance, customer SMS, email notifications and the SMS log" />
      <SettingsShell>
        {isPending || !data ? <LoadingBlock /> : (
          <>
            <WalletCard overview={data} />
            {isSuperAdmin && (gateway.data ? <GatewayCard g={gateway.data.data} /> : <LoadingBlock rows={3} />)}
            {isSuperAdmin && <RechargeHistory />}
            {!data.gateway.is_configured && data.gateway.live && !isSuperAdmin && (
              <p className="flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[13px]"><BadgeCheck className="size-4 text-amber" />The Super Admin still needs to add the Reve SMS keys.</p>
            )}
            <Templates templates={data.templates} rate={data.gateway.rate_paisa} sender={data.gateway.sender_id} canEdit={canEdit} />
            <EmailCard key={JSON.stringify(data.email)} email={data.email} canEdit={canEdit} />
            <SmsLog />
          </>
        )}
      </SettingsShell>
    </>
  )
}
