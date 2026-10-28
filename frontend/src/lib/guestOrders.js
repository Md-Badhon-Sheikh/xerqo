// Guest checkout: each guest order's private token (from the checkout response) is kept in this browser so the
// thank-you page and the payment upload can open that order.
const KEY = 'xq_guest_orders'

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }

export const guestToken = (number) => read()[number] ?? null

export const saveGuestToken = (number, token) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [number]: token })) } catch { /* private mode / storage blocked */ }
}
