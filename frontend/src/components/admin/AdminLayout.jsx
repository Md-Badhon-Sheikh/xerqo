import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, ClipboardList, Undo2, Truck, Package, Tag, Layers, Users, Star, Percent, Image, Wallet, BarChart3, Shield, Settings,
  Search, Eye, Bell, Menu, X, MoreHorizontal, MessageSquare, Lock, LogOut, ShieldOff, BadgeCheck, Zap,
} from 'lucide-react'
import { cx, Btn } from './ui'
import { useAdminAuth } from '../../context/AuthContext'
import { RequireAdmin } from '../common/guards'

// Permission module (Role::MODULES on the API) that guards an /admin/... path; null = every staff member
const MODULE_ALIASES = { '': 'dashboard', invoice: 'orders', brands: 'categories', 'flash-sales': 'coupons' }
const MODULES = ['dashboard', 'orders', 'returns', 'shipments', 'products', 'categories', 'inventory', 'customers', 'reviews', 'coupons', 'content', 'payments', 'reports', 'staff', 'settings']
export function moduleFor(path) {
  const seg = path.replace(/^\/admin\/?/, '').split(/[/#?]/)[0]
  const m = MODULE_ALIASES[seg] ?? seg
  return MODULES.includes(m) ? m : null
}

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const NAV = [
  ['MAIN', [['Dashboard', '/admin', LayoutGrid], ['Orders', '/admin/orders', ClipboardList, '24'], ['Returns', '/admin/returns', Undo2, '3'], ['Shipping', '/admin/shipments', Truck]]],
  ['CATALOG', [['Products', '/admin/products', Package], ['Categories', '/admin/categories', Tag], ['Brands', '/admin/brands', BadgeCheck], ['Inventory', '/admin/inventory', Layers]]],
  ['CUSTOMERS', [['Customers', '/admin/customers', Users], ['Reviews', '/admin/reviews', Star, '5']]],
  ['MARKETING', [['Coupons', '/admin/coupons', Percent], ['Flash Sales', '/admin/flash-sales', Zap], ['Content & Banners', '/admin/content', Image]]],
  ['FINANCE', [['Payments & COD', '/admin/payments', Wallet], ['Reports', '/admin/reports', BarChart3]]],
  ['SYSTEM', [['Staff & Roles', '/admin/staff', Shield], ['Settings', '/admin/settings', Settings]]],
]

const LogoTile = ({ size = 34 }) => (
  <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-lg bg-white p-1"><img src="/images/logo-dark.png" alt="XERQO" className="max-h-full" /></span>
)

function Sidebar({ rail, onNavigate }) {
  const { can } = useAdminAuth()
  const nav = NAV
    .map(([group, items]) => [group, items.filter(([, to]) => { const m = moduleFor(to); return !m || can(m) })])
    .filter(([, items]) => items.length)
  return (
    <aside className={cx('flex h-full flex-col bg-espresso py-5 text-white', rail ? 'w-[72px] items-center px-3' : 'w-[232px] px-3.5 2xl:w-[256px]')}>
      <Link to="/admin" className={cx('mb-3 flex items-center gap-2.5 pb-2', !rail && 'px-1.5')}>
        <LogoTile size={rail ? 40 : 34} />
        {!rail && <><span className="font-display text-[26px] font-bold tracking-[0.22em]">XERQO</span><span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-espresso">ADMIN</span></>}
      </Link>
      <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto">
        {nav.map(([group, items]) => (
          <div key={group} className={cx(rail && 'border-t border-white/10 pt-2 first:border-0')}>
            {!rail && <p className="px-2 pb-1 pt-2.5 text-[10px] font-semibold tracking-[0.14em] text-white/40">{group}</p>}
            {items.map(([name, to, Icon, count]) => (
              <NavLink key={name} to={to} end={to === '/admin'} onClick={onNavigate} title={name}
                className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px]', rail && 'justify-center', isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
                {({ isActive }) => <>
                  <Icon className={cx('size-[17px] shrink-0', isActive && 'text-gold')} />
                  {!rail && <span className="flex-1">{name}</span>}
                  {!rail && count && <span className="rounded-full bg-tan px-1.5 text-[10px] font-bold">{count}</span>}
                </>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {!rail && (
        <div className="mt-3 space-y-1.5 rounded-xl bg-white/5 p-3">
          <p className="text-[11px] text-white/50">Store status</p>
          <p className="text-[13px] font-semibold text-gold">● Live · xerqo.com</p>
        </div>
      )}
    </aside>
  )
}

function Topbar({ onMenu }) {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }) }
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-aline bg-white px-4 py-3 sm:px-6 sm:py-4 xl:px-7">
      <div className="flex items-center gap-2.5 sm:hidden">
        <button onClick={onMenu} aria-label="Menu"><Menu className="size-5" /></button>
        <LogoTile size={30} /><span className="font-display text-[22px] font-bold tracking-[0.18em]">XERQO</span>
      </div>
      <label className="hidden w-[260px] items-center gap-2 rounded-lg border border-aline px-3 py-2.5 text-[13px] text-amute sm:flex xl:w-[420px]">
        <Search className="size-[15px]" /><input className="flex-1 bg-transparent outline-none placeholder:text-amute" placeholder="Search orders, products, customers…" /><kbd className="hidden text-[11px] xl:inline">⌘K</kbd>
      </label>
      <div className="flex items-center gap-3.5 sm:gap-[18px]">
        <a href="/" target="_blank" className="hidden items-center gap-2 rounded-lg border border-aline px-3 py-2 text-xs font-semibold sm:flex"><Eye className="size-[15px]" /><span className="hidden xl:inline">View store</span></a>
        <Link to="/admin/notifications" className="relative" aria-label="Notifications"><Bell className="size-5" /><span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-bad" /></Link>
        <Link to="/admin/profile" className="flex items-center gap-2.5">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="size-8 rounded-full object-cover sm:size-9" />
            : <span className="grid size-8 place-items-center rounded-full bg-tan text-xs font-bold text-white sm:size-9">{initials(user?.name)}</span>}
          <span className="hidden leading-tight xl:block"><b className="block text-[13px]">{user?.name}</b><span className="text-[11px] text-amute">{user?.role?.name}</span></span>
        </Link>
        <button onClick={signOut} title="Log out" aria-label="Log out" className="hidden text-amute transition hover:text-bad sm:block"><LogOut className="size-[18px]" /></button>
      </div>
    </header>
  )
}

function MobileTabs() {
  const { pathname } = useLocation()
  const { can } = useAdminAuth()
  const map = [['Dashboard', '/admin', LayoutGrid, ['/admin']], ['Orders', '/admin/orders', ClipboardList, ['/admin/orders', '/admin/returns', '/admin/shipments', '/admin/invoice']], ['Products', '/admin/products', Package, ['/admin/products', '/admin/categories', '/admin/inventory']], ['Customers', '/admin/customers', Users, ['/admin/customers', '/admin/reviews']]
  ].filter(([, to]) => can(moduleFor(to)))
  const activeIdx = map.findIndex(([, , , paths]) => paths.some((p) => (p === '/admin' ? pathname === p : pathname.startsWith(p))))
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-between border-t border-aline bg-white px-[18px] pb-5 pt-2.5 sm:hidden">
      {map.map(([n, to, I], i) => <Link key={n} to={to} className={cx('flex flex-col items-center gap-1 text-[10px]', i === activeIdx ? 'font-semibold text-tan' : 'text-amute')}><I className="size-5" />{n}</Link>)}
      <span className={cx('flex flex-col items-center gap-1 text-[10px]', activeIdx < 0 ? 'font-semibold text-tan' : 'text-amute')}><MoreHorizontal className="size-5" />More</span>
    </nav>
  )
}

function NoAccess() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-aline bg-white px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-bad/10"><ShieldOff className="size-5 text-bad" /></span>
      <h1 className="text-lg font-bold">You don’t have access to this page</h1>
      <p className="max-w-sm text-[13px] text-amute">Your role doesn’t include this section. Ask a Super Admin to update your permissions.</p>
      <Btn to="/admin" v="white" sm>Back to dashboard</Btn>
    </div>
  )
}

export default function AdminLayout() {
  return <RequireAdmin><AdminShell /></RequireAdmin>
}

function AdminShell() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const { can } = useAdminAuth()
  const module = moduleFor(pathname)
  useEffect(() => { window.scrollTo(0, 0); setDrawer(false) }, [pathname])
  return (
    <div className="flex min-h-screen bg-abg text-ink">
      <div className="sticky top-0 hidden h-screen shrink-0 sm:block xl:hidden"><Sidebar rail /></div>
      <div className="sticky top-0 hidden h-screen shrink-0 xl:block"><Sidebar /></div>
      {/* mobile drawer */}
      <div className={cx('fixed inset-0 z-50 sm:hidden', drawer ? 'visible' : 'invisible')}>
        <div onClick={() => setDrawer(false)} className={cx('absolute inset-0 bg-black/40 transition', drawer ? 'opacity-100' : 'opacity-0')} />
        <div className={cx('absolute inset-y-0 left-0 transition-transform', drawer ? 'translate-x-0' : '-translate-x-full')}>
          <button onClick={() => setDrawer(false)} className="absolute -right-10 top-4 grid size-8 place-items-center rounded-full bg-white" aria-label="Close menu"><X className="size-4" /></button>
          <Sidebar onNavigate={() => setDrawer(false)} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="flex-1 space-y-4 px-4 pb-28 pt-[18px] sm:space-y-6 sm:px-6 sm:pb-10 sm:pt-7 xl:px-7 2xl:px-8">
          {!module || can(module) ? <Outlet /> : <NoAccess />}
        </main>
      </div>
      <MobileTabs />
    </div>
  )
}

