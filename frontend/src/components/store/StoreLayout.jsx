import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronUp, MessageCircle, Home, LayoutGrid, Minus, Plus, Trash2, Truck, ChevronDown, GitCompareArrows } from 'lucide-react'
import { tk } from '../../data/store'
import { Button, Qty, cx } from './ui'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import { StoreUI, useUI } from '../../context/StoreUIContext'
import { WishlistProvider } from '../../context/WishlistContext'
import { useCategories, useSettings } from '../../lib/queries'
import { tokens } from '../../lib/api'
import { waLink } from '../../lib/bd'

const NAV = [['Home', '/'], ['Shop', '/shop'], ['Wallets', '/shop?c=wallets'], ['Bags', '/shop?c=bags'], ['Women', '/shop?c=womens-purses'], ['Travel', '/shop?c=passport-covers'], ['About Us', '/about'], ['Contact', '/contact']]

// Free-delivery threshold from the store settings (falls back to ৳2,000 while loading)
const useFreeDelivery = () => useSettings().data?.delivery?.free_delivery_threshold ?? 2000

export const Logo = ({ light, className, imgClassName = 'h-10 w-auto sm:h-12 lg:h-[52px]' }) => (
  <Link to="/" aria-label="XERQO home" className={cx('block shrink-0', className)}>
    <img src={light ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="XERQO" className={imgClassName} />
  </Link>
)

// "xerqo" wordmark (same drawing as the page-load intro in index.html) — used in the mobile header
const Wordmark = ({ className }) => (
  <Link to="/" aria-label="XERQO home" className={cx('block shrink-0', className)}>
    <svg viewBox="100 655 1310 300" className="h-[22px] w-auto text-ink sm:h-7" role="img" aria-label="XERQO">
      <defs><clipPath id="xq-wordmark-x"><rect x="110" y="688" width="278" height="252" /></clipPath></defs>
      <g fill="none" stroke="currentColor" strokeWidth="36">
        <g clipPath="url(#xq-wordmark-x)"><path d="M127 668 L370 960" /><path d="M370 668 L127 960" /></g>
        <path d="M403 814.5 H622 V738 A32 32 0 0 0 590 706 H435 A32 32 0 0 0 403 738 V890 A32 32 0 0 0 435 922 H640" />
        <path d="M698 940 V738 A32 32 0 0 1 730 706 H874" />
        <path d="M943 726.7 A104 104 0 1 0 1031 726.7" />
        <path d="M1058 886 L1110 940" />
        <path d="M1188 706 H1344 A32 32 0 0 1 1376 738 V890 A32 32 0 0 1 1344 922 H1188 A32 32 0 0 1 1156 890 V738 A32 32 0 0 1 1188 706 Z" />
      </g>
      <rect x="968" y="680" width="41" height="122" fill="currentColor" />
    </svg>
  </Link>
)

function CartIcon({ onClick }) {
  const { count } = useCart()
  return (
    <button onClick={onClick} className="relative" aria-label={`Open cart (${count} items)`}>
      <ShoppingBag className="size-[22px]" strokeWidth={1.7} />
      {count > 0 && <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-tan text-[9px] font-bold text-white">{count > 9 ? '9+' : count}</span>}
    </button>
  )
}

// Shown only while products are queued for comparison
function CompareIcon() {
  const { items } = useCompare()
  if (!items.length) return null
  return (
    <Link to="/compare" aria-label={`Compare products (${items.length})`} title="Compare products" className="relative">
      <GitCompareArrows className="size-5" strokeWidth={1.7} />
      <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-ink text-[9px] font-bold text-white">{items.length}</span>
    </Link>
  )
}

// Strip above the header — edited in Admin › Content & banners
function AnnouncementBar() {
  const a = useSettings().data?.announcement
  if (!a?.enabled || !a.text) return null
  const external = /^https?:\/\//.test(a.link || '')
  const link = a.link_text && a.link && (external
    ? <a href={a.link} className="ml-2 font-semibold text-gold underline underline-offset-2">{a.link_text}</a>
    : <Link to={a.link} className="ml-2 font-semibold text-gold underline underline-offset-2">{a.link_text}</Link>)
  return (
    <div className="bg-espresso py-2 text-center text-[11px] tracking-wide text-white sm:text-xs">
      <span className={a.mobile_text ? 'hidden sm:inline' : ''}>{a.text}</span>
      {a.mobile_text && <span className="sm:hidden">{a.mobile_text}</span>}
      {link}
    </div>
  )
}

// Search box between the logo and the cart on mobile / tablet; opens the search page with the query
function MobileSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search')
  }
  return (
    <form role="search" onSubmit={submit} className="relative min-w-0 flex-1 lg:hidden">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="h-9 w-full rounded-full border border-line bg-cream pl-3.5 pr-9 text-[13px] outline-none placeholder:text-mute focus:border-ink [&::-webkit-search-cancel-button]:hidden" />
      <button type="submit" aria-label="Search" className="absolute inset-y-0 right-0 grid w-9 place-items-center"><Search className="size-[18px]" /></button>
    </form>
  )
}

