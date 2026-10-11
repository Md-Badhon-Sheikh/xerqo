import { Button, cx } from '../../components/store/ui'
import { PageLoader } from '../../components/common/feedback'
import { useSettings } from '../../lib/queries'

// Everything on this page is edited in Admin › Pages › About

// internal paths use the router; https://… links open as normal links
const linkProps = (link) => (/^https?:\/\//i.test(link || '') ? { as: 'a', href: link, target: '_blank', rel: 'noreferrer' } : { to: link || '/shop' })

function Hero({ hero }) {
  return (
    <section className="relative overflow-hidden bg-espresso text-white">
      {hero.image && <img src={hero.image} alt="" className="absolute inset-0 size-full object-cover opacity-45" />}
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/50 to-transparent" />
      <div className="container-x relative space-y-4 py-14 sm:py-24 lg:py-32">
        {hero.eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold sm:text-xs">{hero.eyebrow}</p>}
        <h1 className="h-display max-w-2xl text-[40px] sm:text-[56px] lg:text-[68px]">{hero.title}</h1>
        {hero.text && <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">{hero.text}</p>}
      </div>
    </section>
  )
}

function ValueStrip({ values }) {
  if (!values?.length) return null
  return (
    <section className="bg-espresso text-white">
      <div className={cx('container-x grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:py-8', values.length > 2 && 'lg:grid-cols-4')}>
        {values.map((v, i) => (
          <div key={i} className="min-w-0">
            <p className="font-display text-lg text-gold sm:text-2xl">{v.title}</p>
            {v.subtitle && <p className="text-[11px] text-white/60 sm:text-xs">{v.subtitle}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

function Story({ story }) {
  if (!story?.length) return null
  return (
    <section className="container-x space-y-12 py-12 sm:space-y-20 sm:py-20">
      {story.map((s, i) => (
        <div key={i} className="grid items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-16">
          {s.image && <img src={s.image} alt="" loading="lazy" className={cx('aspect-[3/2] w-full rounded-lg object-cover', i % 2 && 'lg:order-2')} />}
          <div className={cx('space-y-3 sm:space-y-4', !s.image && 'lg:col-span-2')}>
            <p className="font-display text-2xl italic text-tan sm:text-3xl">{String(i + 1).padStart(2, '0')}</p>
            <h2 className="h-display text-[30px] sm:text-4xl lg:text-[44px]">{s.title}</h2>
            <p className="max-w-lg whitespace-pre-line text-sm leading-relaxed text-mute sm:text-[15px]">{s.text}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function Stats({ stats }) {
  if (!stats?.length) return null
  return (
    <section className={cx('container-x grid grid-cols-2 gap-3 sm:gap-5', stats.length > 2 && 'lg:grid-cols-4')}>
      {stats.map((s, i) => (
        <div key={i} className="rounded-lg bg-sand px-4 py-6 text-center sm:py-8">
          <p className="font-display text-3xl font-semibold text-tan sm:text-[40px]">{s.value}</p>
          <p className="mt-1 text-xs text-mute sm:text-[13px]">{s.label}</p>
        </div>
      ))}
    </section>
  )
}

function Cta({ cta }) {
  if (!cta?.enabled) return <div className="pb-12 sm:pb-20" />
  return (
    <section className="container-x py-12 sm:py-20">
      <div className="relative overflow-hidden rounded-xl bg-espresso text-white">
        {cta.image && <img src={cta.image} alt="" className="absolute inset-0 size-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-espresso/55" />
        <div className="relative flex flex-col items-center gap-5 px-6 py-14 text-center sm:py-20">
          <h2 className="h-display text-[32px] sm:text-5xl">{cta.title}</h2>
          {cta.button_text && <Button {...linkProps(cta.link)} variant="tan" size="lg">{cta.button_text}</Button>}
        </div>
      </div>
    </section>
  )
}

export default function About() {
  const about = useSettings().data?.about
  if (!about) return <PageLoader className="min-h-[60vh]" />
  return (
    <>
      <Hero hero={about.hero ?? {}} />
      <ValueStrip values={about.values} />
      <Story story={about.story} />
      <Stats stats={about.stats} />
      <Cta cta={about.cta} />
    </>
  )
}
