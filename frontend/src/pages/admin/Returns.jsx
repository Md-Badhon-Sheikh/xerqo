import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Btn, Card, PageHead, KPIs, Select, Tabs, Textarea, Two, Col, Thumb, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, MoneyInput, Paginator, Spin, SwitchRow } from '../../components/admin/form'
import { RETURN_STATUS, ReturnBadge, Tk, fmtDateTime, shortTk } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'
import { useSettings } from '../../lib/queries'

const TABS = [['Requested', 'pending'], ['Approved', 'approved'], ['Received', 'received'], ['Completed', 'completed'], ['Rejected', 'rejected'], ['All', '']]
const FLOW = ['pending', 'approved', 'received', 'completed']
// what staff can do from each status
const NEXT = { pending: ['approved', 'rejected'], approved: ['received', 'rejected'], received: ['completed'], completed: [], rejected: [] }
const ACTION = { approved: 'Approve return', rejected: 'Reject', received: 'Parcel received', completed: 'Complete' }

function ReturnCard({ r, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cx('w-full space-y-3 rounded-xl border bg-white p-3.5 text-left sm:p-4', active ? 'border-tan ring-1 ring-tan' : 'border-aline hover:border-tan/40')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold">RT-{r.id} · #{r.order_number}</p>
        <ReturnBadge s={r.status} />
      </div>
      <div className="flex items-center gap-3">
        <Thumb src={r.item?.image || '/images/logo.png'} size={42} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{r.item?.name}{r.qty > 1 ? ` × ${r.qty}` : ''}</p>
          <p className="truncate text-xs text-amute">{r.customer?.name} · {r.reason}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold">{Tk(r.amount)}</p>
          <p className="text-[11px] font-semibold capitalize text-tan">{r.resolution}</p>
        </div>
      </div>
    </button>
  )
}

