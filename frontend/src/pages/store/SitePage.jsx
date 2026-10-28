import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Minus, PackageX, Phone, Plus, Search } from 'lucide-react'
import { Button, EmptyState, cx } from '../../components/store/ui'
import { ErrorState, PageLoader } from '../../components/common/feedback'
import { api } from '../../lib/api'
import { waLink } from '../../lib/bd'
import { useSettings } from '../../lib/queries'

/* A store page from Admin › Pages, at /pages/:slug (also /faq) — rich text or an FAQ */

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

// "Still need help?" — WhatsApp / call buttons from Admin › Settings
function HelpBox() {
  const store = useSettings().data?.store ?? {}
  const wa = waLink(store.whatsapp)
  const phone = (store.phone || '').replace(/[^\d+]/g, '')
  if (!wa && !phone) return null
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-espresso p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <h3 className="h-display text-[26px] sm:text-[30px]">Still need help?</h3>
        <p className="text-[13px] text-white/70">Message or call us — we’re happy to help.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {wa && <Button as="a" href={wa} target="_blank" rel="noreferrer" variant="tan"><MessageCircle className="size-4" />WhatsApp us</Button>}
        {phone && <Button as="a" href={`tel:${phone}`} variant="soft"><Phone className="size-4" />Call us</Button>}
      </div>
    </div>
  )
}

function Faq({ faqs }) {
  const groups = useMemo(() => [...new Set(faqs.map((f) => f.group || 'General'))], [faqs])
  const [group, setGroup] = useState(groups[0])
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const list = term
    ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(term))
    : faqs.filter((f) => (f.group || 'General') === group)
  return (
    <div className="space-y-5">
      <label className="flex max-w-xl items-center gap-3 rounded-full border border-line bg-white px-4 py-3 sm:px-5">
        <Search className="size-4 shrink-0 text-mute" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: delivery time, return, engraving…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute" aria-label="Search questions" />
      </label>
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-10">
        {!term && groups.length > 1 && (
          <aside className="lg:w-[240px] lg:shrink-0">
            <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col lg:gap-1 lg:rounded-lg lg:bg-white lg:p-3">
              {groups.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)} className={cx('flex shrink-0 items-center justify-between gap-4 rounded-full px-4 py-2 text-[13px] font-medium lg:rounded-md lg:px-3.5 lg:py-3 lg:text-sm',
                  group === g ? 'bg-ink text-white lg:bg-sand lg:font-semibold lg:text-ink' : 'border border-line bg-white lg:border-0 lg:hover:bg-cream')}>
                  {g}<span className="hidden text-xs text-mute lg:inline">{faqs.filter((f) => (f.group || 'General') === g).length}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}
        <section className="min-w-0 flex-1 space-y-8">
          <div>
            <h2 className="h-display mb-2 text-[28px] sm:text-4xl">{term ? `Results for “${q.trim()}”` : groups.length > 1 ? group : ''}</h2>
            {list.length ? (
              <div className="divide-y divide-line border-b border-line">
                {list.map((f, i) => <FaqItem key={`${f.question}-${i}`} f={f} defaultOpen={i < 2 && !term} />)}
              </div>
            ) : <p className="py-6 text-sm text-mute">No questions match — try other words or ask us below.</p>}
          </div>
          <HelpBox />
        </section>
      </div>
    </div>
  )
}

function FaqItem({ f, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="py-4 sm:py-5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start justify-between gap-4 text-left text-sm font-semibold sm:text-base">
        {f.question}{open ? <Minus className="mt-0.5 size-4 shrink-0 text-tan" /> : <Plus className="mt-0.5 size-4 shrink-0 text-tan" />}
      </button>
      {open && <p className="whitespace-pre-line pt-3 text-sm leading-relaxed text-mute">{f.answer}</p>}
    </div>
  )
}

export default function SitePage({ slug: fixedSlug }) {
  const params = useParams()
  const slug = fixedSlug ?? params.slug
  const { data: page, isPending, error, refetch } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => api.get(`/pages/${slug}`).then((r) => r.data),
    retry: (n, e) => e?.status !== 404 && n < 2,
  })

  useEffect(() => {
    if (!page) return
    document.title = page.meta_title || `${page.title} | XERQO`
    const meta = document.querySelector('meta[name=description]')
    const before = meta?.getAttribute('content')
    if (page.meta_description) meta?.setAttribute('content', page.meta_description)
    return () => { document.title = 'XERQO'; if (before != null) meta?.setAttribute('content', before) }
  }, [page])

  if (isPending) return <PageLoader className="min-h-[60vh]" />
  if (error?.status === 404) return <div className="container-x py-16"><EmptyState icon={PackageX} title="Page not found" text="This page may have been moved or removed." action={<Button to="/" variant="outlineTan" size="sm">Go to the homepage</Button>} /></div>
  if (error) return <div className="container-x py-16"><ErrorState error={error} onRetry={refetch} /></div>

  return (
    <>
      <section className="bg-sand">
        <div className="container-x space-y-2 py-6 sm:space-y-3 sm:py-10">
          <h1 className="h-display text-[32px] sm:text-[44px] lg:text-[52px]">{page.title}</h1>
          {page.type === 'page' && <p className="text-[13px] text-mute">Last updated: {fmtDate(page.updated_at)}</p>}
        </div>
      </section>
      <div className="container-x py-6 sm:py-10">
        {page.type === 'faq' ? <Faq faqs={page.faqs ?? []} /> : (
          <div className="mx-auto max-w-3xl space-y-8">
            {/* content was cleaned on the server (only basic formatting tags and safe links are kept) */}
            <article className="page-content rounded-lg bg-white p-5 text-[15px] sm:p-9" dangerouslySetInnerHTML={{ __html: page.content || '<p>This page is empty.</p>' }} />
            <HelpBox />
          </div>
        )}
      </div>
    </>
  )
}