// Which header menu item is the current page. Menu links like /shop?c=wallets differ only in the query, which
// NavLink ignores: match the category too; "Shop" covers /shop pages for categories that have no menu item.
function useNavActive() {
  const { pathname, search } = useLocation()
  const c = new URLSearchParams(search).get('c')
  const menuCats = NAV.map(([, to]) => new URL(to, 'http://x').searchParams.get('c')).filter(Boolean)
  return (to) => {
    const u = new URL(to, 'http://x')
    const cat = u.searchParams.get('c')
    if (u.pathname === '/') return pathname === '/'
    if (u.pathname === '/shop') return pathname === '/shop' && (cat ? c === cat : !menuCats.includes(c))
    return pathname === u.pathname || pathname.startsWith(u.pathname + '/')
  }
}

function Header() {
  const { setDrawer, setMenu } = useUI()
  const navActive = useNavActive()
  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div className="border-b border-line bg-white">
        <div className="container-x flex items-center justify-between gap-3 py-2 sm:gap-5 lg:gap-6 lg:py-3">
          {/* mobile / tablet left */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:hidden">
            <button onClick={() => setMenu(true)} aria-label="Menu"><Menu className="size-[22px]" /></button>
            <Wordmark />
          </div>
          <MobileSearch />
          <div className="hidden lg:block"><Logo /></div>
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV.map(([n, to]) => (
              <Link key={n} to={to} aria-current={navActive(to) ? 'page' : undefined}
                className={cx('relative py-1 text-sm font-medium transition hover:text-tan', navActive(to) && 'text-tan after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-tan')}>{n}</Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-4 sm:gap-5">
            <Link to="/search" className="hidden items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[13px] text-mute xl:flex"><Search className="size-4" /> Search products…</Link>
            <Link to="/search" aria-label="Search" className="hidden lg:block xl:hidden"><Search className="size-5" /></Link>
            <CompareIcon />
            <Link to="/account/wishlist" aria-label="Wishlist" className="hidden sm:block"><Heart className="size-5" strokeWidth={1.7} /></Link>
            <Link to="/account" aria-label="Account" className="hidden lg:block"><User className="size-5" strokeWidth={1.7} /></Link>
            <CartIcon onClick={() => setDrawer(true)} />
            {/* mobile / tablet: account sits after the cart */}
            <Link to="/account" aria-label="Account" className="lg:hidden"><User className="size-[22px]" strokeWidth={1.7} /></Link>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileMenu() {
  const { menu, setMenu } = useUI()
  const { user, logout } = useAuth()
  const { data: categories = [] } = useCategories()
  const close = () => setMenu(false)
  return (
    <div className={cx('fixed inset-0 z-50 lg:hidden', menu ? 'visible' : 'invisible')}>
      <div onClick={() => setMenu(false)} className={cx('absolute inset-0 bg-black/40 transition', menu ? 'opacity-100' : 'opacity-0')} />
      <aside className={cx('absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform', menu ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between border-b border-line p-4"><Logo /><button onClick={() => setMenu(false)} aria-label="Close"><X /></button></div>
        <nav className="flex-1 overflow-y-auto p-4">
          {NAV.map(([n, to]) => <Link key={n} to={to} onClick={() => setMenu(false)} className="flex items-center justify-between border-b border-line py-3.5 text-[15px] font-medium">{n}<ChevronDown className="size-4 -rotate-90 text-mute" /></Link>)}
          <p className="eyebrow mt-6 mb-3">Categories</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.slice(0, 6).map((c) => <Link key={c.slug} to={`/shop?c=${c.slug}`} onClick={() => setMenu(false)} className="space-y-1.5 text-center text-[11px]"><img src={c.image} alt="" className="aspect-square w-full rounded-xl object-cover" />{c.name}</Link>)}
          </div>
        </nav>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
          {user ? (
            <><Button to="/account" size="sm" onClick={close}>My account</Button><Button variant="outline" size="sm" onClick={() => { close(); logout() }}>Sign out</Button></>
          ) : (
            <><Button to="/login" variant="outline" size="sm" onClick={close}>Login</Button><Button to="/register" size="sm" onClick={close}>Register</Button></>
          )}
        </div>
      </aside>
    </div>
  )
}

export function CartDrawer({ forceOpen }) {
  const ctx = useUI()
  const { items, count, subtotal, update, remove } = useCart()
  const freeAt = useFreeDelivery()
  const open = forceOpen || ctx?.drawer
  const close = () => ctx?.setDrawer(false)
  return (
    <div className={cx(forceOpen ? 'relative' : 'fixed inset-0 z-50', open ? 'visible' : 'invisible')}>
      {!forceOpen && <div onClick={close} className={cx('absolute inset-0 bg-black/45 transition', open ? 'opacity-100' : 'opacity-0')} />}
      <aside aria-label="Shopping cart" className={cx('flex flex-col bg-white', forceOpen ? 'ml-auto h-[760px] w-full max-w-[440px] shadow-xl' : 'absolute inset-y-0 right-0 w-full max-w-[440px] transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="h-display text-2xl">Your Cart <span className="font-sans text-sm font-normal text-mute">({count} {count === 1 ? 'item' : 'items'})</span></h3>
          <button onClick={close} aria-label="Close cart" className="text-2xl leading-none">×</button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sand"><ShoppingBag className="size-7 text-tan" strokeWidth={1.5} /></span>
            <p className="h-display text-2xl">Your cart is empty</p>
            <p className="text-sm text-mute">Browse our handcrafted wallets, bags and travel goods.</p>
            <Button to="/shop" onClick={close}>Start shopping</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 bg-leaf/8 px-5 py-3 text-[13px]">
              <p className="flex items-center gap-2 text-leaf"><Truck className="size-4" />{subtotal >= freeAt ? <span>Free delivery unlocked 🎉</span> : <span>You're <b>{tk(freeAt - subtotal)}</b> away from free delivery</span>}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-leaf" style={{ width: `${Math.min(100, (subtotal / freeAt) * 100)}%` }} /></div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.map((i) => (
                <div key={i.key} className="flex gap-3 border-b border-line pb-4">
                  <Link to={`/product/${i.slug}`} onClick={close} className="shrink-0"><img src={i.image} alt="" className="size-20 rounded object-cover" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex justify-between gap-2">
                      <Link to={`/product/${i.slug}`} onClick={close} className="font-display text-lg font-semibold leading-tight hover:text-tan">{i.name}</Link>
                      <button onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}><Trash2 className="size-4 text-mute hover:text-rust" /></button>
                    </div>
                    <p className="text-xs text-mute">{[i.color, i.engraving_text && `Engraving: “${i.engraving_text}”`].filter(Boolean).join(' · ')}</p>
                    <div className="mt-auto flex items-center justify-between"><Qty value={i.qty} max={i.stock} onChange={(q) => update(i.key, q)} small /><span className="font-bold text-tan">{tk(i.price * i.qty)}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t border-line px-5 py-4">
              <div className="flex justify-between text-sm"><span className="text-mute">Subtotal</span><b>{tk(subtotal)}</b></div>
              <p className="text-xs text-mute">Delivery &amp; discounts calculated at checkout.</p>
              <div className="grid grid-cols-2 gap-2"><Button to="/cart" variant="outline" onClick={close}>View cart</Button><Button to="/checkout" onClick={close}>Checkout</Button></div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

// internal paths use the router; https://, tel: and mailto: links are plain links
function FooterLink({ to, children }) {
  const { pathname, search } = useLocation()
  if (/^(https?:|tel:|mailto:)/i.test(to || '')) {
    return <a href={to} target={/^https?:/i.test(to) ? '_blank' : undefined} rel="noreferrer" className="hover:text-white">{children}</a>
  }
  // already on that page: the address doesn't change, so take the visitor back to the top ourselves
  const onClick = () => { if ((to || '/') === pathname + search) window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <Link to={to || '/'} onClick={onClick} className="hover:text-white">{children}</Link>
}


// brand icons (Simple Icons paths, 24×24)
const SOCIAL_ICONS = {
  Facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  Instagram: 'M7.03.084c-1.277.06-2.149.264-2.91.563a5.874 5.874 0 0 0-2.124 1.388 5.878 5.878 0 0 0-1.38 2.127C.321 4.926.12 5.8.064 7.076.008 8.354-.005 8.764.001 12.023c.007 3.259.021 3.667.083 4.947.061 1.277.264 2.149.563 2.911.308.789.72 1.457 1.388 2.123a5.872 5.872 0 0 0 2.129 1.38c.763.295 1.636.496 2.913.552 1.278.056 1.689.069 4.947.063 3.257-.007 3.668-.021 4.947-.082 1.28-.06 2.147-.265 2.91-.563a5.881 5.881 0 0 0 2.123-1.388 5.881 5.881 0 0 0 1.38-2.129c.295-.763.496-1.636.551-2.912.056-1.28.07-1.69.063-4.948-.006-3.258-.02-3.667-.081-4.947-.06-1.28-.264-2.148-.564-2.911a5.892 5.892 0 0 0-1.387-2.123 5.857 5.857 0 0 0-2.128-1.38C19.074.322 18.202.12 16.924.066 15.647.009 15.236-.006 11.977 0 8.718.008 8.31.021 7.03.084m.14 21.693c-1.17-.05-1.805-.245-2.228-.408a3.736 3.736 0 0 1-1.382-.895 3.695 3.695 0 0 1-.9-1.378c-.165-.423-.363-1.058-.417-2.228-.06-1.264-.072-1.644-.08-4.848-.006-3.204.006-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.477-.96.895-1.382a3.705 3.705 0 0 1 1.379-.9c.423-.165 1.057-.361 2.227-.417 1.265-.06 1.644-.072 4.848-.08 3.203-.006 3.583.006 4.85.062 1.168.05 1.804.244 2.227.408.56.216.96.475 1.382.895.421.42.681.817.9 1.378.165.422.362 1.056.417 2.227.06 1.265.074 1.645.08 4.848.005 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.805-.408 2.23-.216.56-.477.96-.896 1.38a3.705 3.705 0 0 1-1.378.9c-.422.165-1.058.362-2.226.418-1.266.06-1.645.072-4.85.079-3.204.007-3.582-.006-4.848-.06m9.783-16.192a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012a6.161 6.161 0 1 0 12.323-.024 6.162 6.162 0 0 0-12.323.024M8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008',
  WhatsApp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
}

// Text and link columns: Admin › Pages › Footer. Contact details and social links: Admin › Settings.
const useWide = () => {
  const query = '(min-width: 1024px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

function Footer({ sticky }) {
  const wide = useWide()
  const [openCols, setOpenCols] = useState({})
  const settings = useSettings().data
  const footer = settings?.footer ?? {}
  const store = settings?.store ?? {}
  const hours = settings?.contact_page?.hours
  const contact = [
    store.address && [store.address],
    store.phone && [store.phone, `tel:${store.phone.replace(/[^\d+]/g, '')}`],
    store.email && [store.email, `mailto:${store.email}`],
    hours && [hours],
  ].filter(Boolean)
  const social = [['Facebook', store.facebook], ['Instagram', store.instagram], ['WhatsApp', waLink(store.whatsapp)]].filter(([, url]) => url)
  const columns = [...(footer.columns ?? []), ...(contact.length ? [{ title: 'Contact', links: contact.map(([label, link]) => ({ label, link })) }] : [])]
  const copyright = (footer.copyright || '© {year} XERQO. All rights reserved.').replaceAll('{year}', new Date().getFullYear())
  return (
    <footer className={cx('bg-espresso text-white sm:pb-0', sticky ? 'pb-40' : 'pb-24')}>
      <div className="container-x">
        {footer.newsletter?.enabled && (
          <div className="border-b border-white/10 py-6 lg:py-8">
            <div><h3 className="h-display text-3xl sm:text-4xl">{footer.newsletter.title}</h3>{footer.newsletter.text && <p className="mt-1 text-sm text-white/60">{footer.newsletter.text}</p>}</div>
          </div>
        )}
        <div className={cx('grid gap-8 pb-4 pt-6 lg:pb-8 lg:pt-8', ['lg:grid-cols-[1.4fr]', 'lg:grid-cols-[1.4fr_1fr]', 'lg:grid-cols-[1.4fr_repeat(2,1fr)]', 'lg:grid-cols-[1.4fr_repeat(3,1fr)]', 'lg:grid-cols-[1.4fr_repeat(4,1fr)]'][columns.length])}>
          <div className="space-y-4">
            <Logo light imgClassName="h-14 w-auto sm:h-16 lg:h-[72px]" />
            {footer.about && <p className="max-w-[300px] text-sm leading-relaxed text-white/60">{footer.about}</p>}
            {social.length > 0 && (
              <div className="flex gap-2.5">
                {social.map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noreferrer" aria-label={name} title={name} className="grid size-9 place-items-center rounded-full border border-white/25 text-gold transition hover:border-gold hover:bg-gold hover:text-espresso">
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d={SOCIAL_ICONS[name]} /></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
          {columns.map((col, ci) => {
            // phones / tablets: closed until tapped; desktop: always open
            const open = wide || !!openCols[ci]
            return (
              <div key={ci} className="border-b border-white/10 lg:border-0">
                <button type="button" onClick={() => setOpenCols((o) => ({ ...o, [ci]: !o[ci] }))} aria-expanded={open} disabled={wide}
                  className="flex w-full items-center justify-between py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gold lg:cursor-default lg:py-0 lg:pb-4">
                  {col.title}{open ? <Minus className="size-4 text-white lg:hidden" /> : <Plus className="size-4 text-white lg:hidden" />}
                </button>
                {open && <ul className="space-y-3 pb-4 text-sm text-white/70 lg:pb-0">{col.links.map((l, i) => <li key={i}>{l.link ? <FooterLink to={l.link}>{l.label}</FooterLink> : l.label}</li>)}</ul>}
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">{copyright}</p>
          <p className="text-xs text-white/50">Design and Development By <span className="font-semibold text-white/80">Badhon Sheikh</span></p>
        </div>
      </div>
    </footer>
  )
}

function BottomNav() {
  const { setDrawer } = useUI()
  const item = 'flex flex-col items-center gap-1 text-[10px]'
  const cls = ({ isActive }) => cx(item, isActive ? 'font-semibold text-tan' : 'text-mute')
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-between bg-white px-6 pb-5 pt-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden">
      <NavLink to="/" end className={cls}><Home className="size-5" />Home</NavLink>
      <NavLink to="/shop" className={cls}><LayoutGrid className="size-5" />Shop</NavLink>
      <NavLink to="/account/wishlist" className={cls}><Heart className="size-5" />Wishlist</NavLink>
      <button onClick={() => setDrawer(true)} className={cx(item, 'text-mute')}><ShoppingBag className="size-5" />Cart</button>
      <NavLink to="/account" end className={cls}><User className="size-5" />Account</NavLink>
    </nav>
  )
}

/* Right-side fixed widgets: mini cart, scroll-to-top, live chat */
function FloatingWidgets({ showCart, sticky }) {
  const { setDrawer } = useUI()
  const { count, subtotal } = useCart()
  const store = useSettings().data?.store
  const whatsapp = (store?.whatsapp || '').replace(/\D/g, '')
  const chat = store?.show_chat_button !== false && whatsapp
  return (
    <>
      {showCart && count > 0 && (
        <button onClick={() => setDrawer(true)} className="fixed right-0 top-[40%] z-30 w-[62px] overflow-hidden rounded-l-xl shadow-[-4px_6px_18px_rgba(0,0,0,0.18)] sm:top-[44%] sm:w-[84px]" aria-label="Open mini cart">
          <span className="flex flex-col items-center gap-1 bg-tan px-2 py-2.5 text-white sm:py-3"><ShoppingBag className="size-5 sm:size-6" /><span className="text-[10px] font-semibold sm:text-xs">{count} {count === 1 ? 'Item' : 'Items'}</span></span>
          <span className="block bg-white py-1.5 text-center text-[11px] font-bold text-tan sm:py-2 sm:text-[13px]">{tk(subtotal)}</span>
        </button>
      )}
      <button onClick={() => window.scrollTo({ top: 0 })} aria-label="Scroll to top" className={cx('fixed right-3.5 z-30 grid size-10', sticky ? 'bottom-[214px]' : 'bottom-[150px]', ' place-items-center rounded-full border-[1.5px] border-tan bg-white/90 p-[3px] sm:bottom-[120px] sm:right-[22px] sm:size-12')}>
        <span className="grid size-full place-items-center rounded-full bg-tan text-white"><ChevronUp className="size-5" /></span>
      </button>
      {chat && (
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="Live chat on WhatsApp" className={cx('fixed right-3 z-30 grid size-12', sticky ? 'bottom-[156px]' : 'bottom-[92px]', ' place-items-center rounded-full rounded-tr-xl bg-tan text-white shadow-[0_6px_16px_rgba(77,38,13,0.35)] sm:bottom-11 sm:right-[18px] sm:size-14')}>
          <MessageCircle className="size-6" />
        </a>
      )}
    </>
  )
}

const NO_MINI_CART = ['/cart', '/checkout', '/order-success', '/login', '/register', '/forgot-password']

/* Shown to visitors while Settings → General → Maintenance mode is on */
function Maintenance({ settings }) {
  const store = settings?.store ?? {}
  const whatsapp = (store.whatsapp || '').replace(/\D/g, '')
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 py-16 text-center">
      <div className="max-w-md space-y-5">
        <img src="/images/logo.png" alt={store.name || 'XERQO'} className="mx-auto h-14" />
        <h1 className="h-display text-[34px] sm:text-[44px]">We’ll be back soon</h1>
        <p className="text-sm leading-relaxed text-mute">{settings?.maintenance?.message || 'We are making a few improvements. Please check back shortly.'}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {store.phone && <Button as="a" href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} variant="outline">Call {store.phone}</Button>}
          {whatsapp && <Button as="a" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" variant="tan">WhatsApp us</Button>}
        </div>
      </div>
    </main>
  )
}

const DEFAULT_DESCRIPTION = typeof document !== 'undefined' ? document.querySelector('meta[name=description]')?.getAttribute('content') : ''

export default function StoreLayout() {
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  const settings = useSettings().data
  const seo = settings?.seo
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); setMenu(false) }, [pathname])
  // page title + description from Settings → SEO (product pages set their own title)
  useEffect(() => {
    if (!pathname.startsWith('/product/')) document.title = seo?.meta_title || 'XERQO'
    document.querySelector('meta[name=description]')?.setAttribute('content', seo?.meta_description || DEFAULT_DESCRIPTION || '')
  }, [pathname, seo?.meta_title, seo?.meta_description])

  // pages with a sticky mobile action bar above the bottom nav
  const sticky = pathname.startsWith('/product/') || pathname === '/cart' || pathname === '/checkout'
  const ui = useMemo(() => ({ drawer, setDrawer, menu, setMenu }), [drawer, menu])

  // staff signed in to the admin can still look around while the shop is closed
  if (settings?.maintenance?.enabled && !tokens.get('admin')) return <Maintenance settings={settings} />
  return (
    <StoreUI.Provider value={ui}>
      <WishlistProvider>
      <Header />
      <main className="min-h-[60vh]"><Outlet /></main>
      <Footer sticky={sticky} />
      <BottomNav />
      <FloatingWidgets showCart={!NO_MINI_CART.includes(pathname)} sticky={sticky} />
      <CartDrawer />
      <MobileMenu />
      </WishlistProvider>
    </StoreUI.Provider>
  )
}