/* Settings sub-navigation (left card on desktop, scrollable chips on tablet/mobile) */
const SNAV = [['General', '/admin/settings/general', Settings], ['Delivery & Zones', '/admin/settings', Truck], ['Payments', '/admin/settings#payments', Wallet], ['Couriers', '/admin/settings#couriers', Package], ['SMS & Notifications', '/admin/settings/sms', MessageSquare], ['Staff & Roles', '/admin/staff', Users], ['Security', '/admin/settings/security', Lock]]
export function SettingsShell({ children }) {
  const { pathname, hash } = useLocation()
  // NavLink ignores #hash, so resolve the active item manually
  const isActive = (to) => { const [p, h] = to.split('#'); return pathname === p && (h ? hash === `#${h}` : !(p === '/admin/settings' && hash)) }
  return (
    <div className="flex flex-col gap-3.5 xl:flex-row xl:gap-5">
      <nav className="hidden w-[220px] shrink-0 space-y-0.5 self-start rounded-xl border border-aline bg-white p-2.5 xl:block">
        {SNAV.map(([t, to, I]) => <Link key={t} to={to} className={cx('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]', isActive(to) ? 'bg-asoft font-semibold' : 'hover:bg-abg')}><I className={cx('size-[15px]', isActive(to) ? 'text-tan' : 'text-amute')} />{t}</Link>)}
      </nav>
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 xl:hidden">
        {SNAV.map(([t, to, I]) => <Link key={t} to={to} className={cx('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs', isActive(to) ? 'bg-ink font-semibold text-white' : 'border border-aline bg-white')}><I className="size-3.5" />{t}</Link>)}
      </nav>
      <div className="min-w-0 flex-1 space-y-4 sm:space-y-5">{children}</div>
    </div>
  )
}
