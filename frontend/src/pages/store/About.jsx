import { Button, cx } from '../../components/store/ui'

const VALUES = [
  ['Premium Leather', 'Genuine cow & crocodile-embossed hides'],
  ['Expertly Crafted', 'Hand-cut, saddle-stitched, burnished'],
  ['Built for Durability', '1-year stitching warranty'],
  ['Timeless Design', 'Minimal shapes that never date'],
]

const STORY = [
  ['01', 'From hide to heirloom', 'Every XERQO piece begins with a hide chosen for grain and thickness. We cut each panel by hand, saddle-stitch with waxed thread, and burnish the edges until they shine.', '/images/workshop.jpg'],
  ['02', 'Leather that tells your story', 'Full-grain leather darkens and softens with use. Scratches become character. That’s why we say our products get better with age — just like you.', '/images/leather-close.jpg'],
  ['03', 'Personal by design', 'Free name engraving on wallets, passport covers and key holders — because a gift should feel like it was made for one person.', '/images/fb-passport-hand.jpg'],
]

const STATS = [['12,000+', 'Happy customers'], ['64', 'Districts delivered'], ['4.9 ★', 'Average rating'], ['2025', 'Founded in Dhaka']]

function Hero() {
  return (
    <section className="relative overflow-hidden bg-espresso text-white">
      <img src="/images/tools-hand.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/50 to-transparent" />
      <div className="container-x relative space-y-4 py-14 sm:py-24 lg:py-32">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-xs">Our story</p>
        <h1 className="h-display max-w-2xl text-[40px] sm:text-[56px] lg:text-[68px]">Crafted for class. Made to last.</h1>
        <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">XERQO started in Dhaka with one idea — everyday leather goods that feel premium, age beautifully and are priced honestly for Bangladesh.</p>
      </div>
    </section>
  )
}

function ValueStrip() {
  return (
    <section className="bg-espresso text-white">
      <div className="container-x grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:py-8 lg:grid-cols-4">
        {VALUES.map(([t, s]) => (
          <div key={t} className="min-w-0">
            <p className="font-display text-lg text-gold sm:text-2xl">{t}</p>
            <p className="text-[11px] text-white/60 sm:text-xs">{s}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Story() {
  return (
    <section className="container-x space-y-12 py-12 sm:space-y-20 sm:py-20">
      {STORY.map(([n, t, text, src], i) => (
        <div key={n} className="grid items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          <img src={src} alt="" loading="lazy" className={cx('aspect-[3/2] w-full rounded-lg object-cover', i % 2 && 'lg:order-2')} />
          <div className="space-y-3 sm:space-y-4">
            <p className="font-display text-2xl italic text-tan sm:text-3xl">{n}</p>
            <h2 className="h-display text-[30px] sm:text-4xl lg:text-[44px]">{t}</h2>
            <p className="max-w-lg text-sm leading-relaxed text-mute sm:text-[15px]">{text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function Stats() {
  return (
    <section className="container-x grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {STATS.map(([v, l]) => (
        <div key={l} className="rounded-lg bg-sand px-4 py-6 text-center sm:py-8">
          <p className="font-display text-3xl font-semibold text-tan sm:text-[40px]">{v}</p>
          <p className="mt-1 text-xs text-mute sm:text-[13px]">{l}</p>
        </div>
      ))}
    </section>
  )
}

function Cta() {
  return (
    <section className="container-x py-12 sm:py-20">
      <div className="relative overflow-hidden rounded-xl bg-espresso text-white">
        <img src="/images/cover.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-espresso/55" />
        <div className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-20">
          <h2 className="h-display text-[32px] sm:text-5xl">Carry something that lasts.</h2>
          <Button to="/shop" variant="tan" size="lg">Shop the collection</Button>
        </div>
      </div>
    </section>
  )
}

export default function About() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <Story />
      <Stats />
      <Cta />
    </>
  )
}
