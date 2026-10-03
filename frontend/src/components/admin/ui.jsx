import { Link } from 'react-router-dom'
import Select2 from '../common/Select2'

export const cx = (...c) => c.filter(Boolean).join(' ')

const V = {
  dark: 'bg-ink text-white hover:bg-espresso',
  tan: 'bg-tan text-white hover:bg-tan-dark',
  white: 'bg-white text-ink border border-aline hover:border-ink',
  soft: 'bg-asoft text-ink hover:bg-aline',
  danger: 'bg-bad/10 text-bad hover:bg-bad/15',
  green: 'bg-ok text-white hover:brightness-110',
}
export function Btn({ to, v = 'dark', icon: Icon, children, className, sm, ...rest }) {
  const cls = cx('inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition whitespace-nowrap', sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-[13px]', V[v], className)
  const inner = <>{Icon && <Icon className="size-[15px]" />}{children}</>
  return to ? <Link to={to} className={cls} {...rest}>{inner}</Link> : <button className={cls} {...rest}>{inner}</button>
}

const TONES = { green: 'text-ok bg-ok/12', red: 'text-bad bg-bad/12', amber: 'text-amber bg-amber/12', blue: 'text-info bg-info/12', purple: 'text-violet bg-violet/12', teal: 'text-teal bg-teal/12', tan: 'text-tan bg-tan/12', gray: 'text-amute bg-amute/12' }
export const STATUS_TONE = { Pending: 'amber', Processing: 'blue', Confirmed: 'blue', Packed: 'purple', Shipped: 'teal', 'In transit': 'teal', Delivered: 'green', Paid: 'green', Active: 'green', Published: 'green', Cancelled: 'red', Failed: 'red', Returned: 'red', Refunded: 'purple', Draft: 'gray', Scheduled: 'blue', Expired: 'gray', 'Low stock': 'amber', 'Out of stock': 'red', 'In stock': 'green', Hidden: 'gray', Approved: 'green', Rejected: 'red', Flagged: 'red', Paused: 'gray', Collected: 'blue', Settled: 'green', Picked: 'purple', 'Out for delivery': 'teal', 'To book': 'amber', Invited: 'blue', Suspended: 'red', 'Pickup scheduled': 'blue', Inspecting: 'purple', Requested: 'amber', Completed: 'green', VIP: 'tan', New: 'blue', Risky: 'red', Regular: 'gray' }
export function Badge({ children, tone }) {
  const t = TONES[tone || STATUS_TONE[children] || 'gray']
  return <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold', t)}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}

const PAY = { COD: 'text-ink bg-ink/10', bKash: 'text-bkash bg-bkash/10', Nagad: 'text-nagad bg-nagad/10', Card: 'text-info bg-info/10' }
export const PayChip = ({ m }) => <span className={cx('rounded px-2 py-0.5 text-[11px] font-bold', PAY[m])}>{m}</span>

export function Card({ title, sub, right, className, bodyClass, children, pad = true }) {
  return (
    <section className={cx('rounded-xl border border-aline bg-white', pad && 'p-4 sm:p-5', className)}>
      {title && (
        <header className={cx('mb-4 flex items-start justify-between gap-3', !pad && 'px-4 pt-4 sm:px-5 sm:pt-5')}>
          <div><h3 className="text-base font-semibold">{title}</h3>{sub && <p className="mt-0.5 text-xs text-amute">{sub}</p>}</div>
          {right}
        </header>
      )}
      <div className={cx('space-y-4', bodyClass)}>{children}</div>
    </section>
  )
}

export function PageHead({ title, sub, actions, extra }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-[22px] font-bold sm:text-[26px]">{title}</h1>{extra}</div>
        {sub && <p className="mt-1 text-[13px] text-amute">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2 max-sm:[&>*]:flex-1">{actions}</div>}
    </div>
  )
}

export function KPIs({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      {items.map(([label, value, delta, tone = 'green']) => (
        <div key={label} className="rounded-xl border border-aline bg-white p-3.5 sm:p-[18px]">
          <p className="text-xs text-amute">{label}</p>
          <p className="mt-1.5 text-xl font-bold sm:text-2xl">{value}</p>
          {delta && <p className={cx('mt-1 text-xs font-semibold', { green: 'text-ok', red: 'text-bad', amber: 'text-amber', gray: 'text-amute', purple: 'text-violet' }[tone])}>{delta}</p>}
        </div>
      ))}
    </div>
  )
}

// items: [label, count?, key?]; `active` is the key (or index when no keys); onChange(key)
export function Tabs({ items, active = 0, onChange }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-5 overflow-x-auto border-b border-aline">
      {items.map(([t, n, key], i) => {
        const k = key ?? i
        const on = k === active
        return (
          <button key={t} type="button" role="tab" aria-selected={on} onClick={() => onChange?.(k)} className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-[13px]', on ? 'border-tan font-semibold text-ink' : 'border-transparent text-amute hover:text-ink')}>
            {t}{n != null && n !== '' && <span className={cx('rounded-full px-1.5 text-[10px] font-bold', on ? 'bg-tan text-white' : 'bg-asoft text-amute')}>{n}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* Responsive table: columns hide below their `min` breakpoint via className */
export function Table({ cols, rows, className }) {
  return (
    <div className={cx('overflow-hidden rounded-xl border border-aline bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>{cols.map((c) => <th key={c.h} className={cx('whitespace-nowrap px-4 py-3 font-semibold', c.right && 'text-right', c.className)}>{c.h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {rows.map((r, i) => <tr key={i} className="hover:bg-abg/60">{r.map((cell, j) => <td key={j} className={cx('px-4 py-3 align-middle', cols[j].right && 'text-right', cols[j].b && 'font-semibold', cols[j].mute && 'text-amute', cols[j].className)}>{cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Field({ label, help, children, className, ...input }) {
  return (
    <label className={cx('block space-y-1.5', className)}>
      {label && <span className="block text-xs font-semibold">{label}</span>}
      {children || <input className="ainput" {...input} />}
      {help && <span className="block text-[11px] text-amute">{help}</span>}
    </label>
  )
}
// Admin dropdown — always Select2 (options: strings or { value, label })
export const Select = ({ options = [], className, ...props }) => (
  <Select2 variant="admin" options={options} className={className} {...props} />
)
export const Textarea = (p) => <textarea rows={4} className="ainput resize-y leading-relaxed" {...p} />

export function Toggle({ on }) {
  return (
    <span role="switch" aria-checked={!!on} className={cx('inline-flex h-[18px] w-[34px] shrink-0 items-center rounded-full p-0.5 transition', on ? 'justify-end bg-ok' : 'justify-start bg-[#D5CCC1]')}>
      <span className="size-[14px] rounded-full bg-white shadow" />
    </span>
  )
}
export function ToggleRow({ label, sub, on }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{label}</p>{sub && <p className="text-[11px] text-amute">{sub}</p>}</div>
      <Toggle on={on} />
    </div>
  )
}
export const Check = ({ on, label }) => (
  <label className="inline-flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked={on} className="size-4 accent-tan" />{label}</label>
)
export const KV = ({ k, v, strong }) => (
  <div className="flex items-center justify-between gap-3 text-[13px]"><span className="text-amute">{k}</span><span className={strong ? 'font-bold' : 'font-medium'}>{v}</span></div>
)

export function Avatar({ name, size = 32, tone = 'tan' }) {
  const ini = name.split(' ').map((x) => x[0]).join('').slice(0, 2)
  return <span style={{ width: size, height: size, fontSize: size * 0.36 }} className={cx('grid shrink-0 place-items-center rounded-full font-bold', TONES[tone])}>{ini}</span>
}
export const Who = ({ name, sub }) => (
  <div className="flex items-center gap-2.5"><Avatar name={name} /><div className="min-w-0"><p className="truncate text-[13px] font-semibold">{name}</p>{sub && <p className="truncate text-[11px] text-amute">{sub}</p>}</div></div>
)

export function Pager({ text }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-amute">{text}</p>
      <div className="flex gap-1.5">{['‹', '1', '2', '3', '…', '›'].map((t) => <button key={t} className={cx('min-w-8 rounded-md px-2.5 py-1.5 text-xs font-semibold', t === '1' ? 'bg-ink text-white' : 'border border-aline bg-white')}>{t}</button>)}</div>
    </div>
  )
}

/* Two-column helper: main + side on desktop, stacked on tablet/mobile */
const RATIOS = { main: 'xl:grid-cols-[1.8fr_1fr]', wide: 'xl:grid-cols-[2fr_1fr]', even: 'xl:grid-cols-[1.4fr_1fr]', half: 'md:grid-cols-2' }
export const Two = ({ children, ratio = 'main' }) => (
  <div className={cx('grid gap-4 sm:gap-5 xl:items-start', RATIOS[ratio])}>{children}</div>
)
export const Col = ({ children, className }) => <div className={cx('min-w-0 space-y-4 sm:space-y-5', className)}>{children}</div>

export const Thumb = ({ src, size = 40 }) => <img src={src} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-md object-cover" />
