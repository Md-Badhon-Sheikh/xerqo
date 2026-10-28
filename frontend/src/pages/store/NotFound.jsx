import { useHome } from '../../lib/queries'
import { Button, ProductCard, SectionHead } from '../../components/store/ui'

/*
 * 404 — shown for addresses that don't exist, missing products / pages, and order tracking that finds nothing.
 * <NotFound /> is the full page; <NotFoundBlock title text actions /> is the same message inside another page.
 */
export function NotFoundBlock({
  title = 'This page wandered off like a lost wallet.',
  text = 'The page you’re looking for doesn’t exist or was moved. Try searching or head back home.',
  actions,
  compact = false,
}) {
  return (
    <section className={compact ? 'rounded-lg bg-white px-5 py-10 text-center sm:py-14' : 'container-x grid items-center gap-7 py-8 sm:gap-10 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-20'}>
      {!compact && <img src="/images/wallet-float.jpg" alt="" className="aspect-[16/10] w-full rounded-lg object-cover lg:aspect-[547/492]" />}
      <div className={compact ? 'mx-auto max-w-lg space-y-3 sm:space-y-4' : 'space-y-4 sm:space-y-5'}>
        <p className={compact ? 'font-display text-[64px] font-semibold leading-none text-tan sm:text-[80px]' : 'font-display text-[88px] font-semibold leading-none text-tan sm:text-[120px]'}>404</p>
        <h1 className={compact ? 'h-display text-[26px] sm:text-[32px]' : 'h-display text-[30px] sm:text-[40px] lg:text-[44px]'}>{title}</h1>
        <p className="text-sm leading-relaxed text-mute sm:text-base">{text}</p>
        <div className={compact ? 'flex flex-col justify-center gap-3 pt-1 sm:flex-row' : 'flex flex-col gap-3 pt-1 sm:flex-row'}>
          {actions ?? <>
            <Button to="/" size="lg">Back to home</Button>
            <Button to="/shop" variant="outline" size="lg">Shop all products</Button>
          </>}
        </div>
      </div>
    </section>
  )
}

// a few best sellers so the visitor has somewhere to go
function Favourites() {
  const products = useHome().data?.top_selling ?? []
  if (!products.length) return null
  return (
    <section className="container-x space-y-6 pb-12 sm:space-y-8 sm:pb-16">
      <SectionHead center eyebrow="While you’re here" title="Customer favourites" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  )
}

export default function NotFound({ title, text, actions }) {
  return (
    <>
      <NotFoundBlock title={title} text={text} actions={actions} />
      <Favourites />
    </>
  )
}
