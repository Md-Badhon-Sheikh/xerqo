import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useUI } from '../../components/store/StoreLayout'

/* Index of every screen in the static design, numbered like the Figma frames */
const STOREFRONT = [
  ['01', 'Home', '/', 'Hero, categories, flash sale, best sellers, category sliders'],
  ['02', 'Shop / Category', '/shop?c=wallets', 'Filters sidebar, sort, product grid, pagination'],
  ['02b', 'Shop — Filter sheet', '/shop?c=wallets&filters=1', 'Mobile / tablet bottom sheet (shown below 1024px)'],
  ['03', 'Product detail', '/product/classic-bifold-wallet', 'Gallery, colour, engraving, reviews, related'],
  ['04', 'Cart', '/cart', 'Line items, coupon, delivery zones, summary'],
  ['04b', 'Cart drawer', null, 'Slide-in mini cart — click to open it here'],
  ['05', 'Checkout', '/checkout', 'Contact, address, delivery & payment options'],
  ['06', 'Order confirmed + tracking', '/order-success', 'Thank-you page with next-steps timeline'],
  ['07', 'Login (OTP)', '/login', 'Phone OTP or email sign in'],
  ['08', 'My account — Orders', '/account', 'Order history and account menu'],
  ['09', 'Register', '/register', 'Create account'],
  ['10', 'Forgot / reset password', '/forgot-password', 'Reset via phone or email'],
  ['11', 'Rate & review', '/account/review/XQ-23102', 'Review a delivered order with photos'],
  ['12', 'My reviews & feedback', '/account/reviews', 'Published and pending reviews'],
  ['13', 'Wishlist', '/account/wishlist', 'Saved products'],
  ['14', 'Track order', '/track', 'Order ID + phone lookup and live status'],
  ['15', 'Profile & addresses', '/account/profile', 'Personal details and saved addresses'],
  ['16', 'About us / Our story', '/about', 'Brand story and craft'],
  ['17', 'Contact us', '/contact', 'Form, showroom and support channels'],
  ['18', 'FAQ / Help center', '/faq', 'Searchable questions by topic'],
  ['19', 'Policies', '/policy', 'Shipping, returns & refund, privacy, terms'],
  ['20', 'Search results', '/search?q=wallet', 'Live suggestions and results grid'],
  ['21', '404 + empty states', '/this-page-does-not-exist', 'Not-found page and reusable empty states'],
]

const ADMIN = [
  ['A1', 'Login', '/admin/login'],
  ['A2', 'Forgot password', '/admin/forgot-password'],
  ['A3', 'Dashboard', '/admin'],
  ['A4', 'Orders', '/admin/orders'],
  ['A5', 'Order detail', '/admin/orders/XQ-24817'],
  ['A6', 'Invoice', '/admin/invoice/XQ-24817'],
  ['A7', 'Products', '/admin/products'],
  ['A8', 'Add / edit product', '/admin/products/new'],
  ['A9', 'Categories', '/admin/categories'],
  ['A10', 'Inventory', '/admin/inventory'],
  ['A11', 'Customers', '/admin/customers'],
  ['A12', 'Customer detail', '/admin/customers/1'],
  ['A13', 'Reviews', '/admin/reviews'],
  ['A14', 'Coupons', '/admin/coupons'],
  ['A15', 'Content (banners & pages)', '/admin/content'],
  ['A16', 'Returns', '/admin/returns'],
  ['A17', 'Shipments', '/admin/shipments'],
  ['A18', 'Payments', '/admin/payments'],
  ['A19', 'Reports', '/admin/reports'],
  ['A20', 'Staff', '/admin/staff'],
  ['A21', 'Role permissions', '/admin/staff/roles/order-manager'],
  ['A22', 'Settings', '/admin/settings'],
  ['A23', 'Settings — General', '/admin/settings/general'],
  ['A24', 'Settings — SMS', '/admin/settings/sms'],
  ['A25', 'Settings — Security', '/admin/settings/security'],
  ['A26', 'Notifications', '/admin/notifications'],
  ['A27', 'Admin profile', '/admin/profile'],
]

function PageCard({ n, name, to, note }) {
  const ui = useUI()
  const cls = 'group flex w-full items-start gap-3 rounded-lg border border-line bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-tan hover:shadow-[0_8px_24px_rgba(35,26,21,0.08)] sm:p-5'
  const body = (
    <>
      <span className="w-11 shrink-0 font-display text-2xl font-semibold italic leading-none text-tan sm:text-[28px]">{n}</span>
      <span className="min-w-0 flex-1 space-y-1">
        <b className="block text-sm font-semibold group-hover:text-tan sm:text-[15px]">{name}</b>
        {note && <span className="block text-xs leading-relaxed text-mute">{note}</span>}
        <code className="block truncate text-[11px] text-mute">{to || 'any page → bag icon'}</code>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-mute transition group-hover:text-tan" />
    </>
  )
  // The cart drawer has no route — open it through the layout context instead
  if (!to) return <button onClick={() => ui?.setDrawer(true)} className={cls}>{body}</button>
  return <Link to={to} className={cls}>{body}</Link>
}

const Group = ({ title, sub, children }) => (
  <section className="space-y-5">
    <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
      <h2 className="h-display text-[28px] sm:text-4xl">{title}</h2>
      <span className="text-xs text-mute sm:text-[13px]">{sub}</span>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">{children}</div>
  </section>
)

export default function DesignIndex() {
  return (
    <div className="container-x space-y-12 py-10 sm:space-y-16 sm:py-16">
      <header className="max-w-2xl space-y-3">
        <p className="eyebrow">XERQO · Static design</p>
        <h1 className="h-display text-[38px] sm:text-5xl lg:text-[60px]">Every page, in one place</h1>
        <p className="text-sm leading-relaxed text-mute sm:text-base">
          Responsive build of the Figma file (mobile 390, tablet 834, laptop 1280, desktop 1440). All data is mock data from
          <code className="mx-1 rounded bg-sand px-1.5 py-0.5 text-[13px] text-ink">src/data/store.js</code>
          ready to be wired to the Laravel API.
        </p>
      </header>

      <Group title="Storefront" sub={`${STOREFRONT.length} screens`}>
        {STOREFRONT.map(([n, name, to, note]) => <PageCard key={n} n={n} name={name} to={to} note={note} />)}
      </Group>

      <Group title="Admin panel" sub={`${ADMIN.length} screens`}>
        {ADMIN.map(([n, name, to]) => <PageCard key={n} n={n} name={name} to={to} />)}
      </Group>
    </div>
  )
}
