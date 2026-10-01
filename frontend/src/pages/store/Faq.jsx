import { useState } from 'react'
import { Search, Plus, Minus, MessageCircle, Phone } from 'lucide-react'
import { Breadcrumb, Button, cx } from '../../components/store/ui'

const FAQS = {
  'Orders & Payment': [
    ['How do I place an order?', 'Add items to your cart, tap Checkout and enter your name, phone and address. No account needed — we confirm every order by phone.'],
    ['Which payment methods do you accept?', 'Cash on Delivery, bKash, Nagad, and Visa / Mastercard via SSLCommerz.'],
    ['Is it safe to pay online?', 'Yes. Card and wallet payments are processed by SSLCommerz — we never see or store your card details.'],
    ['Can I cancel my order?', 'You can cancel any time before it is handed to the courier. Call or WhatsApp us with your order ID.'],
    ['Do you offer discounts on bulk orders?', 'Yes — orders of 25+ pieces get corporate pricing. Contact us for a quote.'],
    ['Will I get an invoice?', 'An invoice is sent by SMS/email and is available in My Account → Orders.'],
  ],
  Delivery: [
    ['How long does delivery take?', 'Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days via Steadfast / Pathao. Engraved items need +1 day.'],
    ['What are the delivery charges?', 'Inside Dhaka ৳60, Dhaka suburbs ৳100, outside Dhaka ৳120. Orders above ৳2,000 ship free.'],
    ['Do you deliver to all 64 districts?', 'Yes, we deliver to every district in Bangladesh through our courier partners.'],
    ['Can I pay cash on delivery?', 'Yes, COD is available everywhere. You can check the item before paying the rider.'],
    ['How do I track my order?', 'Use the Track Order page with your order ID and phone number, or open My Account → Orders.'],
    ['Can I change my address after ordering?', 'Yes, as long as the order hasn’t shipped. Message us on WhatsApp with the new address.'],
    ['What if I’m not home during delivery?', 'The rider will call you to reschedule. Parcels are held for up to 3 days.'],
    ['Do you ship internationally?', 'Not yet — we currently ship within Bangladesh only.'],
  ],
  'Returns & Exchange': [
    ['What is your return policy?', 'Unused items with tags and box can be returned within 7 days of delivery.'],
    ['Can I exchange for another colour?', 'Yes, size/colour exchange is free within 7 days.'],
    ['How long do refunds take?', 'Refunds reach your bKash / Nagad / bank within 3–5 working days after inspection.'],
    ['Can engraved items be returned?', 'Personalised items can only be returned if they are faulty.'],
    ['What if my item arrives damaged?', 'Send us an unboxing photo or video within 48 hours and we’ll replace it free.'],
  ],
  'Engraving & Custom': [
    ['Is engraving really free?', 'Yes — up to 12 characters on wallets, passport covers and key holders.'],
    ['How long does engraving take?', 'Engraved orders ship within 48 hours.'],
    ['Can I engrave a logo?', 'Logo debossing is available for corporate orders from 25 pieces.'],
    ['Which fonts can I choose?', 'Classic serif, block capitals or script — preview it on the product page.'],
  ],
  'Leather Care': [
    ['How do I clean my wallet?', 'Wipe with a soft dry cloth. Avoid water and chemical cleaners.'],
    ['How often should I condition it?', 'Every 3 months with a neutral leather conditioner keeps it supple.'],
    ['Will the colour change over time?', 'Full-grain leather develops a rich patina — that’s part of its charm.'],
  ],
  Account: [
    ['Do I need an account to order?', 'No, guest checkout works fine. An account lets you track orders and save addresses.'],
    ['How do I reset my password?', 'Tap “Forgot password” on the login page and verify with an OTP.'],
    ['How do reward points work?', 'Earn points on every order and photo review; redeem them at checkout.'],
    ['How do I delete my account?', 'Go to My Account → Profile and tap “Delete my account”.'],
  ],
}
const CATS = Object.keys(FAQS)

function Hero() {
  return (
    <section className="relative overflow-hidden bg-espresso text-white">
      <img src="/images/wallet-cash.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
      <div className="container-x relative space-y-3 py-7 sm:space-y-4 sm:py-12">
        <Breadcrumb light items={[{ label: 'Home', to: '/' }, { label: 'Help Center' }]} />
        <h1 className="h-display text-[34px] sm:text-[44px] lg:text-[56px]">How can we help?</h1>
        <label className="flex max-w-xl items-center gap-3 rounded-full bg-white px-4 py-3 text-ink sm:px-5">
          <Search className="size-4 shrink-0 text-mute" />
          <input placeholder="Search: delivery time, return, engraving…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute" />
        </label>
      </div>
    </section>
  )
}

export default function Faq() {
  const [cat, setCat] = useState('Delivery')
  return (
    <>
      <Hero />
      <div className="container-x flex flex-col gap-5 py-6 sm:py-10 lg:flex-row lg:gap-10">
        <aside className="lg:w-[240px] lg:shrink-0">
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col lg:gap-1 lg:rounded-lg lg:bg-white lg:p-3">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cx('flex shrink-0 items-center justify-between gap-4 rounded-full px-4 py-2 text-[13px] font-medium lg:rounded-md lg:px-3.5 lg:py-3 lg:text-sm',
                cat === c ? 'bg-ink text-white lg:bg-sand lg:font-semibold lg:text-ink' : 'border border-line bg-white lg:border-0 lg:hover:bg-cream')}>
                {c}<span className="hidden text-xs text-mute lg:inline">{FAQS[c].length}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-8 sm:space-y-12">
          <div>
            <h2 className="h-display mb-2 text-[30px] sm:text-4xl">{cat}</h2>
            <div className="divide-y divide-line border-b border-line">
              {FAQS[cat].map(([q, a], i) => (
                <details key={q} open={i < 2} className="group py-4 sm:py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
                    {q}
                    <Plus className="mt-0.5 size-4 shrink-0 text-tan group-open:hidden" />
                    <Minus className="mt-0.5 hidden size-4 shrink-0 text-tan group-open:block" />
                  </summary>
                  <p className="pt-3 text-sm leading-relaxed text-mute">{a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-lg bg-espresso p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <h3 className="h-display text-[28px] sm:text-[32px]">Still need help?</h3>
              <p className="text-[13px] text-white/70">Our team replies within minutes on WhatsApp (10am–8pm).</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as="a" href="https://wa.me/8801000000000" target="_blank" rel="noreferrer" variant="tan"><MessageCircle className="size-4" />WhatsApp us</Button>
              <Button as="a" href="tel:+8801000000000" variant="soft"><Phone className="size-4" />Call us</Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
