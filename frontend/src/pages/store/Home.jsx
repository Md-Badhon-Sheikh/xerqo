import { Link } from 'react-router-dom'
import { heroBanners, categories, flashSale, topSelling, homeSections, reviews } from '../../data/store'
import { Button, ProductCard, CatProductCard, TopProductCard, SectionHead, Stars } from '../../components/store/ui'
import { Carousel, BP } from '../../components/store/Carousel'

function HeroBanner({ b, first }) {
  return (
    <Link to={b.to} className="relative block aspect-[1983/793] h-full overflow-hidden bg-espresso lg:aspect-auto lg:min-h-[340px]">
      <img src={b.image} alt={b.alt || b.title} loading={first ? 'eager' : 'lazy'} draggable={false} className="absolute inset-0 size-full object-cover" />
      {b.title && (
        <>
          <span className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/55 to-transparent" />
          <span className="relative flex h-full max-w-[72%] flex-col justify-center gap-1 p-4 pb-6 text-white sm:max-w-[60%] sm:gap-3 sm:p-10 lg:p-14">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-xs">{b.eyebrow}</span>
            <span className="h-display text-[19px] sm:text-4xl lg:text-5xl">{b.title}</span>
            <span className="hidden text-sm text-white/75 sm:block">{b.text}</span>
            <span className="mt-1 w-fit rounded bg-tan px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] sm:mt-2 sm:px-6 sm:py-3 sm:text-xs">{b.cta}</span>
          </span>
        </>
      )}
    </Link>
  )
}

function Hero() {
  return (
    <section className="container-x grid gap-3 pt-3 sm:gap-4 sm:pt-6 lg:grid-cols-[2fr_1fr] lg:pt-8">
      <div className="overflow-hidden rounded-lg bg-espresso">
        <Carousel label="Featured offers" delay={5000} arrows="inside" dots="overlay">
          {heroBanners.map((b, i) => <HeroBanner key={b.image} b={b} first={i === 0} />)}
        </Carousel>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
        <Link to="/product/custom-name-passport-cover" className="group relative min-h-[150px] overflow-hidden rounded-lg bg-espresso sm:min-h-[190px]">
          <img src="/images/fb-passport-hand.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-60 transition duration-500 group-hover:scale-105" />
          <div className="relative flex h-full flex-col justify-end gap-1 p-3.5 text-white sm:p-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-[11px]">Personalised</p>
            <p className="h-display text-lg sm:text-[28px]">Your name on your passport cover</p>
            <span className="text-[11px] font-semibold underline underline-offset-4 sm:text-xs">Customise it →</span>
          </div>
        </Link>
        <div className="relative flex min-h-[150px] flex-col justify-center gap-1.5 overflow-hidden rounded-lg bg-[#FCE4EE] p-3.5 sm:min-h-[190px] sm:p-6">
          <span className="w-fit rounded bg-bkash px-1.5 py-0.5 text-[9px] font-bold text-white sm:text-[10px]">bKash</span>
          <p className="h-display max-w-[60%] text-lg leading-tight sm:text-2xl">Cashback on bKash payment</p>
          <p className="max-w-[62%] text-[10px] text-mute sm:text-xs">On orders over ৳1,500 · T&amp;C apply</p>
          <span className="absolute -right-3 bottom-2 grid size-20 place-items-center rounded-full border-[6px] border-bkash/20 font-display text-2xl font-bold text-bkash sm:right-5 sm:size-28 sm:text-[38px]">10%</span>
        </div>
      </div>
    </section>
  )
}

function FeaturedCategories() {
  return (
    <section className="container-x py-7 sm:py-12 lg:py-14">
      <SectionHead center title="Featured Categories" sub="The right piece for every pocket, passport and occasion" className="mb-5 sm:mb-8" />
      <Carousel label="Featured categories" breakpoints={BP.categories} delay={3000} arrowTop="top-[calc(50%-18px)]" dotsClassName="sm:hidden">
        {categories.map((c) => (
          <Link key={c.slug} to={`/shop?c=${c.slug}`} className="group space-y-2 text-center sm:space-y-3">
            <span className="block aspect-square overflow-hidden rounded-[14px] bg-tile sm:rounded-[20px]">
              <img src={c.image} alt={c.name} loading="lazy" draggable={false} className="size-full object-cover transition duration-500 group-hover:scale-110" />
            </span>
            <span className="block text-xs font-medium sm:text-[15px]">{c.name}</span>
          </Link>
        ))}
      </Carousel>
    </section>
  )
}

function Countdown() {
  return (
    <div className="flex items-center gap-2 text-xs text-mute">
      <span className="hidden sm:inline">Ends in</span>
      {['02', '14', '36', '08'].map((v, i) => <span key={i} className="grid size-8 place-items-center rounded bg-ink text-[13px] font-bold text-white sm:size-9">{v}</span>)}
    </div>
  )
}

function FlashSale() {
  return (
    <section className="container-x pb-10 sm:pb-16">
      <SectionHead eyebrow="Limited time" title="Flash Sale" action={<Countdown />} className="mb-5 sm:mb-8" />
      <Carousel label="Flash sale" breakpoints={BP.products} delay={3800} arrowTop="top-[calc(50%-16px)]">
        {flashSale.map((p) => <ProductCard key={p.id} p={p} />)}
      </Carousel>
    </section>
  )
}

