import { Badge } from './ui'

/* Shared labels, colours and formatters for orders, payments and returns in the admin panel */

export const ORDER_STATUS = {
  pending: ['Pending', 'amber'],
  confirmed: ['Confirmed', 'blue'],
  processing: ['Processing', 'purple'],
  shipped: ['Shipped', 'teal'],
  delivered: ['Delivered', 'green'],
  cancelled: ['Cancelled', 'red'],
  returned: ['Returned', 'red'],
}
// button label for moving an order to a status
export const STATUS_ACTION = {
  confirmed: 'Confirm order', processing: 'Start processing', shipped: 'Mark as shipped', delivered: 'Mark as delivered', cancelled: 'Cancel order', returned: 'Mark as returned',
}
export const PAY_STATUS = { pending: ['Unpaid', 'amber'], paid: ['Paid', 'green'], failed: ['Payment failed', 'red'], refunded: ['Refunded', 'purple'] }
export const PAYMENT_STATUS = { pending: ['To verify', 'amber'], verified: ['Verified', 'green'], rejected: ['Rejected', 'red'] }
export const METHOD_LABEL = { cod: 'COD', bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', bank: 'Bank', card: 'Card' }
export const RETURN_STATUS = { pending: ['Requested', 'amber'], approved: ['Approved', 'blue'], rejected: ['Rejected', 'red'], received: ['Received', 'purple'], completed: ['Completed', 'green'] }
export const COURIERS = ['Steadfast', 'Pathao', 'RedX', 'Sundarban', 'SA Paribahan', 'eCourier', 'Own rider']

export const OrderBadge = ({ s }) => { const [l, t] = ORDER_STATUS[s] ?? [s, 'gray']; return <Badge tone={t}>{l}</Badge> }
export const PayBadge = ({ s }) => { const [l, t] = PAY_STATUS[s] ?? [s, 'gray']; return <Badge tone={t}>{l}</Badge> }
export const PaymentBadge = ({ s }) => { const [l, t] = PAYMENT_STATUS[s] ?? [s, 'gray']; return <Badge tone={t}>{l}</Badge> }
export const ReturnBadge = ({ s }) => { const [l, t] = RETURN_STATUS[s] ?? [s, 'gray']; return <Badge tone={t}>{l}</Badge> }

export const Tk = (n) => 'Tk ' + Number(n || 0).toLocaleString('en-IN')
export const shortTk = (v) => (v >= 100000 ? `Tk ${(v / 100000).toFixed(1)}L` : Tk(Math.round(v)))
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—')
export function ago(iso) {
  if (!iso) return ''
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d < 7 ? `${d}d ago` : fmtDate(iso)
}
