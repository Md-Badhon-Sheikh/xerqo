import { Loader2, AlertTriangle } from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

export const Spinner = ({ className }) => <Loader2 className={cx('size-5 animate-spin text-tan', className)} aria-hidden="true" />

/* The "xerqo" wordmark drawn with strokes (same shapes as the page-load intro in index.html).
   With `loop` it keeps drawing itself — used while a page is loading. Styles live in index.css. */
export const XerqoMark = ({ className, loop = true }) => (
  <svg viewBox="100 655 1310 300" className={cx('xq-mark-svg', loop && 'xq-loop', className)} aria-hidden="true">
    <defs><clipPath id="xq-mark-x"><rect x="110" y="688" width="278" height="252" /></clipPath></defs>
    <g clipPath="url(#xq-mark-x)">
      <path className="xq-st xq-x1" pathLength="1" d="M127 668 L370 960" />
      <path className="xq-st xq-x2" pathLength="1" d="M370 668 L127 960" />
    </g>
    <path className="xq-st xq-e" pathLength="1" d="M403 814.5 H622 V738 A32 32 0 0 0 590 706 H435 A32 32 0 0 0 403 738 V890 A32 32 0 0 0 435 922 H640" />
    <path className="xq-st xq-r" pathLength="1" d="M698 940 V738 A32 32 0 0 1 730 706 H874" />
    <path className="xq-st xq-q" pathLength="1" d="M943 726.7 A104 104 0 1 0 1031 726.7" />
    <path className="xq-st xq-qt" pathLength="1" d="M1058 886 L1110 940" />
    <rect className="xq-bar" x="968" y="680" width="41" height="122" />
    <path className="xq-st xq-o" pathLength="1" d="M1188 706 H1344 A32 32 0 0 1 1376 738 V890 A32 32 0 0 1 1344 922 H1188 A32 32 0 0 1 1156 890 V738 A32 32 0 0 1 1188 706 Z" />
  </svg>
)

export const PageLoader = ({ className }) => (
  <div role="status" className={cx('grid min-h-[50vh] place-items-center', className)}>
    <XerqoMark className="w-[150px] text-ink sm:w-[180px]" /><span className="sr-only">Loading…</span>
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
