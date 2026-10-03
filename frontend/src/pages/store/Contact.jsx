import { Phone, MessageCircle, Mail, MapPin, Camera } from 'lucide-react'
import { Button, Field, PageHero } from '../../components/store/ui'
import Select2 from '../../components/common/Select2'

const CHANNELS = [
  [Phone, 'Call us', '+880 1XXX-XXXXXX', 'Sat–Thu · 10am–8pm', 'tel:+8801000000000'],
  [MessageCircle, 'WhatsApp', 'Chat instantly', 'Replies in ~5 min', 'https://wa.me/8801000000000'],
  [Mail, 'Email', 'hello@xerqo.com', 'Reply within 24h', 'mailto:hello@xerqo.com'],
  [MapPin, 'Showroom', 'Dhanmondi, Dhaka', 'By appointment', null],
]

function ContactForm() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4 rounded-lg bg-white p-4 sm:space-y-5 sm:p-8">
      <h2 className="h-display text-[28px] sm:text-[34px]">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *" placeholder="Full name" />
        <Field label="Phone *" inputMode="tel" placeholder="01XXXXXXXXX" />
        <Field label="Subject">
          <Select2 variant="store" options={['Order support', 'Custom engraving', 'Corporate gifting', 'Returns & exchange', 'Other']} />
        </Field>
        <Field label="Order ID (optional)" placeholder="XQ-" />
      </div>
      <Field label="Message *"><textarea rows={5} placeholder="How can we help?" className="input resize-none" /></Field>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] font-semibold text-tan">
        <Camera className="size-4" />Attach photo (optional)<input type="file" accept="image/*" className="sr-only" />
      </label>
      <Button size="lg" className="max-sm:w-full">Send message</Button>
    </form>
  )
}

// Stylised map placeholder — no external embed
function MapBlock() {
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
        <span className="rounded bg-white px-2.5 py-1 text-xs font-semibold shadow-sm">XERQO Showroom</span>
      </div>
      <a href="https://maps.google.com/?q=Dhanmondi+Dhaka" target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 rounded bg-white px-2.5 py-1.5 text-[11px] font-semibold shadow-sm hover:text-tan">Open in Maps</a>
    </div>
  )
}

function Aside() {
  return (
    <aside className="space-y-4">
      <MapBlock />
      <div className="relative overflow-hidden rounded-lg bg-espresso text-white">
        <img src="/images/briefcase.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="relative space-y-3 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Corporate gifting</p>
          <p className="h-display text-2xl sm:text-[26px]">Branded wallets &amp; passport covers for your team — logo debossing from 25 pcs.</p>
          <Button variant="tan" size="sm" className="sm:!px-4 sm:!py-3">Request a quote</Button>
        </div>
      </div>
      <a href="https://facebook.com/xerqo.bd" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg bg-white p-4 transition hover:ring-1 hover:ring-line">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line"><svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.8-4.67 4.54-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.5c-1.5 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z" /></svg></span>
        <span><b className="block text-sm">facebook.com/xerqo.bd</b><span className="text-xs text-mute">Message us on Facebook</span></span>
      </a>
    </aside>
  )
}

export default function Contact() {
  return (
    <>
      <PageHero image="/images/keys-flower.jpg" crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} title="We’re here to help" sub="Questions about an order, custom engraving or corporate gifting? Reach us any way you like." />
      <div className="container-x space-y-5 py-6 sm:space-y-8 sm:py-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CHANNELS.map(([Icon, label, value, note, href]) => {
            const Tag = href ? 'a' : 'div'
            return (
              <Tag key={label} {...(href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : {})} className="min-w-0 space-y-1.5 rounded-lg bg-white p-3.5 transition hover:ring-1 hover:ring-line sm:p-5">
                <span className="mb-2 grid size-9 place-items-center rounded-full bg-sand"><Icon className="size-4 text-tan" /></span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute sm:text-[11px]">{label}</p>
                <p className="break-words text-[13px] font-bold sm:text-base">{value}</p>
                <p className="text-[11px] text-mute sm:text-xs">{note}</p>
              </Tag>
            )
          })}
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[1.8fr_1fr] lg:gap-8">
          <ContactForm />
          <Aside />
        </div>
      </div>
    </>
  )
}
