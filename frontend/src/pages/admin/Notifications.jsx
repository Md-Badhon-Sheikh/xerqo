import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bell, Check, ClipboardList, Layers, MessageSquare, Star, Undo2, Wallet, X } from 'lucide-react'
import { Btn, Card, Col, PageHead, Tabs, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, Spin } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { adminApi } from '../../lib/api'
import { toast } from '../../lib/alert'
import { useAdminList, useAdminMutation } from '../../lib/adminQueries'

const TILE = { tan: 'bg-tan/12 text-tan', amber: 'bg-amber/12 text-amber', red: 'bg-bad/10 text-bad', green: 'bg-ok/10 text-ok', blue: 'bg-info/10 text-info' }
const ICON = { new_order: ClipboardList, payment: Wallet, review: Star, return: Undo2, low_stock: Layers, sms_balance: MessageSquare }
const TABS = [['All', ''], ['Orders', 'orders'], ['Reviews', 'reviews'], ['Returns', 'returns'], ['Stock', 'stock'], ['System', 'system']]
const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()

function Feed({ list, onOpen, onDismiss }) {
  const groups = [['Today', list.filter((n) => isToday(n.created_at))], ['Earlier', list.filter((n) => !isToday(n.created_at))]]
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white">
      {groups.map(([g, items]) => items.length > 0 && (
        <div key={g}>
          <p className="border-b border-aline bg-asoft px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-amute">{g}</p>
          <ul className="divide-y divide-aline border-b border-aline last:border-b-0">
            {items.map((n) => {
              const Icon = ICON[n.event] ?? Bell
              return (
                <li key={n.id} className={cx('flex gap-3.5 px-4 py-3.5', !n.read && 'bg-abg/70')}>
                  <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', TILE[n.tone] ?? TILE.tan)}><Icon className="size-[17px]" /></span>
                  <button type="button" onClick={() => onOpen(n)} className="min-w-0 flex-1 text-left">
                    <p className="text-[13px] font-semibold hover:text-tan">{n.title}</p>
                    <p className="text-xs text-amute">{n.body}</p>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-amute">{ago(n.created_at)}</span>
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="size-1.5 rounded-full bg-tan" aria-label="Unread" />}
                      <button type="button" onClick={() => onDismiss(n)} aria-label="Dismiss" className="text-amute hover:text-bad"><X className="size-3.5" /></button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Box({ on, onClick, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={cx('grid size-4 place-items-center rounded border', on ? 'border-tan bg-tan text-white' : 'border-[#CFC3B5] bg-white')}>
      {on && <Check className="size-3" strokeWidth={3} />}
    </button>
  )
}

function Preferences() {
  const { data, isPending } = useAdminList('notifications/preferences')
  const [draft, setDraft] = useState(null)
  const rows = draft ?? data?.data ?? []
  const flip = (event, channel) => setDraft(rows.map((r) => (r.event === event ? { ...r, [channel]: !r[channel] } : r)))
  const save = useAdminMutation(() => adminApi.put('/admin/notifications/preferences', { prefs: Object.fromEntries(rows.map((r) => [r.event, { app: r.app, email: r.email }])) }), {
    invalidate: ['notifications/preferences'], success: 'Preferences saved', onSuccess: () => setDraft(null),
  })
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('xq_order_sound') === '1' } catch { return false } })
  const toggleSound = () => { const next = !sound; setSound(next); try { localStorage.setItem('xq_order_sound', next ? '1' : '0') } catch { /* storage blocked */ } }

  return (
    <Card title="Notification preferences" sub="Only alerts for sections your role can open are listed">
      {isPending ? <LoadingBlock rows={3} /> : <>
        <table className="w-full text-[13px]">
          <thead className="text-[11px] uppercase tracking-wider text-amute">
            <tr><th className="pb-2 text-left font-semibold">Event</th><th className="w-16 pb-2 font-semibold normal-case tracking-normal">In-app</th><th className="w-16 pb-2 font-semibold normal-case tracking-normal">Email</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.event}>
                <td className="py-2">{r.label}</td>
                {['app', 'email'].map((ch) => <td key={ch} className="py-2"><div className="grid place-items-center"><Box on={r[ch]} onClick={() => flip(r.event, ch)} label={`${r.label} ${ch === 'app' ? 'in-app' : 'email'}`} /></div></td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex w-full items-center justify-between gap-3 border-t border-aline pt-3 text-[13px]">
          <span><span className="block font-medium">Sound on new orders</span><span className="block text-[11px] text-amute">A short chime while the admin is open in this browser</span></span>
          <Box on={sound} onClick={toggleSound} label="Sound on new orders" />
        </div>
        <Btn disabled={!draft || save.isPending} onClick={() => save.mutate()}>{save.isPending && <Spin />}Save preferences</Btn>
      </>}
    </Card>
  )
}

export default function AdminNotifications() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [f, setF] = useState({ category: '', page: 1 })
  const { data, isPending, isPlaceholderData } = useAdminList('notifications', f)
  const list = data?.data ?? []
  const refresh = () => ['notifications', 'badges'].forEach((k) => qc.invalidateQueries({ queryKey: ['admin', k] }))

  const markAll = async () => {
    try { await adminApi.post('/admin/notifications/read'); refresh(); toast.success('All caught up') } catch (e) { toast.error(e.message) }
  }
  const open = async (n) => {
    if (!n.read) adminApi.post('/admin/notifications/read', { ids: [n.id] }).then(refresh).catch(() => {})
    if (n.link) navigate(n.link)
  }
  const dismiss = async (n) => {
    try { await adminApi.del(`/admin/notifications/${n.id}`); refresh() } catch (e) { toast.error(e.message) }
  }

  return (
    <>
      <PageHead
        title="Notifications"
        sub={data ? `${data.unread} unread · alerts for orders, payments, reviews, returns and stock` : 'Loading…'}
        actions={<Btn v="white" icon={Check} onClick={markAll} disabled={!data?.unread}><span className="sm:hidden">Mark read</span><span className="max-sm:hidden">Mark all as read</span></Btn>}
      />
      <Tabs items={TABS.map(([l, k]) => [l, k ? data?.counts?.[k] : data?.counts?.all, k])} active={f.category} onChange={(category) => setF({ category, page: 1 })} />
      <Two ratio="wide">
        <Col className={cx('transition-opacity', isPlaceholderData && 'opacity-60')}>
          {isPending ? <LoadingBlock /> : !list.length ? <EmptyBlock title="Nothing here" text="New orders, payments to verify, reviews, returns and low stock show up here." /> : <>
            <Feed list={list} onOpen={open} onDismiss={dismiss} />
            <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} />
          </>}
        </Col>
        <Col><Preferences /></Col>
      </Two>
    </>
  )
}
