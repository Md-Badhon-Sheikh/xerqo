import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Search, X } from 'lucide-react'
import { Toggle, cx } from './ui'

/* Building blocks for the live admin screens (forms, lists, pagination) */

// Clickable on/off switch
export function Switch({ checked, onChange, label, disabled, className }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled}
      onClick={() => onChange?.(!checked)} className={cx('inline-flex shrink-0 disabled:opacity-50', className)}>
      <Toggle on={checked} />
    </button>
  )
}

export function SwitchRow({ label, sub, checked, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{label}</p>{sub && <p className="text-[11px] text-amute">{sub}</p>}</div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  )
}

export const FieldError = ({ children }) => (children ? <span role="alert" className="block text-[11px] text-bad">{children}</span> : null)

// Labelled control with an error line (the admin <Field> plus validation)
export function FormField({ label, help, error, children, className }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && <span className="block text-xs font-semibold">{label}</span>}
      {children}
      {error ? <FieldError>{error}</FieldError> : help && <span className="block text-[11px] text-amute">{help}</span>}
    </div>
  )
}

export function TextInput({ invalid, className, ...props }) {
  return <input className={cx('ainput', invalid && '!border-bad', className)} {...props} />
}

export function MoneyInput({ value, onChange, invalid, ...props }) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-amute">৳</span>
      <input inputMode="decimal" className={cx('ainput pl-7', invalid && '!border-bad')} value={value ?? ''}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} {...props} />
    </span>
  )
}

// Search box that reports after the user stops typing
export function SearchBox({ value, onChange, placeholder = 'Search…', className }) {
  const [text, setText] = useState(value || '')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const id = setTimeout(() => onChange(text.trim()), 350)
    return () => clearTimeout(id)
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className={cx('flex flex-1 items-center gap-2.5 rounded-lg border border-aline bg-white px-3 py-2.5 text-[13px]', className)}>
      <Search className="size-4 text-amute" />
      <input value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-amute" placeholder={placeholder} aria-label={placeholder} />
      {text && <button type="button" onClick={() => setText('')} aria-label="Clear search"><X className="size-3.5 text-amute" /></button>}
    </label>
  )
}

// Laravel paginator meta -> "Showing a–b of n" + page buttons
export function Paginator({ meta, onPage, className }) {
  if (!meta || !meta.total) return null
  const { current_page: page, last_page: last, from, to, total } = meta
  const nums = [...new Set([1, page - 1, page, page + 1, last])].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
  const cell = 'min-w-8 rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40'
  return (
    <div className={cx('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-xs text-amute">Showing {from}–{to} of {total}</p>
      {last > 1 && (
        <div className="flex gap-1.5">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={cx(cell, 'border border-aline bg-white')} aria-label="Previous page"><ChevronLeft className="size-3.5" /></button>
          {nums.map((n, i) => (
            <span key={n} className="flex gap-1.5">
              {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 py-1.5 text-xs text-amute">…</span>}
              <button type="button" onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined} className={cx(cell, n === page ? 'bg-ink text-white' : 'border border-aline bg-white')}>{n}</button>
            </span>
          ))}
          <button type="button" disabled={page >= last} onClick={() => onPage(page + 1)} className={cx(cell, 'border border-aline bg-white')} aria-label="Next page"><ChevronRight className="size-3.5" /></button>
        </div>
      )}
    </div>
  )
}

// Single image picker: shows the current URL or the chosen file, returns a File via onChange
export function ImagePicker({ value, onChange, onRemove, label = 'Upload image', hint, className, aspect = 'aspect-square', size = 'w-[88px]' }) {
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    if (!(value instanceof File)) { setPreview(null); return }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])
  const src = preview || (typeof value === 'string' ? value : null)
  return (
    <div className={cx('flex items-center gap-3.5', className)}>
      <div className={cx('relative shrink-0 overflow-hidden rounded-lg border border-aline bg-asoft', aspect, size)}>
        {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-amute"><ImagePlus className="size-5" /></span>}
        {src && onRemove && <button type="button" onClick={onRemove} aria-label="Remove image" className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-white shadow"><X className="size-3" /></button>}
      </div>
      <div className="space-y-1.5">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-aline bg-white px-3 py-1.5 text-xs font-semibold hover:border-ink">
          <ImagePlus className="size-3.5" />{src ? 'Replace image' : label}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = '' }} />
        </label>
        {hint && <p className="text-[11px] text-amute">{hint}</p>}
      </div>
    </div>
  )
}

export const Spin = ({ className }) => <Loader2 className={cx('size-4 animate-spin', className)} />

// Table/list placeholders
export const LoadingBlock = ({ rows = 5 }) => (
  <div className="space-y-2.5 rounded-xl border border-aline bg-white p-4" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-asoft" />)}
  </div>
)

export const EmptyBlock = ({ title, text, action }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-aline bg-white px-6 py-12 text-center">
    <p className="text-sm font-semibold">{title}</p>
    {text && <p className="max-w-sm text-[13px] text-amute">{text}</p>}
    {action}
  </div>
)

// Build multipart FormData from a flat-ish object (arrays -> key[i][field]); null/undefined skipped, booleans -> 1/0
export function toFormData(obj, form = new FormData(), prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v === undefined || v === null) continue
    if (v instanceof File) form.append(key, v)
    else if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' && !(item instanceof File) ? toFormData(item, form, `${key}[${i}]`) : form.append(`${key}[${i}]`, item)))
    else if (typeof v === 'object') toFormData(v, form, key)
    else form.append(key, typeof v === 'boolean' ? (v ? '1' : '0') : v)
  }
  return form
}
