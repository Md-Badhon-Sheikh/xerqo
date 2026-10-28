import { useState } from 'react'
import { Phone, MessageCircle, Mail, MapPin, Camera, X } from 'lucide-react'
import { Button, Field, PageHero, cx } from '../../components/store/ui'
import { PageLoader, Spinner } from '../../components/common/feedback'
import Select2 from '../../components/common/Select2'
import { useAuth } from '../../context/AuthContext'
import { alertSuccess, toast } from '../../lib/alert'
import { api } from '../../lib/api'
import { waLink } from '../../lib/bd'
import { useSettings } from '../../lib/queries'

// Text, images and notes: Admin › Pages › Contact. Phone, WhatsApp, email and Facebook: Admin › Settings.

const linkProps = (link) => (/^https?:\/\//i.test(link || '') ? { as: 'a', href: link, target: '_blank', rel: 'noreferrer' } : { to: link || '/contact' })
const LG_COLS = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }

function channels(store, page) {
  const showroom = page.showroom ?? {}
  return [
    store.phone && [Phone, 'Call us', store.phone, page.hours, `tel:${store.phone.replace(/[^\d+]/g, '')}`],
    store.whatsapp && [MessageCircle, 'WhatsApp', 'Chat instantly', page.whatsapp_note, waLink(store.whatsapp)],
    store.email && [Mail, 'Email', store.email, page.email_note, `mailto:${store.email}`],
    showroom.enabled && showroom.area && [MapPin, 'Showroom', showroom.area, showroom.note, showroom.map_link || null],
  ].filter(Boolean)
}

const BLANK = { name: '', phone: '', subject: '', order_number: '', message: '', photo: null }

function ContactForm({ subjects }) {
  const { user } = useAuth()
  const [f, setF] = useState(() => ({ ...BLANK, name: user?.name ?? '', phone: user?.phone ?? '' }))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    const body = new FormData()
    Object.entries(f).forEach(([k, v]) => { if (v) body.append(k, v) })
    setBusy(true)
    setErrors({})
    try {
      const res = await api.post('/contact', body)
      setF({ ...BLANK, name: f.name, phone: f.phone })
      alertSuccess('Message sent', res?.message)
    } catch (err) {
      const fields = err.fields ?? {}
      setErrors(fields)
      if (!Object.keys(fields).length) toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg bg-white p-4 sm:space-y-5 sm:p-8">
      <h2 className="h-display text-[28px] sm:text-[34px]">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *" placeholder="Full name" value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} error={errors.name} />
        <Field label="Phone *" inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={20} error={errors.phone} />
        <Field label="Subject" error={errors.subject}>
          <Select2 variant="store" options={subjects} value={f.subject} onChange={(subject) => set({ subject })} placeholder="Choose a subject" search={false} />
        </Field>
        <Field label="Order ID (optional)" placeholder="XQ-" value={f.order_number} onChange={(e) => set({ order_number: e.target.value })} maxLength={30} error={errors.order_number} />
      </div>
      <Field label="Message *" error={errors.message}>
        <textarea rows={5} placeholder="How can we help?" value={f.message} onChange={(e) => set({ message: e.target.value })} maxLength={2000} className={cx('input resize-none', errors.message && 'border-rust')} />
      </Field>
      <div className="space-y-1">
        {f.photo ? (
          <p className="flex w-fit items-center gap-2 text-[13px] font-semibold text-tan">
            <Camera className="size-4" /><span className="max-w-[220px] truncate">{f.photo.name}</span>
            <button type="button" onClick={() => set({ photo: null })} aria-label="Remove photo" className="text-mute hover:text-ink"><X className="size-4" /></button>
          </p>
        ) : (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] font-semibold text-tan">
            <Camera className="size-4" />Attach photo (optional)
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const photo = e.target.files?.[0]; e.target.value = ''; if (photo) set({ photo }) }} />
          </label>
        )}
        {errors.photo && <p className="text-xs text-rust">{errors.photo}</p>}
      </div>
      <Button size="lg" disabled={busy} className="max-sm:w-full">{busy && <Spinner className="size-4 text-current" />}Send message</Button>
    </form>
  )
}

