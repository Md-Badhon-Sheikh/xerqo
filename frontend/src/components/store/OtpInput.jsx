import { useEffect, useRef, useState } from 'react'

const cx = (...c) => c.filter(Boolean).join(' ')

/**
 * 6-digit code boxes: type, backspace, arrow keys and paste all work.
 * <OtpInput value={code} onChange={setCode} onComplete={submit} invalid={!!err} />
 */
export function OtpInput({ value = '', onChange, onComplete, length = 6, invalid, autoFocus = true, className }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  useEffect(() => { if (autoFocus) refs.current[0]?.focus() }, [autoFocus])

  const update = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
    return clean
  }
  const onType = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '')
    if (!typed) return
    // typing replaces this box; a pasted/auto-filled run spills into the next boxes
    const next = (value.slice(0, i) + typed + value.slice(i + typed.length)).slice(0, length)
    update(next)
    refs.current[Math.min(i + typed.length, length - 1)]?.focus()
  }
  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) update(value.slice(0, i) + value.slice(i + 1))
      else if (i > 0) { update(value.slice(0, i - 1) + value.slice(i)); refs.current[i - 1]?.focus() }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }
  const onPaste = (e) => {
    e.preventDefault()
    const clean = update(e.clipboardData.getData('text'))
    refs.current[Math.min(clean.length, length - 1)]?.focus()
  }

  return (
    <div className={cx('grid grid-cols-6 gap-2 sm:gap-3', className)} role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={length}
          aria-label={`Digit ${i + 1}`} onChange={(e) => onType(i, e)} onKeyDown={(e) => onKey(i, e)} onPaste={onPaste} onFocus={(e) => e.target.select()}
          className={cx('aspect-square w-full min-w-0 rounded border bg-white text-center text-lg font-semibold outline-none transition focus:border-[1.5px] focus:border-ink sm:text-xl', invalid ? 'border-rust' : 'border-line')} />
      ))}
    </div>
  )
}

// Seconds-left countdown for "Resend in 0:42"; restart(seconds) starts it again
export function useCountdown() {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (left <= 0) return
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [left])
  return [left, setLeft]
}

export const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
