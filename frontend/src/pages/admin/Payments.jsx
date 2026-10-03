import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Swal from 'sweetalert2'
import { Check, FileText, X } from 'lucide-react'
import { Btn, Card, PageHead, KPIs, PayChip, Tabs, Two, Col, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox } from '../../components/admin/form'
import { PaymentBadge, Tk, ago, shortTk } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi, api } from '../../lib/api'
import { confirm, toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'

const TABS = [['To verify', 'pending', 'pending'], ['Verified', 'verified', 'verified'], ['Rejected', 'rejected', 'rejected'], ['All', null, '']]
const isImage = (url) => /\.(jpe?g|png|webp|gif)$/i.test(url || '')
const METHOD_NAME = { bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', bank: 'Bank transfer' }

function Proof({ url }) {
  if (!url) return <span className="text-[11px] text-amute">No file</span>
  return isImage(url)
    ? <button type="button" onClick={() => Swal.fire({ imageUrl: url, imageAlt: 'Payment proof', showConfirmButton: false, showCloseButton: true, width: 640 })} className="block size-10 overflow-hidden rounded-md border border-aline" aria-label="View proof"><img src={url} alt="" className="size-full object-cover" /></button>
    : <a href={url} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-md border border-aline text-tan" aria-label="Open proof"><FileText className="size-4" /></a>
}

export default function AdminPayments() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [f, setF] = useState({ status: 'pending', q: '', page: 1 })
  const { data, isPending } = useAdminList('payments', { ...f, per_page: 20 })
  const { data: orders } = useAdminList('orders', { per_page: 1 })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  const list = data?.data ?? []
  const s = data?.summary
  const canEdit = can('payments', 'edit')

  const act = async (p, action) => {
    let body = {}
    if (action === 'reject') {
      const res = await Swal.fire({
        icon: 'warning', title: `Reject ${Tk(p.amount)} for #${p.order.order_number}?`, input: 'textarea', inputLabel: 'Reason (sent to the customer by SMS)',
        showCancelButton: true, confirmButtonText: 'Reject payment', reverseButtons: true, buttonsStyling: false,
        customClass: { confirmButton: 'xq-swal-btn xq-swal-danger', cancelButton: 'xq-swal-btn xq-swal-cancel', input: 'ainput !mx-6 !w-auto' },
        inputValidator: (v) => (!v?.trim() ? 'Tell the customer why' : undefined),
      })
      if (!res.isConfirmed) return
      body = { note: res.value }
    } else if (!(await confirm({ title: `Verify ${Tk(p.amount)}?`, text: `${METHOD_NAME[p.method]}${p.transaction_id ? ` · TxnID ${p.transaction_id}` : ''}${p.sender_number ? ` · from ${p.sender_number}` : ''} — order #${p.order.order_number}. Only verify after you see the money in your account.`, confirmText: 'Verify payment' }))) return
    try {
      await adminApi.patch(`/admin/payments/${p.id}/${action}`, body)
      toast.success(action === 'verify' ? 'Payment verified — order confirmed' : 'Payment rejected — customer notified')
      qc.invalidateQueries({ queryKey: ['admin'] })
    } catch (e) { toast.error(e.message) }
  }

  const accounts = Object.entries(settings?.payments ?? {}).filter(([k, c]) => k !== 'cod' && c?.enabled)

  return (
    <>
      <PageHead title="Payments & COD" sub="Check manual payments against your bKash / Rocket / Nagad statements and bank account" />
      <KPIs items={s ? [
        ['Waiting to verify', String(s.pending), s.pending ? `${shortTk(s.pending_amount)} to check` : 'All caught up', s.pending ? 'amber' : 'green'],
        ['Verified payments', String(s.verified), shortTk(s.verified_amount), 'gray'],
        ['Rejected', String(s.rejected), 'Customers asked to resend', 'gray'],
        ['COD to collect', orders?.summary ? shortTk(orders.summary.cod_open) : '…', 'Confirmed → shipped orders', 'gray'],
      ] : [['Waiting to verify', '…'], ['Verified payments', '…'], ['Rejected', '…'], ['COD to collect', '…']]} />

      <Two ratio="main">
        <Col>
          <Tabs items={TABS.map(([l, key, v]) => [l, key ? s?.[key] : undefined, v])} active={f.status} onChange={(status) => setF({ ...f, status, page: 1 })} />
          <SearchBox value={f.q} onChange={(q) => setF({ ...f, q, page: 1 })} placeholder="Search TxnID, phone or order number" className="flex-none" />
          {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title={f.status === 'pending' ? 'Nothing to verify' : 'No payments here'} text={f.status === 'pending' ? 'New bKash, Rocket, Nagad and bank payments show up here.' : undefined} /> : (
            <div className="space-y-2.5">
              {list.map((p) => (
                <div key={p.id} className={cx('flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3.5 sm:flex-nowrap sm:gap-4', p.status === 'pending' ? 'border-amber/40' : 'border-aline')}>
                  <Proof url={p.proof} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold"><Link to={`/admin/orders/${p.order.order_number}`} className="hover:text-tan">#{p.order.order_number}</Link><PayChip m={p.method} /><PaymentBadge s={p.status} /></p>
                    <p className="truncate text-xs text-amute">{p.order.name} · {p.order.phone}</p>
                    <p className="truncate text-xs">{p.transaction_id ? <>TxnID <b>{p.transaction_id}</b></> : 'No transaction ID'}{p.sender_number ? <> · from <b>{p.sender_number}</b></> : ''} · {ago(p.created_at)}</p>
                    {p.admin_note && <p className={cx('truncate text-[11px]', p.status === 'rejected' ? 'text-bad' : 'text-amute')}>“{p.admin_note}”{p.verified_by ? ` — ${p.verified_by}` : ''}</p>}
                  </div>
                  <p className="text-base font-bold">{Tk(p.amount)}</p>
                  {p.status === 'pending' && canEdit && (
                    <div className="flex gap-2 max-sm:w-full">
                      <Btn v="danger" sm icon={X} className="max-sm:flex-1" onClick={() => act(p, 'reject')}>Reject</Btn>
                      <Btn v="green" sm icon={Check} className="max-sm:flex-1" onClick={() => act(p, 'verify')}>Verify</Btn>
                    </div>
                  )}
                </div>
              ))}
              <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} />
            </div>
          )}
        </Col>
        <Col>
          <Card title="Payment accounts" sub="Shown to customers at checkout" right={can('settings', 'view') && <Link to="/admin/settings#payments" className="text-xs font-semibold text-tan">Edit</Link>}>
            {accounts.length ? accounts.map(([k, c]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-aline pb-3 text-[13px] last:border-0 last:pb-0">
                <PayChip m={k} />
                <span className="text-right">{k === 'bank' ? <>{c.bank_name}<br /><span className="text-amute">{c.account_number}</span></> : <>{c.number}<br /><span className="text-amute">{c.account_type}</span></>}</span>
              </div>
            )) : <p className="text-[13px] text-amute">Only Cash on Delivery is switched on.</p>}
          </Card>
          <Card title="How to verify">
            <ol className="list-decimal space-y-1.5 pl-4 text-[13px] text-amute">
              <li>Find the TxnID in your bKash / Rocket / Nagad merchant statement, or the deposit in your bank account.</li>
              <li>Check the amount matches the order total.</li>
              <li>Verify — the order is confirmed and the customer gets an SMS. Reject with a reason if it doesn’t match.</li>
            </ol>
            <p className="text-[11px] text-amute">Online payment gateways can be added later; until then every non-COD payment is checked by hand here.</p>
          </Card>
        </Col>
      </Two>
    </>
  )
}