// Stylised map placeholder — no external embed
function MapBlock({ showroom }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-[#E8E1D4]">
      <svg viewBox="0 0 400 250" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <g stroke="#fff" fill="none" strokeLinecap="round">
          <path d="M-10 40 L410 0" strokeWidth="6" />
          <path d="M-10 110 L410 160" strokeWidth="10" />
          <path d="M-10 200 L410 120" strokeWidth="5" />
          <path d="M60 -10 L380 260" strokeWidth="3" />
          <path d="M-10 160 L300 260" strokeWidth="3" />
          <path d="M240 -10 L120 260" strokeWidth="4" />
          <path d="M-10 70 L410 90" strokeWidth="2" />
        </g>
      </svg>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-tan text-white shadow-md"><MapPin className="size-4" /></span>
        <span className="rounded bg-white px-2.5 py-1 text-xs font-semibold shadow-sm">{showroom.area}</span>
      </div>
      {showroom.map_link && <a href={showroom.map_link} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 rounded bg-white px-2.5 py-1.5 text-[11px] font-semibold shadow-sm hover:text-tan">Open in Maps</a>}
    </div>
  )
}

function Aside({ store, page }) {
  const showroom = page.showroom ?? {}
  const promo = page.promo ?? {}
  const facebook = store.facebook && store.facebook.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
  return (
    <aside className="space-y-4">
      {showroom.enabled && showroom.area && <MapBlock showroom={showroom} />}
      {promo.enabled && (
        <div className="relative overflow-hidden rounded-lg bg-espresso text-white">
          {promo.image && <img src={promo.image} alt="" className="absolute inset-0 size-full object-cover opacity-30" />}
          <div className="relative space-y-3 p-5 sm:p-6">
            {promo.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{promo.eyebrow}</p>}
            <p className="h-display text-2xl sm:text-[26px]">{promo.text}</p>
            {promo.button_text && <Button {...linkProps(promo.link)} variant="tan" size="sm" className="sm:!px-4 sm:!py-3">{promo.button_text}</Button>}
          </div>
        </div>
      )}
      {facebook && (
        <a href={store.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg bg-white p-4 transition hover:ring-1 hover:ring-line">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line"><svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.8-4.67 4.54-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z" /></svg></span>
          <span className="min-w-0"><b className="block truncate text-sm">{facebook}</b><span className="text-xs text-mute">Message us on Facebook</span></span>
        </a>
      )}
    </aside>
  )
}

export default function Contact() {
  const settings = useSettings().data
  const page = settings?.contact_page
  if (!page) return <PageLoader className="min-h-[60vh]" />
  const store = settings.store ?? {}
  const list = channels(store, page)
  const hasAside = (page.showroom?.enabled && page.showroom?.area) || page.promo?.enabled || store.facebook
  return (
    <>
      <PageHero image={page.hero?.image || undefined} title={page.hero?.title} sub={page.hero?.subtitle} />
      <div className="container-x space-y-5 py-6 sm:space-y-8 sm:py-10">
        {list.length > 0 && (
          <div className={cx('grid grid-cols-2 gap-3 sm:gap-4', LG_COLS[list.length])}>
            {list.map(([Icon, label, value, note, href]) => {
              const Tag = href ? 'a' : 'div'
              return (
                <Tag key={label} {...(href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : {})} className="min-w-0 space-y-1.5 rounded-lg bg-white p-3.5 transition hover:ring-1 hover:ring-line sm:p-5">
                  <span className="mb-2 grid size-9 place-items-center rounded-full bg-sand"><Icon className="size-4 text-tan" /></span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute sm:text-[11px]">{label}</p>
                  <p className="break-words text-[13px] font-bold sm:text-base">{value}</p>
                  {note && <p className="text-[11px] text-mute sm:text-xs">{note}</p>}
                </Tag>
              )
            })}
          </div>
        )}
        <div className={cx('grid items-start gap-5 lg:gap-8', hasAside && 'lg:grid-cols-[1.8fr_1fr]')}>
          <ContactForm subjects={page.subjects ?? []} />
          {hasAside && <Aside store={store} page={page} />}
        </div>
      </div>
    </>
  )
}