function Detail({ r, onDone }) {
  const { can } = useAdminAuth()
  const [resolution, setResolution] = useState(r.resolution)
  const [amount, setAmount] = useState(String(r.amount ?? ''))
  const [note, setNote] = useState(r.admin_note ?? '')
  const [restock, setRestock] = useState(true)
  const save = useAdminMutation((body) => adminApi.put(`/admin/returns/${r.id}`, body), {
    invalidate: ['returns', 'orders', 'inventory'],
    success: (res) => `Return ${RETURN_STATUS[res.data.status]?.[0].toLowerCase()}`,
    onSuccess: onDone,
  })
  const step = FLOW.indexOf(r.status)
  const move = async (status) => {
    if (status === 'rejected' && !note.trim()) { setNote(''); document.getElementById('return-note')?.focus(); return }
    if (status === 'completed' && resolution === 'refund' && !(await confirm({ title: `Refund ${Tk(amount)}?`, text: 'Send the money to the customer first (bKash, Nagad or bank), then mark it completed here.', confirmText: 'Mark refunded' }))) return
    save.mutate({ status, resolution, amount: Number(amount) || 0, admin_note: note || null, ...(status === 'received' ? { restock } : {}) })
  }

  return (
    <Card title={`RT-${r.id} · ${r.item?.name ?? 'Item'}`} sub={`Requested ${fmtDateTime(r.created_at)} · order #${r.order_number}`}>
      <div className="space-y-2.5">
        <p className="text-[13px]"><b>{r.customer?.name}</b> · {r.customer?.phone} · <Link to={`/admin/orders/${r.order_number}`} className="font-semibold text-tan">Open order</Link></p>
        <p className="text-[13px]"><span className="text-amute">Reason:</span> {r.reason}{r.qty > 1 ? ` · ${r.qty} pcs` : ''}</p>
        {r.details && <p className="text-[13px] text-amute">“{r.details}”</p>}
        {r.photos?.length > 0 && <div className="flex flex-wrap gap-2">{r.photos.map((src) => <a key={src} href={src} target="_blank" rel="noreferrer"><img src={src} alt="Customer photo" className="size-[72px] rounded-lg object-cover" /></a>)}</div>}
      </div>
      {r.status !== 'rejected' && (
        <div className="flex flex-wrap gap-1.5">
          {FLOW.map((s, i) => <span key={s} className={cx('rounded-full px-2.5 py-1 text-[11px] font-semibold', i <= step ? 'bg-tan text-white' : 'bg-asoft text-amute')}>{RETURN_STATUS[s][0]}</span>)}
        </div>
      )}
      {NEXT[r.status].length > 0 && can('returns', 'edit') ? (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField label="Resolution"><Select search={false} options={[{ value: 'refund', label: 'Refund' }, { value: 'exchange', label: 'Exchange' }]} value={resolution} onChange={setResolution} /></FormField>
            {resolution === 'refund' && <FormField label="Refund amount"><MoneyInput value={amount} onChange={setAmount} /></FormField>}
          </div>
          {r.status === 'approved' && <SwitchRow label="Put the item back into stock" sub="When the parcel arrives in good condition" checked={restock} onChange={setRestock} />}
          <FormField label="Note to customer / reason" help="Required when rejecting"><Textarea id="return-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></FormField>
          <div className="flex gap-2.5">
            {NEXT[r.status].map((s) => (
              <Btn key={s} v={s === 'rejected' ? 'danger' : 'green'} className={s === 'rejected' ? '' : 'flex-1'} disabled={save.isPending || (s === 'rejected' && !note.trim())} onClick={() => move(s)}>
                {save.isPending && <Spin />}{ACTION[s]}
              </Btn>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-asoft px-3.5 py-3 text-[13px] text-amute">{r.status === 'completed' ? `Closed ${fmtDateTime(r.resolved_at)} · ${r.resolution === 'refund' ? `refunded ${Tk(r.amount)}` : 'exchanged'}` : r.status === 'rejected' ? 'This request was rejected.' : 'You can view this return but not change it.'}{r.admin_note ? ` · “${r.admin_note}”` : ''}</p>
      )}
    </Card>
  )
}

export default function AdminReturns() {
  const [f, setF] = useState({ status: 'pending', page: 1 })
  const [sel, setSel] = useState(null)
  const { data, isPending } = useAdminList('returns', { ...f, per_page: 15 })
  const windowDays = useSettings().data?.returns?.window_days ?? 7
  const list = data?.data ?? []
  const counts = data?.counts
  const current = list.find((r) => r.id === sel) ?? list[0]

  return (
    <>
      <PageHead title="Returns & refunds" sub={`${windowDays}-day return window · approve, receive and refund`} />
      <KPIs items={counts ? [
        ['New requests', String(counts.pending), counts.pending ? 'Reply within 24h' : 'All handled', counts.pending ? 'amber' : 'green'],
        ['Waiting for parcel', String(counts.approved), 'Approved, not received', 'gray'],
        ['To refund / exchange', String(counts.received), 'Received in warehouse', counts.received ? 'amber' : 'gray'],
        ['Refunded this month', shortTk(data.refunded_this_month ?? 0), `${counts.completed} completed all time`, 'gray'],
      ] : [['New requests', '…'], ['Waiting for parcel', '…'], ['To refund / exchange', '…'], ['Refunded this month', '…']]} />
      <Tabs items={TABS.map(([l, k]) => [l, k ? counts?.[k] : counts?.all, k])} active={f.status} onChange={(status) => { setF({ status, page: 1 }); setSel(null) }} />
      <Two ratio="even">
        <Col>
          {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title="No return requests here" text="Customers request returns from their delivered orders." /> : (
            <>
              {list.map((r) => <ReturnCard key={r.id} r={r} active={current?.id === r.id} onClick={() => setSel(r.id)} />)}
              <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} />
            </>
          )}
        </Col>
        <Col>{current ? <Detail key={`${current.id}-${current.status}`} r={current} onDone={() => setSel(current.id)} /> : <Card title="Return details"><p className="text-[13px] text-amute">Select a request to review it.</p></Card>}</Col>
      </Two>
    </>
  )
}
