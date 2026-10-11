import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Mail, MailOpen, MessageCircle, Phone, Trash2 } from 'lucide-react'
import { Badge, Btn, PageHead, Tabs, cx } from '../../components/admin/ui'
import { EmptyBlock, LoadingBlock, Paginator, SearchBox } from '../../components/admin/form'
import { ago } from '../../components/admin/orderUi'
import { useAdminAuth } from '../../context/AuthContext'
import { confirmAndRun, toast } from '../../lib/alert'
import { adminApi } from '../../lib/api'
import { waLink } from '../../lib/bd'
import { useAdminList } from '../../lib/adminQueries'

// Admin › Messages: what customers sent from the storefront Contact page
const TABS = [['All', ''], ['Unread', 'unread'], ['Read', 'read']]

function Message({ m, canEdit, canDelete, onChange }) {
  const [open, setOpen] = useState(false)
  const setRead = async (read) => {
    try { await adminApi.patch(`/admin/messages/${m.id}`, { read }); onChange() } catch (e) { toast.error(e.message) }
  }
  const toggle = () => {
    setOpen((o) => !o)
    if (!open && !m.read && canEdit) setRead(true)
  }
  const remove = () => confirmAndRun(
    { title: 'Delete this message?', text: `From ${m.name}. This can’t be undone.`, confirmText: 'Delete', danger: true },
    async () => { await adminApi.del(`/admin/messages/${m.id}`); toast.success('Message deleted'); onChange() },
  )
  const wa = waLink(m.phone)
  return (
    <li className={cx('px-4 py-3.5', !m.read && 'bg-abg/70')}>
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
        <span className={cx('mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg', m.read ? 'bg-asoft text-amute' : 'bg-info/10 text-info')}>{m.read ? <MailOpen className="size-[17px]" /> : <Mail className="size-[17px]" />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cx('text-[13px]', !m.read && 'font-semibold')}>{m.name}</span>
            {m.subject && <Badge tone="gray">{m.subject}</Badge>}
            {!m.read && <Badge tone="blue">New</Badge>}
            <span className="ml-auto text-[11px] text-amute">{ago(m.created_at)}</span>
          </span>
          <span className={cx('mt-0.5 block text-xs text-amute', !open && 'line-clamp-1')}>{open ? `${m.phone}${m.order_number ? ` · Order ${m.order_number}` : ''}` : m.message}</span>
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-3 pl-12">
          <p className="whitespace-pre-line rounded-lg bg-asoft p-3 text-[13px] leading-relaxed">{m.message}</p>
          {m.attachment_url && <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block w-fit"><img src={m.attachment_url} alt="Attached photo" className="max-h-48 rounded-lg border border-aline object-contain" /></a>}
          <div className="flex flex-wrap gap-2">
            <Btn v="white" sm icon={Phone} onClick={() => { window.location.href = `tel:${m.phone}` }}>Call</Btn>
            {wa && <Btn v="white" sm icon={MessageCircle} onClick={() => window.open(wa, '_blank')}>WhatsApp</Btn>}
            {m.order_number && <Btn v="white" sm to={`/admin/orders/${encodeURIComponent(m.order_number.replace(/^#/, ''))}`}>Open order</Btn>}
            {m.customer_id && <Btn v="white" sm to={`/admin/customers/${m.customer_id}`}>Customer</Btn>}
            {canEdit && m.read && <Btn v="white" sm onClick={() => setRead(false)}>Mark unread</Btn>}
            {canDelete && <Btn v="white" sm icon={Trash2} onClick={remove} className="text-bad">Delete</Btn>}
          </div>
        </div>
      )}
    </li>
  )
}

export default function AdminMessages() {
  const { can } = useAdminAuth()
  const qc = useQueryClient()
  const [f, setF] = useState({ status: '', q: '', page: 1 })
  const { data, isPending, isPlaceholderData } = useAdminList('messages', f)
  const list = data?.data ?? []
  const refresh = () => ['messages', 'badges'].forEach((k) => qc.invalidateQueries({ queryKey: ['admin', k] }))
  return (
    <>
      <PageHead title="Messages" sub={data ? `${data.counts.unread} unread · sent from the Contact page` : 'Loading…'} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs items={TABS.map(([l, k]) => [l, k === 'unread' ? data?.counts?.unread || null : null, k])} active={f.status} onChange={(status) => setF({ ...f, status, page: 1 })} />
        <SearchBox value={f.q} onChange={(q) => setF({ ...f, q, page: 1 })} placeholder="Name, phone, order or text…" className="sm:w-72" />
      </div>
      {isPending ? <LoadingBlock /> : !list.length ? (
        <EmptyBlock title="No messages" text={f.q || f.status ? 'Nothing matches this filter.' : <>Messages sent from the <Link to="/contact" target="_blank" className="font-semibold text-tan">Contact page</Link> show up here.</>} />
      ) : (
        <div className={cx('space-y-3 transition-opacity', isPlaceholderData && 'opacity-60')}>
          <ul className="divide-y divide-aline overflow-hidden rounded-xl border border-aline bg-white">
            {list.map((m) => <Message key={m.id} m={m} canEdit={can('customers', 'edit')} canDelete={can('customers', 'delete')} onChange={refresh} />)}
          </ul>
          <Paginator meta={data?.meta} onPage={(page) => setF({ ...f, page })} />
        </div>
      )}
    </>
  )
}
