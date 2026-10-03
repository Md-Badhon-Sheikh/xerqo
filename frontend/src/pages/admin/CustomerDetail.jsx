import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Package, Phone } from 'lucide-react'
import { Avatar, Badge, Btn, Card, Col, KPIs, KV, Textarea, Thumb, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Spin, SwitchRow } from '../../components/admin/form'
import { OrderBadge, Tk, ago, fmtDate, fmtDateTime } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm, promptAndRun, toast } from '../../lib/alert'
import { useAdminItem, useAdminMutation } from '../../lib/adminQueries'
import { prettyPhone } from '../../lib/bd'
import { SegmentBadge } from './Customers'

const DOT = { order: 'bg-tan', delivered: 'bg-ok', review: 'bg-amber', return: 'bg-bad', account: 'bg-info', login: 'bg-amute' }

function RiskCard({ c, canEdit }) {
  const [note, setNote] = useState(c.admin_note ?? '')
  const save = useAdminMutation((body) => adminApi.patch(`/admin/customers/${c.id}`, body), { invalidate: ['customers'] })
  const toggle = async (field, value) => {
    const text = {
      cod_blocked: value ? 'They will only see bKash, Nagad, Rocket and bank transfer at checkout.' : 'Cash on delivery becomes available to them again.',
      is_active: value ? 'They can sign in and order again.' : 'They are signed out everywhere and cannot sign in or order.',
    }[field]
    const title = field === 'cod_blocked' ? (value ? `Block COD for ${c.name}?` : 'Allow COD again?') : (value ? 'Enable this account?' : `Disable ${c.name}’s account?`)
    if (!(await confirm({ title, text, confirmText: 'Yes, continue', danger: (field === 'cod_blocked' && value) || (field === 'is_active' && !value) }))) return
    save.mutate({ [field]: value }, { onSuccess: () => toast.success('Customer updated') })
  }
  const rate = c.success_rate
  const tone = rate == null ? ['bg-asoft', 'text-amute', 'No finished parcels yet'] : rate >= 90 ? ['bg-ok/8', 'text-ok', 'Low risk'] : rate >= 60 ? ['bg-amber/10', 'text-amber', 'Medium risk'] : ['bg-bad/8', 'text-bad', 'High risk']

  return (
    <Card title="Risk & notes" className="md:col-span-2 xl:col-span-1">
      <div className={cx('rounded-lg px-3.5 py-3', tone[0])}>
        <p className={cx('text-[13px] font-semibold', tone[1])}>{tone[2]}{rate != null && ` · ${rate}% delivery success`}</p>
        <p className="mt-0.5 text-[11px] text-amute">{c.delivered} delivered · {c.returned} returned / refused</p>
      </div>
      <div className="space-y-2">
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={!canEdit} maxLength={2000} placeholder="Internal note — only staff see this (e.g. prefers evening delivery)" />
        {canEdit && note !== (c.admin_note ?? '') && (
          <Btn sm disabled={save.isPending} onClick={() => save.mutate({ admin_note: note || null }, { onSuccess: () => toast.success('Note saved') })}>{save.isPending && <Spin />}Save note</Btn>
        )}
      </div>
      <SwitchRow label="Block cash on delivery" sub="Must pay in advance" checked={c.cod_blocked} onChange={(v) => toggle('cod_blocked', v)} disabled={!canEdit || save.isPending} />
      <SwitchRow label="Account active" sub={c.is_active ? 'Can sign in and order' : 'Disabled — cannot sign in'} checked={c.is_active} onChange={(v) => toggle('is_active', v)} disabled={!canEdit || save.isPending} />
    </Card>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { can } = useAdminAuth()
  const canEdit = can('customers', 'edit')
  const { data: c, isPending, error } = useAdminItem('customers', id)

  if (isPending) return <LoadingBlock rows={8} />
  if (error || !c) return <EmptyBlock title="Customer not found" text={error?.message} action={<Btn v="white" to="/admin/customers">Back to customers</Btn>} />

  const sendSms = () => promptAndRun({
    title: `SMS ${c.name}`, text: `To ${c.phone}. Paid from the SMS balance like any SMS.`, input: 'textarea', placeholder: 'Hi, this is XERQO…', confirmText: 'Send SMS',
    inputAttributes: { maxlength: 670 },
  }, (message) => adminApi.post(`/admin/customers/${c.id}/sms`, { message })).then((res) => { if (res) toast.success(res.message) })

  return (
    <>
      <div className="space-y-3">
        <Link to="/admin/customers" className="inline-flex items-center gap-1.5 text-[13px] text-amute hover:text-ink"><ArrowLeft className="size-3.5" />Customers</Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="max-sm:hidden"><Avatar name={c.name || '?'} size={58} /></span>
            <span className="sm:hidden"><Avatar name={c.name || '?'} size={44} /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold sm:text-[26px]">{c.name}</h1>
                <SegmentBadge s={c.segment} />
                {c.cod_blocked && <Badge tone="red">No COD</Badge>}
                {!c.is_active && <Badge tone="red">Disabled</Badge>}
              </div>
              <p className="text-[13px] text-amute">Customer since {fmtDate(c.created_at)}{c.district ? ` · ${c.district}` : ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Btn v="white" icon={Phone} onClick={() => { window.location.href = `tel:${c.phone}` }}>Call</Btn>
            {canEdit && <Btn v="white" icon={MessageSquare} onClick={sendSms}>SMS</Btn>}
          </div>
        </div>
      </div>

      <KPIs items={[
        ['Total spent', Tk(c.spent), `${c.orders_count} order${c.orders_count === 1 ? '' : 's'}`, 'gray'],
        ['Avg order', Tk(Math.round(c.average_order))],
        ['Courier success', c.success_rate == null ? '—' : `${c.success_rate}%`, `${c.delivered} of ${c.delivered + c.returned} delivered`, c.success_rate == null || c.success_rate >= 90 ? 'green' : c.success_rate >= 60 ? 'amber' : 'red'],
        ['Reviews', String(c.reviews_count), c.last_order_at ? `Last order ${ago(c.last_order_at)}` : 'No orders yet', 'gray'],
      ]} />

      <Two ratio="main">
        <Col>
          <Card title="Orders" right={c.orders.length > 0 && <Link to={`/admin/orders?q=${c.phone}`} className="text-xs font-semibold text-tan">Search all</Link>}>
            {!c.orders.length ? <p className="text-[13px] text-amute">No orders yet.</p> : (
              <div className="divide-y divide-aline">{c.orders.map((o) => (
                <Link key={o.id} to={`/admin/orders/${o.order_number}`} className="flex items-center gap-3 py-3 first:pt-0 hover:bg-abg/50">
                  {o.items?.[0]?.image ? <Thumb src={o.items[0].image} size={40} /> : <span className="grid size-10 place-items-center rounded-md bg-asoft"><Package className="size-4 text-amute" /></span>}
                  <div className="min-w-0 flex-1"><p className="text-[13px] font-bold">#{o.order_number}</p><p className="text-xs text-amute">{fmtDate(o.created_at)} · {Tk(o.total)} · {o.items_count} item{o.items_count === 1 ? '' : 's'}</p></div>
                  <OrderBadge s={o.status} />
                </Link>
              ))}</div>
            )}
          </Card>

          <Card title="Activity timeline">
            <ol className="space-y-3.5">
              {c.activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className={cx('mt-1.5 size-[7px] shrink-0 rounded-full', DOT[a.type] ?? 'bg-tan')} />
                  <div><p className="text-[13px]">{a.text}</p><p className="text-[11px] text-amute">{fmtDateTime(a.at)}</p></div>
                </li>
              ))}
            </ol>
          </Card>
        </Col>

        <Col className="md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 xl:block xl:space-y-5">
          <Card title="Contact">
            <KV k="Phone" v={<span className="flex items-center gap-1.5">{prettyPhone(c.phone)}{c.phone_verified && <Badge tone="green">Verified</Badge>}</span>} />
            <KV k="Email" v={c.email || '—'} />
            <KV k="Birthday" v={c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'} />
            <KV k="Last sign-in" v={c.last_login_at ? ago(c.last_login_at) : '—'} />
            <KV k="Order SMS" v={c.notify_order_sms ? 'On' : 'Off'} />
            <KV k="Offers by SMS / email" v={`${c.marketing_sms ? 'Yes' : 'No'} / ${c.marketing_email ? 'Yes' : 'No'}`} />
          </Card>

          <Card title="Addresses">
            {!c.addresses.length ? <p className="text-[13px] text-amute">No saved addresses.</p> : c.addresses.map((a) => (
              <div key={a.id}>
                <p className="text-[13px] font-semibold">{a.label || 'Address'}{a.is_default ? ' (default)' : ''}</p>
                <p className="text-xs text-amute">{a.address_line}{a.area ? `, ${a.area}` : ''}, {a.district}</p>
                {a.phone && a.phone !== c.phone && <p className="text-xs text-amute">{a.name} · {a.phone}</p>}
              </div>
            ))}
          </Card>

          <RiskCard key={`${c.admin_note}-${c.cod_blocked}-${c.is_active}`} c={c} canEdit={canEdit} />

          {c.sms.length > 0 && (
            <Card title="Recent SMS">
              {c.sms.map((m) => (
                <div key={m.id} className="space-y-0.5">
                  <p className="text-xs">{m.message}</p>
                  <p className={cx('text-[11px]', m.status === 'sent' ? 'text-amute' : 'text-amber')}>{m.status} · {ago(m.created_at)}</p>
                </div>
              ))}
            </Card>
          )}
        </Col>
      </Two>
    </>
  )
}

