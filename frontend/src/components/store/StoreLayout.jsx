import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronUp, MessageCircle, Home, LayoutGrid, Plus, Trash2, Truck, ChevronDown, GitCompareArrows } from 'lucide-react'
import { tk } from '../../data/store'
import { Button, Qty, cx } from './ui'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import { StoreUI, useUI } from '../../context/StoreUIContext'
import { WishlistProvider } from '../../context/WishlistContext'
import { useCategories, useSettings } from '../../lib/queries'

const NAV = [['Home', '/'], ['Shop', '/shop'], ['Wallets', '/shop?c=wallets'], ['Bags', '/shop?c=bags'], ['Women', '/shop?c=womens-purses'], ['Travel', '/shop?c=passport-covers'], ['About Us', '/about'], ['Contact', '/contact']]

// Free-delivery threshold from the store settings (falls back to ৳2,000 while loading)
const useFreeDelivery = () => useSettings().data?.delivery?.free_delivery_threshold ?? 2000

export const Logo = ({ light, className }) => (
  <Link to="/" aria-label="XERQO home" className={cx('block shrink-0', className)}>
    <img src={light ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="XERQO" className="h-10 w-auto sm:h-12 lg:h-[52px]" />
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

function Header() {
  const { setDrawer, setMenu } = useUI()
  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div className="border-b border-line bg-white">
        <div className="container-x flex items-center justify-between gap-6 py-2 lg:py-3">
          {/* mobile / tablet left */}
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setMenu(true)} aria-label="Menu"><Menu className="size-[22px]" /></button>
            <Link to="/search" aria-label="Search" className="hidden sm:block"><Search className="size-5" /></Link>
          </div>
          <Logo className="lg:order-none" />
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV.map(([n, to]) => (
              <NavLink key={n} to={to} end className={({ isActive }) => cx('text-sm font-medium transition hover:text-tan', isActive && to === '/' && 'text-tan')}>{n}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link to="/search" className="hidden items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[13px] text-mute xl:flex"><Search className="size-4" /> Search products…</Link>
            <Link to="/search" aria-label="Search" className="sm:hidden xl:hidden lg:block"><Search className="size-5" /></Link>
            <CompareIcon />
            <Link to="/account/wishlist" aria-label="Wishlist" className="hidden sm:block"><Heart className="size-5" strokeWidth={1.7} /></Link>
            <Link to="/account" aria-label="Account" className="hidden sm:block"><User className="size-5" strokeWidth={1.7} /></Link>
            <CartIcon onClick={() => setDrawer(true)} />
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

function Footer({ sticky }) {
  const G = [['Shop', ['Wallets', 'Long Wallets', 'Card Holders', 'Passport Covers', 'Key Holders', "Women's Purses", 'Bags', 'Belts']], ['Help', ['Track Order', 'Shipping & Delivery', 'Returns & Exchange', 'FAQs', 'Contact Us']], ['Company', ['Our Story', 'Corporate Gifting', 'Wholesale', 'Privacy Policy', 'Terms']], ['Contact', ['Dhaka, Bangladesh', '+880 1XXX-XXXXXX', 'hello@xerqo.com', 'Sat–Thu · 10am–8pm']]]
  const links = { 'Track Order': '/track', FAQs: '/faq', 'Contact Us': '/contact', 'Our Story': '/about', 'Privacy Policy': '/policy', Terms: '/policy', 'Shipping & Delivery': '/policy', 'Returns & Exchange': '/policy' }
  return (
    <footer className={cx('bg-espresso text-white sm:pb-8', sticky ? 'pb-40' : 'pb-24')}>
      <div className="container-x">
        <div className="flex flex-col gap-5 border-b border-white/10 py-10 md:flex-row md:items-center md:justify-between lg:py-14">
          <div><h3 className="h-display text-3xl sm:text-4xl">Join the XERQO circle</h3><p className="mt-1 text-sm text-white/60">New drops, care tips and member-only offers.</p></div>
          <form className="flex w-full max-w-md" onSubmit={(e) => e.preventDefault()}><input className="flex-1 border border-white/25 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/50" placeholder="Email or phone number" /><button className="bg-white px-5 text-xs font-semibold uppercase tracking-widest text-ink">Subscribe</button></form>
        </div>
        <div className="grid gap-8 py-10 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:py-14">
          <div className="space-y-4">
            <Logo light />
            <p className="max-w-[300px] text-sm leading-relaxed text-white/60">Genuine leather wallets, bags and travel goods — crafted for class, made to last.</p>
            <p className="text-[13px] font-medium text-gold"><a href="https://www.facebook.com/xerqo.bd" target="_blank" rel="noreferrer">Facebook</a> · Instagram · WhatsApp</p>
          </div>
          {G.map(([h, items]) => (
            <details key={h} className="group border-b border-white/10 lg:border-0" open>
              <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold lg:pointer-events-none lg:py-0 lg:pb-4">{h}<Plus className="size-4 text-white lg:hidden" /></summary>
              <ul className="space-y-3 pb-4 text-sm text-white/70">{items.map((i) => <li key={i}>{links[i] ? <Link to={links[i]} className="hover:text-white">{i}</Link> : <Link to="/shop" className="hover:text-white">{i}</Link>}</li>)}</ul>
            </details>
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">© 2026 XERQO. All rights reserved.</p>
          <div className="flex flex-wrap gap-1.5">{['bKash', 'Nagad', 'Visa', 'Mastercard', 'COD'].map((p) => <span key={p} className="rounded-sm border border-white/25 px-2 py-1 text-[11px] font-semibold text-white/80">{p}</span>)}</div>
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
  const whatsapp = (useSettings().data?.store?.whatsapp || '').replace(/\D/g, '')
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
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="Live chat on WhatsApp" className={cx('fixed right-3 z-30 grid size-12', sticky ? 'bottom-[156px]' : 'bottom-[92px]', ' place-items-center rounded-full rounded-tr-xl bg-tan text-white shadow-[0_6px_16px_rgba(77,38,13,0.35)] sm:bottom-11 sm:right-[18px] sm:size-14')}>
        <MessageCircle className="size-6" />
      </a>
    </>
  )
}

const NO_MINI_CART = ['/cart', '/checkout', '/order-success', '/login', '/register', '/forgot-password']

export default function StoreLayout() {
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false); setMenu(false) }, [pathname])
  // pages with a sticky mobile action bar above the bottom nav
  const sticky = pathname.startsWith('/product/') || pathname === '/cart' || pathname === '/checkout'
  const ui = useMemo(() => ({ drawer, setDrawer, menu, setMenu }), [drawer, menu])
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
