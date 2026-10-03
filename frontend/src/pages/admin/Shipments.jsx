import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Printer, Truck } from 'lucide-react'
import { Btn, Card, KPIs, PageHead, PayChip, Select, Tabs, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox, Spin } from '../../components/admin/form'
import { COURIERS, OrderBadge, Tk, ago, shortTk } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirm, toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'

const TABS = [['To ship', 'ship'], ['In transit', 'transit'], ['Delivered', 'delivered']]
const PARAMS = { ship: { statuses: ['confirmed', 'processing'] }, transit: { status: 'shipped' }, delivered: { status: 'delivered' } }

// one order: courier + tracking + the next step
function ShipRow({ o, tab, canEdit, onDone }) {
  const [courier, setCourier] = useState(o.courier ?? '')
  const [tracking, setTracking] = useState(o.tracking_code ?? '')
  const [busy, setBusy] = useState(false)
  const cod = o.payment_method === 'cod' && o.payment_status !== 'paid'

  const run = async (fn, msg) => {
    setBusy(true)
    try { await fn(); toast.success(msg); onDone() } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  const ship = async () => {
    if (!tracking && !(await confirm({ title: 'Ship without a tracking number?', text: 'You can add it later from this page.', confirmText: 'Mark as shipped' }))) return
    run(async () => {
      if (o.status === 'confirmed') await adminApi.patch(`/admin/orders/${o.order_number}/status`, { status: 'processing' })
      await adminApi.patch(`/admin/orders/${o.order_number}/status`, { status: 'shipped', courier: courier || null, tracking_code: tracking || null })
    }, `#${o.order_number} shipped — customer notified`)
  }
  const saveTracking = () => run(() => adminApi.put(`/admin/orders/${o.order_number}`, { courier: courier || null, tracking_code: tracking || null }), 'Tracking saved')
  const deliver = async () => {
    if (!(await confirm({ title: `Mark #${o.order_number} as delivered?`, text: cod ? `Cash ${Tk(o.total)} is recorded as collected.` : undefined, confirmText: 'Mark delivered' }))) return
    run(() => adminApi.patch(`/admin/orders/${o.order_number}/status`, { status: 'delivered' }), `#${o.order_number} delivered`)
  }
  const changed = courier !== (o.courier ?? '') || tracking !== (o.tracking_code ?? '')

  return (
    <div className="grid gap-3 rounded-xl border border-aline bg-white p-3.5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold"><Link to={`/admin/orders/${o.order_number}`} className="hover:text-tan">#{o.order_number}</Link><OrderBadge s={o.status} /><PayChip m={o.payment_method} /></p>
        <p className="truncate text-xs text-amute">{o.name} · {o.phone} · {o.district}</p>
        <p className="text-xs">{o.items_count} item(s) · {cod ? <b className="text-tan">Collect {Tk(o.total)}</b> : <span className="text-ok">Paid</span>} · {ago(o.created_at)}</p>
      </div>
      {tab === 'delivered' ? (
        <p className="text-[13px] text-amute">{o.courier ? `${o.courier}${o.tracking_code ? ` · ${o.tracking_code}` : ''}` : 'No courier recorded'}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Select search={false} placeholder="Courier" options={COURIERS} value={courier} onChange={setCourier} disabled={!canEdit} />
          <input className="ainput" value={tracking} onChange={(e) => setTracking(e.target.value.trim())} placeholder="Tracking no." disabled={!canEdit} aria-label="Tracking number" />
        </div>
      )}
      {canEdit && tab !== 'delivered' && (
        <div className="flex gap-2">
          {tab === 'transit' && changed && <Btn v="white" sm disabled={busy} onClick={saveTracking}>Save</Btn>}
          {tab === 'ship' && <Btn sm icon={Truck} disabled={busy} onClick={ship}>{busy && <Spin />}Mark shipped</Btn>}
          {tab === 'transit' && <Btn v="green" sm icon={Check} disabled={busy} onClick={deliver}>{busy && <Spin />}Delivered</Btn>}
          <Btn v="white" sm icon={Printer} aria-label="Packing slip" onClick={() => window.open(`/admin/invoice/${o.order_number}`, '_blank')} />
        </div>
      )}
    </div>
  )
}

export default function Shipments() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('ship')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, isPending, isPlaceholderData } = useAdminList('orders', { ...PARAMS[tab], q, page, per_page: 15 })
  const orders = data?.data ?? []
  const counts = data?.counts
  const toShip = counts ? counts.confirmed + counts.processing : undefined

  return (
    <>
      <PageHead title="Shipping" sub="Hand parcels to the courier, record the tracking number and close deliveries · courier API booking comes later" />
      <KPIs items={counts ? [
        ['To ship', String(toShip), 'Confirmed + processing', toShip ? 'amber' : 'green'],
        ['In transit', String(counts.shipped), 'With the courier', 'gray'],
        ['Delivered', String(counts.delivered), 'All time', 'green'],
        ['COD in the field', data?.summary ? shortTk(data.summary.cod_open) : '…', 'Cash still to collect', 'gray'],
      ] : [['To ship', '…'], ['In transit', '…'], ['Delivered', '…'], ['COD in the field', '…']]} />
      <Tabs items={TABS.map(([l, k]) => [l, k === 'ship' ? toShip : k === 'transit' ? counts?.shipped : counts?.delivered, k])} active={tab} onChange={(t) => { setTab(t); setPage(1) }} />
      <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search order, name or phone" className="flex-none" />
      {isPending ? <LoadingBlock /> : !orders.length ? (
        <EmptyBlock title={tab === 'ship' ? 'Nothing waiting to ship' : tab === 'transit' ? 'No parcels in transit' : 'No deliveries yet'} />
      ) : (
        <div className={cx('space-y-2.5 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {orders.map((o) => <ShipRow key={`${o.id}-${o.status}`} o={o} tab={tab} canEdit={can('orders', 'edit')} onDone={() => qc.invalidateQueries({ queryKey: ['admin'] })} />)}
          <Paginator meta={data?.meta} onPage={setPage} />
        </div>
      )}
      <Card title="Couriers"><p className="text-[13px] text-amute">Steadfast, Pathao and RedX API booking (consignment, live tracking, COD settlement) will plug in here later. For now pick the courier, type the consignment number and the customer gets it in their tracking page and SMS.</p></Card>
    </>
  )
}
