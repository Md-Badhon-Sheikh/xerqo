import { useState } from 'react'
import { Select } from './ui'

/* Date range picker: presets in a Select2, plus from/to inputs for a custom range. Dates are "YYYY-MM-DD". */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export const PRESETS = {
  this_month: ['This month', () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)] }],
  last_month: ['Last month', () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))] }],
  last_7: ['Last 7 days', () => [iso(addDays(new Date(), -6)), iso(new Date())]],
  last_30: ['Last 30 days', () => [iso(addDays(new Date(), -29)), iso(new Date())]],
  last_90: ['Last 90 days', () => [iso(addDays(new Date(), -89)), iso(new Date())]],
  this_year: ['This year', () => { const n = new Date(); return [iso(new Date(n.getFullYear(), 0, 1)), iso(n)] }],
  custom: ['Custom range…', null],
}

export function rangeFor(preset) {
  const [from, to] = PRESETS[preset]?.[1]?.() ?? PRESETS.this_month[1]()
  return { preset, from, to }
}

export const fmtRange = (from, to) => {
  const f = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return from === to ? f(from) : `${f(from)} – ${f(to)}`
}

export default function DateRange({ value, onChange }) {
  const [draft, setDraft] = useState({ from: value.from, to: value.to })
  const pick = (preset) => {
    if (preset === 'custom') { onChange({ ...value, preset }); return }
    const next = rangeFor(preset)
    setDraft({ from: next.from, to: next.to })
    onChange(next)
  }
  const apply = (patch) => {
    const d = { ...draft, ...patch }
    setDraft(d)
    if (d.from && d.to && d.from <= d.to) onChange({ preset: 'custom', ...d })
  }
  const [today] = useState(() => iso(new Date()))

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={value.preset} onChange={pick} search={false} className="sm:w-44" aria-label="Date range"
        options={Object.entries(PRESETS).map(([k, [label]]) => ({ value: k, label }))} />
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" className="ainput py-2!" value={draft.from} max={draft.to || today} onChange={(e) => apply({ from: e.target.value })} aria-label="From" />
          <span className="text-xs text-amute">to</span>
          <input type="date" className="ainput py-2!" value={draft.to} min={draft.from} max={today} onChange={(e) => apply({ to: e.target.value })} aria-label="To" />
        </div>
      )}
    </div>
  )
}
