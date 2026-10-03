import { useEffect, useLayoutEffect, useRef } from 'react'
import $ from 'jquery'
import select2 from 'select2'
import 'select2/dist/css/select2.css'

select2(window, $) // attach the plugin to this jQuery instance

const cx = (...c) => c.filter(Boolean).join(' ')
const norm = (o) => (typeof o === 'object' && o !== null ? o : { value: o, label: o })

/**
 * Project-wide dropdown (every <select> in XERQO uses Select2).
 *
 * <Select2 value={v} onChange={setV} options={['A', 'B'] | [{ value, label, disabled }]}
 *          placeholder="Choose…" search={false} allowClear multiple variant="store|admin" />
 *
 * - controlled when `value` is passed (string, or array when `multiple`); uncontrolled with `defaultValue`
 * - `search` defaults to on when there are more than 7 options
 * - inside a [role=dialog] the dropdown attaches to the dialog so it stays above it
 */
export default function Select2({
  value, defaultValue, onChange, options = [], placeholder, multiple, search, allowClear,
  disabled, variant = 'admin', className, id, name, 'aria-label': ariaLabel, invalid,
}) {
  const ref = useRef(null)
  const onChangeRef = useRef(onChange)
  useLayoutEffect(() => { onChangeRef.current = onChange })

  const opts = options.map(norm)
  const optionsKey = opts.map((o) => `${o.value}\u0001${o.label}\u0001${o.disabled ? 1 : 0}`).join('\u0002')
  const searchable = search ?? opts.length > 7

  // (re)initialise when the option list or behaviour changes
  useEffect(() => {
    const el = ref.current
    const $el = $(el)
    const dialog = $el.closest('[role=dialog]')
    $el.select2({
      width: '100%',
      // only with a real placeholder: otherwise an option with value "" (e.g. "Category: All") would render blank
      ...(placeholder ? { placeholder } : {}),
      allowClear: !!allowClear && !!placeholder && !multiple,
      minimumResultsForSearch: searchable ? 0 : Infinity,
      dropdownParent: dialog.length ? dialog : $(document.body),
      selectionCssClass: `s2-${variant}`,
      dropdownCssClass: `s2-${variant}-dropdown`,
    })
    const initial = value !== undefined ? value : defaultValue
    if (initial !== undefined) $el.val(initial ?? (multiple ? [] : '')).trigger('change.select2')
    $el.on('change.xq', () => {
      const v = $el.val()
      onChangeRef.current?.(multiple ? v || [] : v ?? '')
    })
    return () => {
      $el.off('change.xq')
      if ($el.data('select2')) $el.select2('destroy')
    }
  }, [optionsKey, placeholder, allowClear, multiple, searchable, variant]) // eslint-disable-line react-hooks/exhaustive-deps

  // keep the widget in sync with a controlled value
  useEffect(() => {
    if (value === undefined) return
    const $el = $(ref.current)
    const current = $el.val()
    const next = value ?? (multiple ? [] : '')
    if (JSON.stringify(current ?? '') !== JSON.stringify(multiple ? next.map(String) : String(next))) {
      $el.val(next).trigger('change.select2')
    }
  }, [value, multiple])

  return (
    <div className={cx('s2-wrap', invalid && 's2-invalid', className)}>
      <select ref={ref} id={id} name={name} multiple={multiple} disabled={disabled} aria-label={ariaLabel} className="w-full">
        {!multiple && placeholder && <option value="" />}
        {opts.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </div>
  )
}