function TrustStrip() {
  const items = [['01', '100% Genuine Leather', 'Full-grain & top-grain'], ['02', 'Hand-stitched', 'Built to last'], ['03', 'Cash on Delivery', 'Plus bKash & Nagad'], ['04', '7-Day Easy Return', 'Free exchange']]
  return (
    <section className="bg-sand">
      <div className="container-x grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:py-8 lg:grid-cols-4">
        {items.map(([n, t, s]) => (
          <div key={n} className="flex items-center gap-3">
            <span className="font-display text-2xl italic text-tan sm:text-3xl">{n}</span>
            <div><p className="text-[13px] font-semibold sm:text-sm">{t}</p><p className="text-[11px] text-mute sm:text-xs">{s}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TopSelling() {
  return (
    <section className="bg-white py-9 sm:py-16 lg:py-[72px]">
      <div className="container-x space-y-5 sm:space-y-9">
        <SectionHead center eyebrow="Best sellers this month" title="Top Selling Products" />
        <div className="grid gap-3 sm:gap-6 xl:grid-cols-2">
          {topSelling.map((p, i) => <TopProductCard key={p.id} p={p} rank={i + 1} />)}
        </div>
        <div className="text-center"><Button to="/shop" variant="outline" size="md">View all best sellers</Button></div>
      </div>
    </section>
  )
}

function CategorySection({ title, sub, items, delay }) {
  return (
    <section className="container-x space-y-3.5 pt-7 sm:space-y-6 sm:pt-[52px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="h-display text-2xl sm:text-[30px] lg:text-[34px]">{title}</h2>
          <p className="mt-0.5 text-xs text-mute sm:text-[13px]"><span className="sm:hidden">{sub.split(' · ')[0]}</span><span className="max-sm:hidden">{sub}</span></p>
        </div>
        <Button to="/shop" size="sm" className="sm:!px-[18px] sm:!py-2.5 sm:!text-[11px]">View all</Button>
      </div>
      <Carousel label={title} breakpoints={BP.products} delay={delay} arrowTop="top-[calc(50%-16px)]">
        {items.map((p) => <CatProductCard key={p.id} p={p} className="h-full" />)}
      </Carousel>
    </section>
  )
}

function CraftStory() {
  return (
    <section className="mt-10 bg-espresso text-white sm:mt-[72px]">
      <div className="container-x grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="relative pb-14 pr-14 sm:pb-20 sm:pr-24">
          <img src="/images/tools-hand.jpg" alt="Hand stitching leather" className="aspect-[4/3] w-full rounded object-cover" />
          <img src="/images/spools.jpg" alt="" className="absolute bottom-0 right-0 w-[45%] rounded border-[6px] border-espresso object-cover sm:border-8" />
        </div>
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">The XERQO way</p>
          <h2 className="h-display text-[34px] sm:text-5xl">Cut, stitched and burnished by <em className="text-gold">hand</em> — in Dhaka.</h2>
          <p className="max-w-lg text-sm leading-relaxed text-white/70 sm:text-[15px]">Every piece starts as a hide selected for grain and thickness. Our artisans cut each panel by hand, saddle-stitch it with waxed thread and burnish the edges — so it only gets better with age.</p>
          <div className="flex gap-8 sm:gap-12">
            {[['Full-grain', 'Leather only'], ['1,200+', 'Stitches / wallet'], ['1 Year', 'Warranty']].map(([a, b]) => <div key={a}><p className="font-display text-2xl text-gold sm:text-3xl">{a}</p><p className="text-[11px] text-white/60 sm:text-xs">{b}</p></div>)}
          </div>
          <Button to="/about" variant="outline" className="!border-white !text-white hover:!bg-white hover:!text-ink">Read our story</Button>
        </div>
      </div>
    </section>
  )
}

function Personalise() {
  return (
    <section className="container-x py-10 sm:py-16">
      <div className="flex flex-col gap-6 rounded-lg bg-sand p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="eyebrow">Perfect for gifting</p>
          <h2 className="h-display text-[28px] sm:text-4xl">Make it yours — free name engraving</h2>
          <p className="text-sm text-mute">Add initials to any wallet, passport cover or key holder. Ready in 48 hours, gift box included.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 items-center rounded border border-tan/50 px-5 font-display text-xl italic tracking-[0.4em] text-tan">M · H · D</span>
          <Button variant="tan">Personalise</Button>
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  return (
    <section className="container-x pb-14 sm:pb-20">
      <SectionHead eyebrow="4.9 / 5 · 2,300+ reviews" title="What our customers say" className="mb-6 sm:mb-8" />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:px-0">
        {reviews.map((r) => (
          <figure key={r.name} className="w-[85%] shrink-0 snap-start space-y-4 rounded-lg bg-white p-6 sm:w-auto">
            <Stars n={r.rating} />
            <blockquote className="font-display text-lg italic leading-snug sm:text-xl">“{r.text}”</blockquote>
            <figcaption className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-sand text-xs font-bold">{r.name.split(' ').map((x) => x[0]).join('')}</span><span><b className="block text-sm">{r.name}</b><span className="text-xs text-mute">{r.city} · Verified buyer</span></span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <FlashSale />
      <TrustStrip />
      <TopSelling />
      {homeSections.map((s, i) => <CategorySection key={s.title} {...s} delay={3500 + (i % 3) * 500} />)}
      <CraftStory />
      <Personalise />
      <Reviews />
    </>
  )
}
