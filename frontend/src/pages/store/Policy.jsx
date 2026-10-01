import { useSearchParams } from 'react-router-dom'
import { Breadcrumb, Button, cx } from '../../components/store/ui'

const POLICIES = {
  shipping: {
    nav: 'Shipping Policy', title: 'Shipping & Delivery Policy',
    highlights: [['1–2 days', 'delivery inside Dhaka'], ['64', 'districts covered'], ['Free', 'shipping over ৳2,000']],
    sections: [
      ['Delivery times', 'Inside Dhaka: 1–2 working days. Outside Dhaka: 2–4 working days. Engraved and personalised items need one extra day.'],
      ['Delivery charges', 'Inside Dhaka ৳60, Dhaka suburbs ৳100, outside Dhaka ৳120. Orders above ৳2,000 ship free anywhere in Bangladesh.'],
      ['Courier partners', 'We ship with Steadfast and Pathao. You’ll get an SMS with the tracking ID as soon as your parcel is handed over.'],
      ['Cash on Delivery', 'COD is available in all 64 districts. You may check the item in front of the rider before paying.'],
      ['Failed delivery', 'If we can’t reach you, the rider will try again the next working day. Parcels are held for up to 3 days.'],
    ],
    cta: ['Track an order', '/track'],
  },
  returns: {
    nav: 'Returns & Refund', title: 'Returns & Refund Policy',
    highlights: [['7 days', 'to request a return'], ['Free', 'size/colour exchange'], ['3–5 days', 'refund to bKash/bank']],
    sections: [
      ['Eligibility', 'Items can be returned within 7 days of delivery if unused, with tags and original box. Engraved / personalised items can only be returned if faulty.'],
      ['How to request a return', 'Go to My Account → Orders → Request return, or WhatsApp us your order ID with photos. We confirm within 24 hours.'],
      ['Pickup & inspection', 'Our courier picks up the item (free inside Dhaka, ৳60 outside Dhaka). We inspect it within 2 working days.'],
      ['Refunds', 'Approved refunds go to your bKash / Nagad / bank within 3–5 working days. COD orders are refunded via bKash.'],
      ['Damaged or wrong item', 'Tell us within 48 hours with an unboxing photo/video — we replace it free.'],
    ],
    cta: ['Request a return', '/account'],
  },
  privacy: {
    nav: 'Privacy Policy', title: 'Privacy Policy',
    highlights: [['Never', 'sold to third parties'], ['SSL', 'encrypted checkout'], ['Opt-out', 'of SMS any time']],
    sections: [
      ['What we collect', 'Your name, phone number, delivery address and, optionally, email — only what we need to deliver your order.'],
      ['How we use it', 'To confirm and deliver orders, send order updates, and — if you opt in — share offers and new arrivals.'],
      ['Payments', 'Card and wallet payments are handled by SSLCommerz, bKash and Nagad. We never see or store your card details.'],
      ['Sharing', 'We share your address and phone only with our courier partners for delivery. We never sell your data.'],
      ['Your choices', 'You can update your details, turn off SMS offers or delete your account from My Account → Profile.'],
    ],
    cta: ['Manage my data', '/account/profile'],
  },
  terms: {
    nav: 'Terms & Conditions', title: 'Terms & Conditions',
    highlights: [['৳', 'prices include VAT'], ['24h', 'order confirmation call'], ['BD law', 'governs these terms']],
    sections: [
      ['Using this site', 'By placing an order you confirm the details you provide are accurate and that you are authorised to use the chosen payment method.'],
      ['Pricing & availability', 'Prices are in Bangladeshi Taka and include VAT. We may cancel an order if an item is out of stock or mispriced, with a full refund.'],
      ['Order confirmation', 'Every order is confirmed by a phone call. Unconfirmed COD orders may be cancelled after 24 hours.'],
      ['Personalisation', 'Please double-check engraving text — we engrave exactly what you enter.'],
      ['Governing law', 'These terms are governed by the laws of Bangladesh. Disputes fall under the courts of Dhaka.'],
    ],
    cta: ['Contact us', '/contact'],
  },
  warranty: {
    nav: 'Warranty', title: 'Warranty',
    highlights: [['1 year', 'stitching warranty'], ['Free', 'repair or replace'], ['Lifetime', 'care advice']],
    sections: [
      ['What’s covered', 'Stitching, zips, snaps and edge finishing are covered for 12 months from delivery.'],
      ['What’s not covered', 'Normal wear, scratches, patina, water damage and misuse are not covered — they’re part of leather’s character.'],
      ['How to claim', 'WhatsApp us your order ID and a photo of the issue. We’ll arrange pickup and repair or replace the item free.'],
    ],
    cta: ['Start a claim', '/contact'],
  },
}
const KEYS = Object.keys(POLICIES)

export default function Policy() {
  const [params, setParams] = useSearchParams()
  const key = KEYS.includes(params.get('p')) ? params.get('p') : 'returns'
  const doc = POLICIES[key]
  const pick = (k) => setParams({ p: k }, { replace: true })

  return (
    <>
      <section className="bg-sand">
        <div className="container-x space-y-2 py-7 sm:space-y-3 sm:py-12">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Policies' }]} />
          <h1 className="h-display text-[34px] sm:text-[44px] lg:text-[56px]">{doc.title}</h1>
          <p className="text-[13px] text-mute sm:text-base">Last updated: 1 October 2026</p>
        </div>
      </section>

      <div className="container-x flex flex-col gap-5 py-6 sm:py-10 lg:flex-row lg:gap-10">
        <aside className="lg:w-[240px] lg:shrink-0">
          <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-32 lg:flex-col lg:gap-0 lg:border-l lg:border-line">
            {KEYS.map((k) => (
              <button key={k} onClick={() => pick(k)} className={cx('shrink-0 rounded-full px-4 py-2 text-[13px] font-medium lg:-ml-px lg:rounded-none lg:border-l-2 lg:px-4 lg:py-2.5 lg:text-left lg:text-sm',
                key === k ? 'bg-ink text-white lg:border-tan lg:bg-transparent lg:font-semibold lg:text-tan' : 'border border-line bg-white lg:border-y-0 lg:border-r-0 lg:border-transparent lg:bg-transparent lg:hover:text-tan')}>
                {POLICIES[k].nav}
              </button>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 flex-1 space-y-6 rounded-lg bg-white p-4 sm:p-8">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {doc.highlights.map(([v, l]) => (
              <div key={l} className="rounded-md bg-sand px-3 py-3 sm:px-4">
                <p className="font-display text-2xl font-semibold text-tan">{v}</p>
                <p className="text-xs text-mute">{l}</p>
              </div>
            ))}
          </div>
          {doc.sections.map(([h, t], i) => (
            <section key={h} className="space-y-2">
              <h2 className="h-display text-2xl sm:text-[28px]">{i + 1}. {h}</h2>
              <p className="text-sm leading-relaxed text-mute sm:text-[15px] sm:leading-relaxed">{t}</p>
            </section>
          ))}
          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:gap-3">
            <Button to={doc.cta[1]} variant="tan" className="w-fit">{doc.cta[0]}</Button>
            <Button to="/contact" variant="outline" className="w-fit">Contact support</Button>
          </div>
        </article>
      </div>
    </>
  )
}
