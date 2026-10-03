import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, Download, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react'
import { Btn, Card, Col, PageHead, Select, Tabs, Two, cx } from '../../components/admin/ui'
import { EmptyBlock, FormField, LoadingBlock, MoneyInput, Paginator, Spin, TextInput } from '../../components/admin/form'
import { METHOD_LABEL, Tk, fmtDate, shortTk } from '../../components/admin/orderUi'
import DateRange, { fmtRange, rangeFor } from '../../components/admin/DateRange'
import { useAdminAuth } from '../../context/AuthContext'
import { adminApi } from '../../lib/api'
import { confirmAndRun, toast } from '../../lib/alert'
import { useAdminList } from '../../lib/adminQueries'

const CATEGORIES = { materials: 'Leather & materials', packaging: 'Packaging', courier: 'Courier & delivery', marketing: 'Marketing & ads', salary: 'Salaries & wages', rent: 'Rent & utilities', software: 'Website & software', fees: 'Bank & payment fees', other: 'Other' }
const METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank', 'card'].map((m) => ({ value: m, label: m === 'cash' ? 'Cash' : METHOD_LABEL[m] ?? m }))
// local date (toISOString would give yesterday's date before 6 AM in Bangladesh)
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const TODAY = today()
const money = (n) => `${n < 0 ? '−' : ''}${Tk(Math.abs(Math.round(n)))}`
const change = (now, before) => (before ? ((now - before) / Math.abs(before)) * 100 : null)

function Kpi({ label, value, now, before, invert, sub, tone }) {
  const d = change(now, before)
  const good = d == null ? null : invert ? d <= 0 : d >= 0
  return (
    <div className="rounded-xl border border-aline bg-white p-3.5 sm:p-[18px]">
      <p className="text-xs text-amute">{label}</p>
      <p className={cx('mt-1.5 text-xl font-bold sm:text-2xl', tone)}>{value}</p>
      <p className="mt-1 text-xs">{sub && <span className="text-amute">{sub}</span>}{d != null && <span className={cx('font-semibold', good ? 'text-ok' : 'text-bad')}>{sub ? ' · ' : ''}{d >= 0 ? '▲' : '▼'} {Math.abs(d).toFixed(0)}%</span>}</p>
    </div>
  )
}

function InOutChart({ points }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.out]))
  const every = Math.ceil(points.length / 8)
  return (
    <Card title="Money in vs out" right={<div className="flex gap-3 text-[11px] text-amute"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-ok" />In</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-bad/70" />Out</span></div>}>
      <div className="relative h-[150px] sm:h-[180px]">
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ top: `${i * 25}%` }} className="absolute inset-x-0 border-t border-aline/70" />)}
        <div className="absolute inset-0 flex items-end gap-[3px] border-b border-aline sm:gap-1.5">
          {points.map((p) => (
            <div key={p.key} className="flex h-full flex-1 items-end gap-px" title={`${p.label}: in ${Tk(p.income)} · out ${Tk(p.out)}`}>
              <div style={{ height: `${(p.income / max) * 100}%` }} className="min-h-px flex-1 rounded-t-sm bg-ok" />
              <div style={{ height: `${(p.out / max) * 100}%` }} className="min-h-px flex-1 rounded-t-sm bg-bad/70" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-[3px] text-[10px] text-amute sm:gap-1.5">{points.map((p, i) => <span key={p.key} className="flex-1 whitespace-nowrap">{i % every === 0 ? p.label : ''}</span>)}</div>
    </Card>
  )
}

const emptyExpense = () => ({ id: null, spent_on: today(), category: '', amount: '', method: 'cash', description: '', reference: '', receipt: null, receiptUrl: null, remove_receipt: false })

function ExpenseForm({ value, onChange, onDone }) {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const f = value
  const set = (patch) => onChange({ ...f, ...patch })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErrors({})
    const form = new FormData()
    ;['spent_on', 'category', 'amount', 'method', 'description', 'reference'].forEach((k) => form.append(k, f[k] ?? ''))
    if (f.receipt) form.append('receipt', f.receipt)
    if (f.remove_receipt) form.append('remove_receipt', '1')
    try {
      if (f.id) await adminApi.put(`/admin/expenses/${f.id}`, form)
      else await adminApi.post('/admin/expenses', form)
      toast.success(f.id ? 'Expense updated' : 'Expense added')
      qc.invalidateQueries({ queryKey: ['admin', 'accounts'] })
      onDone()
    } catch (err) {
      setErrors(err.fields ?? {})
      if (!Object.keys(err.fields ?? {}).length) toast.error(err.message)
    } finally { setBusy(false) }
  }

  return (
    <Card title={f.id ? 'Edit expense' : 'Add an expense'} sub="Money the business spent — it counts against profit" right={f.id && <button type="button" onClick={onDone} className="text-xs font-semibold text-amute hover:text-ink">Cancel</button>}>
      <form className="space-y-3.5" onSubmit={submit}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="Date" error={errors.spent_on}><input type="date" className="ainput" value={f.spent_on} max={TODAY} onChange={(e) => set({ spent_on: e.target.value })} /></FormField>
          <FormField label="Amount" error={errors.amount}><MoneyInput value={f.amount} onChange={(amount) => set({ amount })} placeholder="0" /></FormField>
        </div>
        <FormField label="Category" error={errors.category}><Select value={f.category} onChange={(category) => set({ category })} placeholder="Choose a category" search={false} options={Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }))} invalid={!!errors.category} /></FormField>
        <FormField label="What was it for?" error={errors.description}><TextInput value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. 200 gift boxes from Nilkhet" maxLength={255} invalid={!!errors.description} /></FormField>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField label="Paid by" error={errors.method}><Select value={f.method} onChange={(method) => set({ method })} search={false} options={METHODS} /></FormField>
          <FormField label="Bill no. / TrxID (optional)" error={errors.reference}><TextInput value={f.reference ?? ''} onChange={(e) => set({ reference: e.target.value })} maxLength={100} /></FormField>
        </div>
        <FormField label="Receipt (optional)" error={errors.receipt} help="Photo or PDF, up to 5 MB">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) set({ receipt: file, remove_receipt: false }) }} />
            <Btn type="button" v="white" sm icon={Paperclip} onClick={() => fileRef.current?.click()}>{f.receipt ? 'Change file' : 'Attach'}</Btn>
            {f.receipt && <span className="max-w-[180px] truncate text-xs">{f.receipt.name}</span>}
            {!f.receipt && f.receiptUrl && !f.remove_receipt && <><a href={f.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-tan">View current</a><button type="button" onClick={() => set({ remove_receipt: true })} className="text-xs text-bad">Remove</button></>}
          </div>
        </FormField>
        <Btn type="submit" icon={f.id ? undefined : Plus} disabled={busy} className="w-full">{busy && <Spin />}{f.id ? 'Save changes' : 'Add expense'}</Btn>
      </form>
    </Card>
  )
}

