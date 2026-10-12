import { useState } from 'react'
import Select2 from './Select2'
import { AREAS, areaOptions } from '../../lib/bdAreas'

const OTHER = '__other__'

/*
 * Area / Thana picker for the chosen district (Select2). Disabled until a district is chosen.
 * "Other — type it" lets the customer write an area that isn't listed.
 * <AreaSelect district={d} value={area} onChange={setArea} variant="store|admin" />
 */
export default function AreaSelect({ district, value, onChange, variant = 'store', invalid, inputClassName }) {
  const listed = (AREAS[district] ?? []).includes(value)
  const [typing, setTyping] = useState(() => !!value && !!district && !listed)
  // a new district starts from its own list
  const [forDistrict, setForDistrict] = useState(district)
  if (forDistrict !== district) { setForDistrict(district); setTyping(false) }
  const options = [
    ...areaOptions(district, typing ? '' : value).map((a) => ({ value: a, label: a })),
    { value: OTHER, label: 'Other — type it' },
  ]
  return (
    <div className="space-y-2">
      <Select2
        variant={variant}
        search
        disabled={!district}
        placeholder={district ? 'Select area / thana' : 'Select district first'}
        options={district ? options : []}
        value={typing ? OTHER : value || ''}
        onChange={(v) => {
          if (v === OTHER) { setTyping(true); onChange('') } else { setTyping(false); onChange(v) }
        }}
        invalid={invalid}
      />
      {typing && (
        <input className={inputClassName ?? (variant === 'admin' ? 'ainput' : 'input')} value={value} onChange={(e) => onChange(e.target.value)} maxLength={100} placeholder="Type your area / thana" aria-label="Area / thana" autoFocus />
      )}
    </div>
  )
}
