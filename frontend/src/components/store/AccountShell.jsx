import { Link, useLocation } from 'react-router-dom'
import { Package, Star, Heart, MapPin, User, LogOut } from 'lucide-react'
import { cx } from './ui'

const ITEMS = [
  ['Orders', '/account', Package],
  ['My Reviews', '/account/reviews', Star],
  ['Wishlist', '/account/wishlist', Heart],
  ['Addresses', '/account/profile#addresses', MapPin],
  ['Profile', '/account/profile', User],
]

// NavLink ignores #hash, so resolve the active item manually
function useActive() {
  const { pathname, hash } = useLocation()
  return (to) => {
    const [path, h] = to.split('#')
    if (path === '/account/reviews' && pathname.startsWith('/account/review')) return true
    return pathname === path && (h ? hash === `#${h}` : !(path === '/account/profile' && hash === '#addresses'))
  }
}

/* Sidebar on desktop, scrollable pill tabs on tablet/mobile */
export function AccountShell({ title, hideUser, children }) {
  const isActive = useActive()
  return (
    <div className="container-x flex flex-col gap-5 py-5 sm:py-10 lg:flex-row lg:gap-8">
      <aside className="lg:w-[240px] lg:shrink-0">
        <div className="hidden space-y-1 rounded-lg bg-white p-3 lg:block">
          {!hideUser && <div className="mb-2 flex items-center gap-3 border-b border-line px-2 pb-4 pt-2">
            <span className="grid size-11 place-items-center rounded-full bg-tan font-bold text-white">RU</span>
            <div><p className="font-semibold">Rahim Uddin</p><p className="text-xs text-mute">Member since 2025</p></div>
          </div>}
          {ITEMS.map(([t, to, I]) => (
            <Link key={t} to={to} className={cx('flex items-center gap-3 rounded-md px-3.5 py-3 text-sm', isActive(to) ? 'bg-sand font-semibold' : 'hover:bg-cream')}>
              <I className={cx('size-[18px]', isActive(to) ? 'text-tan' : 'text-mute')} />{t}
            </Link>
          ))}
          <Link to="/login" className="flex items-center gap-3 rounded-md px-3.5 py-3 text-sm text-rust hover:bg-cream"><LogOut className="size-[18px]" />Sign out</Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:hidden">
          {ITEMS.map(([t, to]) => (
            <Link key={t} to={to} className={cx('shrink-0 rounded-full px-4 py-2 text-[13px] font-medium', isActive(to) ? 'bg-ink text-white' : 'border border-line bg-white')}>{t}</Link>
          ))}
        </div>
      </aside>
      <section className="min-w-0 flex-1 space-y-4 sm:space-y-5">
        {title && <h1 className="h-display text-[30px] sm:text-4xl">{title}</h1>}
        {children}
      </section>
    </div>
  )
}

/* Split auth layout: brand photo (desktop) + form card */
export function AuthShell({ photo = '/images/workshop.jpg', quote = 'Leather that ages beautifully — just like your story.', children }) {
  return (
    <div className="flex min-h-[calc(100vh-110px)] items-stretch">
      <div className="relative hidden w-[46%] overflow-hidden lg:block">
        <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/10 to-espresso/85" />
        <div className="absolute inset-x-14 bottom-14 space-y-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">XERQO Members</p>
          <p className="h-display text-[38px]">{quote}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-16">
        <div className="w-full max-w-[460px] space-y-5 rounded-xl bg-white p-6 sm:p-10">{children}</div>
      </div>
    </div>
  )
}