function Ledger({ data, type, setType, setPage, canEdit, onEdit }) {
  const qc = useQueryClient()
  const remove = async (row) => {
    const done = await confirmAndRun({ title: 'Delete this expense?', text: `${row.title} · ${money(row.amount)}`, confirmText: 'Delete', danger: true }, () => adminApi.del(`/admin/expenses/${row.id}`))
    if (done) { toast.success('Expense deleted'); qc.invalidateQueries({ queryKey: ['admin', 'accounts'] }) }
  }
  const rows = data.ledger
  return (
    <Card title="Ledger" sub="Every taka in and out in this period" bodyClass="space-y-3!">
      <Tabs items={[['All', data.counts.all, ''], ['Money in', data.counts.income, 'income'], ['Refunds', data.counts.refund, 'refund'], ['Expenses', data.counts.expense, 'expense']]} active={type} onChange={(t) => { setType(t); setPage(1) }} />
      {!rows.length ? <p className="py-6 text-center text-[13px] text-amute">Nothing recorded in this period.</p> : (
        <div className="divide-y divide-aline">
          {rows.map((r, i) => (
            <div key={`${r.type}-${r.id ?? i}-${r.date}`} className="flex items-center gap-3 py-3">
              <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', r.amount >= 0 ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}>{r.amount >= 0 ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{r.link ? <Link to={r.link} className="hover:text-tan">{r.title}</Link> : r.title}</p>
                <p className="truncate text-[11px] text-amute">{fmtDate(r.date)}{r.sub ? ` · ${r.sub}` : ''}{r.by ? ` · by ${r.by}` : ''}</p>
              </div>
              {r.receipt && <a href={r.receipt} target="_blank" rel="noreferrer" aria-label="Receipt" className="text-amute hover:text-tan"><Paperclip className="size-3.5" /></a>}
              <p className={cx('shrink-0 text-[13px] font-bold', r.amount >= 0 ? 'text-ok' : 'text-ink')}>{r.amount >= 0 ? '+' : ''}{money(r.amount)}</p>
              {canEdit && r.type === 'expense' && r.id && (
                <span className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => onEdit(r)} aria-label="Edit expense" className="grid size-7 place-items-center rounded-md text-amute hover:bg-asoft hover:text-ink"><Pencil className="size-3.5" /></button>
                  <button type="button" onClick={() => remove(r)} aria-label="Delete expense" className="grid size-7 place-items-center rounded-md text-amute hover:bg-bad/10 hover:text-bad"><Trash2 className="size-3.5" /></button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <Paginator meta={data.meta} onPage={setPage} />
    </Card>
  )
}

export default function AdminAccounts() {
  const { can } = useAdminAuth()
  const canAdd = can('reports', 'create')
  const canEdit = can('reports', 'edit')
  const [range, setRange] = useState(() => rangeFor('this_month'))
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [expense, setExpense] = useState(emptyExpense)
  const { data: d, isPending, isPlaceholderData } = useAdminList('accounts', { from: range.from, to: range.to, type, page, per_page: 20 })

  const edit = (row) => {
    const e = row.expense
    setExpense({ ...emptyExpense(), id: row.id, spent_on: e.spent_on, category: e.category, method: e.method, amount: String(e.amount), description: e.description, reference: e.reference ?? '', receiptUrl: row.receipt })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const exportCsv = async () => {
    try {
      const all = await adminApi.get('/admin/accounts', { from: range.from, to: range.to, per_page: 500, page: 1 })
      const rows = [['Date', 'Type', 'Title', 'Details', 'Amount'], ...all.ledger.map((r) => [r.date.slice(0, 10), r.type, r.title, r.sub, r.amount]),
        [], ['Money in', all.totals.income], ['Refunds', -all.totals.refunds], ['Expenses', -all.totals.expenses], ['Profit', all.totals.profit]]
      const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `xerqo-accounts-${range.from}_${range.to}.csv` })
      a.click(); URL.revokeObjectURL(a.href)
    } catch (e) { toast.error(e.message) }
  }

  const t = d?.totals
  const p = d?.previous
  const catMax = Math.max(1, ...(d?.expense_categories ?? []).map((c) => c.amount), t?.sms_topups ?? 0)

  return (
    <>
      <PageHead
        title="Accounts"
        sub={d ? `${fmtRange(d.range.from, d.range.to)} · cash basis: money is counted when it actually comes in or goes out` : 'Income, refunds, expenses and profit'}
        actions={<Btn v="white" icon={Download} onClick={exportCsv} disabled={!d}>Export CSV</Btn>}
      />
      <DateRange value={range} onChange={(r) => { setRange(r); setPage(1) }} />

      {isPending || !d ? <LoadingBlock rows={8} /> : (
        <div className={cx('space-y-4 transition-opacity sm:space-y-5', isPlaceholderData && 'opacity-60')}>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <Kpi label="Money in" value={shortTk(t.income)} now={t.income} before={p.income} sub={`COD ${shortTk(t.income_cod)} · online ${shortTk(t.income_online)}`} />
            <Kpi label="Refunds" value={shortTk(t.refunds)} now={t.refunds} before={p.refunds} invert />
            <Kpi label="Expenses" value={shortTk(t.expenses)} now={t.expenses} before={p.expenses} invert sub={t.sms_topups ? `incl. SMS ${shortTk(t.sms_topups)}` : undefined} />
            <Kpi label="Profit" value={money(t.profit)} now={t.profit} before={p.profit > 0 && t.profit >= 0 ? p.profit : null} tone={t.profit < 0 ? 'text-bad' : 'text-ok'} sub="In − refunds − expenses" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-4">
            {[
              ['COD still with couriers', d.expected.cod_open, `${d.expected.cod_open_orders} parcel${d.expected.cod_open_orders === 1 ? '' : 's'} not paid yet`, '/admin/shipments'],
              ['Payments to verify', d.expected.payments_pending, `${d.expected.payments_pending_count} waiting in Payments & COD`, '/admin/payments'],
              ['Refunds to send', d.expected.refunds_due, 'Returns received, not refunded', '/admin/returns'],
            ].map(([l, v, s, to]) => (
              <Link key={l} to={to} className="rounded-xl bg-asoft px-3.5 py-3 hover:bg-aline/60"><p className="text-[11px] text-amute">{l}</p><p className="text-base font-bold">{Tk(v)}</p><p className="text-[11px] text-amute">{s}</p></Link>
            ))}
          </div>
          <Two ratio="main">
            <Col>
              <InOutChart points={d.series} />
              <Ledger data={d} type={type} setType={setType} setPage={setPage} canEdit={canEdit} onEdit={edit} />
            </Col>
            <Col>
              {(canAdd || (canEdit && expense.id)) && <ExpenseForm key={expense.id ?? 'new'} value={expense} onChange={setExpense} onDone={() => setExpense(emptyExpense())} />}
              <Card title="Expenses by category">
                {!t.expenses ? <EmptyBlock title="No expenses yet" text="Add what you spend on materials, packaging, couriers and ads to see real profit." /> : <>
                  {d.expense_categories.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount).map((c) => (
                    <div key={c.key} className="space-y-1.5">
                      <div className="flex justify-between text-[13px]"><span className="text-amute">{c.label}</span><b>{Tk(c.amount)}</b></div>
                      <div className="h-1.5 rounded-full bg-asoft"><div style={{ width: `${(c.amount / catMax) * 100}%` }} className="h-full rounded-full bg-tan" /></div>
                    </div>
                  ))}
                  {t.sms_topups > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[13px]"><span className="text-amute">SMS top-ups (automatic)</span><b>{Tk(t.sms_topups)}</b></div>
                      <div className="h-1.5 rounded-full bg-asoft"><div style={{ width: `${(t.sms_topups / catMax) * 100}%` }} className="h-full rounded-full bg-info" /></div>
                    </div>
                  )}
                </>}
              </Card>
            </Col>
          </Two>
        </div>
      )}
    </>
  )
}
