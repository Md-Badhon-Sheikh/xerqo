import { Loader2, AlertTriangle } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

export const Spinner = ({ className }) => <Loader2 className={cx('size-5 animate-spin text-tan', className)} aria-hidden="true" />

export const PageLoader = ({ className }) => (
  <div role="status" className={cx('grid min-h-[50vh] place-items-center', className)}>
    <Spinner className="size-7" /><span className="sr-only">Loading…</span>
  </div>
)

// Shown when a request fails; `onRetry` re-runs it
export function ErrorState({ error, onRetry, className }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-12 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-rust/10"><AlertTriangle className="size-5 text-rust" /></span>
      <p className="max-w-sm text-sm text-mute">{error?.message || 'Something went wrong.'}</p>
      {onRetry && <button onClick={onRetry} className="text-[13px] font-semibold text-tan underline underline-offset-4">Try again</button>}
    </div>
  )
}

// Inline form error under a field / at the top of a form
export const FormError = ({ children, className }) => children
  ? <p role="alert" className={cx('rounded bg-rust/8 px-3 py-2.5 text-[13px] text-rust', className)}>{children}</p>
  : null
