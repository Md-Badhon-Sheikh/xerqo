import { ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Btn, Textarea } from './ui'
import { FormField, ImagePicker, TextInput } from './form'
import { adminApi } from '../../lib/api'
import { useAdminMutation } from '../../lib/adminQueries'

/* Fields for editing website content (Admin › Pages, Admin › Content & banners) */

// Image field: the file is uploaded straight away and the field keeps its URL
export function ImageField({ value, onChange, disabled, aspect = 'aspect-[3/2]', size = 'w-[150px]', hint = 'JPG, PNG or WebP · max 5 MB' }) {
  const upload = useAdminMutation((file) => {
    const body = new FormData()
    body.append('image', file)
    return adminApi.post('/admin/content/images', body)
  }, { onSuccess: (res) => onChange(res.data.url) })
  return (
    <div className="space-y-1">
      <ImagePicker value={value || null} onChange={(f) => upload.mutate(f)} onRemove={value ? () => onChange('') : undefined} hint={hint} aspect={aspect} size={size} busy={upload.isPending} disabled={disabled} />
      {upload.error?.fields?.image && <p className="text-xs text-bad">{upload.error.fields.image}</p>}
    </div>
  )
}

// Repeating rows (values, story blocks, links…): add, remove, move up
export function Rows({ items, onChange, max, blank, addLabel, disabled, children }) {
  const move = (i) => { const next = [...items]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; onChange(next) }
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-aline p-3">
          <div className="min-w-0 flex-1">{children(item, (patch) => onChange(items.map((it, j) => (j === i ? (typeof patch === 'object' && patch !== null && !Array.isArray(patch) && typeof it === 'object' ? { ...it, ...patch } : patch) : it))), i)}</div>
          {!disabled && (
            <div className="flex shrink-0 flex-col gap-1">
              {i > 0 && <button type="button" onClick={() => move(i)} aria-label="Move up" className="grid size-8 place-items-center rounded-lg text-amute hover:bg-asoft hover:text-ink"><ArrowUp className="size-4" /></button>}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="grid size-8 place-items-center rounded-lg text-amute hover:bg-asoft hover:text-bad"><Trash2 className="size-4" /></button>
            </div>
          )}
        </div>
      ))}
      {!disabled && items.length < max && <Btn v="white" sm icon={Plus} onClick={() => onChange([...items, blank])}>{addLabel}</Btn>}
    </div>
  )
}

// Labelled text input or textarea that works with plain string values
export const Text = ({ label, value, onChange, err, help, area, rows = 3, ...props }) => (
  <FormField label={label} error={err} help={help}>
    {area
      ? <Textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />
      : <TextInput value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />}
  </FormField>
)
