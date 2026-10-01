import { Heart, Package, Search, ShoppingBag } from 'lucide-react'
import { topSelling } from '../../data/store'
import { Button, ProductCard, SectionHead } from '../../components/store/ui'

// Reusable empty states shown on the design's 404 board (Figma 21)
const EMPTY_STATES = [
  { icon: ShoppingBag, title: 'Your cart is empty', text: "Looks like you haven't added anything yet.", cta: 'Start shopping', to: '/shop' },
  { icon: Search, title: 'No results for “crocodile belt”', text: 'Check the spelling or try a broader term.', cta: 'Browse all belts', to: '/shop?c=belts' },
  { icon: Heart, title: 'Your wishlist is empty', text: 'Tap ♡ on any product to save it for later.', cta: 'Explore bestsellers', to: '/shop' },
  { icon: Package, title: 'No orders yet', text: 'Your first XERQO piece is waiting.', cta: 'Shop now', to: '/shop' },
]

export default function NotFound() {
  return (
    <>
      <section className="container-x grid items-center gap-7 py-8 sm:gap-10 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-20">
        <img src="/images/wallet-float.jpg" alt="A leather wallet floating in mid-air" className="aspect-[16/10] w-full rounded-lg object-cover lg:aspect-[547/492]" />
        <div className="space-y-4 sm:space-y-5">
          <p className="font-display text-[88px] font-semibold leading-none text-tan sm:text-[120px]">404</p>
          <h1 className="h-display text-[30px] sm:text-[40px] lg:text-[44px]">This page wandered off like a lost wallet.</h1>
          <p className="max-w-lg text-sm leading-relaxed text-mute sm:text-base">The page you're looking for doesn't exist or was moved. Try searching or head back home.</p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button to="/" size="lg">Back to home</Button>
            <Button to="/shop?c=wallets" variant="outline" size="lg">Shop wallets</Button>
          </div>
        </div>
      </section>

      <section className="container-x space-y-6 pb-12 sm:space-y-8 sm:pb-16">
        <SectionHead eyebrow="While you're here" title="Customer favourites" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-4">
          {topSelling.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="bg-sand">
        <div className="container-x space-y-6 py-12 sm:py-16">
          <p className="eyebrow">Empty states</p>
          <div className="grid items-start gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {EMPTY_STATES.map(({ icon: Icon, title, text, cta, to }) => (
              <div key={title} className="flex flex-col items-center gap-3 rounded-lg bg-white px-6 py-8 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-tan/10"><Icon className="size-7 text-tan" strokeWidth={1.5} /></span>
                <h3 className="h-display text-[24px]">{title}</h3>
                <p className="text-[13px] text-mute">{text}</p>
                <Button to={to} variant="outlineTan" size="sm" className="mt-1 !px-4">{cta}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
