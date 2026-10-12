import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import { Btn, Card, PageHead, Tabs, cx } from '../../components/admin/ui'
import { FormField, Spin, Switch, TextInput } from '../../components/admin/form'
import { ImageField, Rows, Text } from '../../components/admin/contentFields'
import { useAdminAuth } from '../../context/AuthContext'
import { toast } from '../../lib/alert'
import { adminApi, api } from '../../lib/api'
import { useAdminMutation } from '../../lib/adminQueries'

/*
 * Admin › Pages: the About page, the Contact page and the footer. Each tab edits one public setting
 * (about / contact_page / footer) and saves it as a whole.
 */

const TABS = [['About page', 'about', '/about'], ['Contact page', 'contact', '/contact'], ['Footer', 'footer', '/']]
const SETTING = { about: 'about', contact: 'contact_page', footer: 'footer' }

const Section = ({ title, sub, on, onToggle, disabled, children }) => (
  <Card title={title} sub={sub} right={onToggle && <Switch checked={!!on} onChange={onToggle} label={`Show ${title.toLowerCase()}`} disabled={disabled} />}>
    {(!onToggle || on) ? children : <p className="text-[13px] text-amute">Hidden on the website.</p>}
  </Card>
)

function AboutForm({ v, set, err, ro }) {
  const hero = v.hero ?? {}
  const cta = v.cta ?? {}
  const setHero = (patch) => set({ hero: { ...hero, ...patch } })
  const setCta = (patch) => set({ cta: { ...cta, ...patch } })
  return (
    <>
      <Section title="Top banner">
        <div className="grid gap-3.5 md:grid-cols-2">
          <Text label="Small heading" value={hero.eyebrow} onChange={(eyebrow) => setHero({ eyebrow })} err={err('hero.eyebrow')} maxLength={40} disabled={ro} placeholder="Our story" />
          <Text label="Title *" value={hero.title} onChange={(title) => setHero({ title })} err={err('hero.title')} maxLength={80} disabled={ro} />
        </div>
        <Text label="Text" area value={hero.text} onChange={(text) => setHero({ text })} err={err('hero.text')} maxLength={400} disabled={ro} />
        <FormField label="Background photo" error={err('hero.image')}><ImageField value={hero.image} onChange={(image) => setHero({ image })} disabled={ro} aspect="aspect-[16/7]" size="w-[200px]" /></FormField>
      </Section>
      <Section title="Values strip" sub="Dark strip under the banner · up to 4">
        <Rows items={v.values ?? []} onChange={(values) => set({ values })} max={4} blank={{ title: '', subtitle: '' }} addLabel="Add value" disabled={ro}>
          {(it, up, i) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Text label="Title *" value={it.title} onChange={(title) => up({ title })} err={err(`values.${i}.title`)} maxLength={40} disabled={ro} />
              <Text label="Subtitle" value={it.subtitle} onChange={(subtitle) => up({ subtitle })} err={err(`values.${i}.subtitle`)} maxLength={80} disabled={ro} />
            </div>
          )}
        </Rows>
      </Section>
      <Section title="Story blocks" sub="Photo + text, alternating sides · numbered 01, 02… in this order · up to 6">
        <Rows items={v.story ?? []} onChange={(story) => set({ story })} max={6} blank={{ title: '', text: '', image: '' }} addLabel="Add story block" disabled={ro}>
          {(it, up, i) => (
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="space-y-2.5">
                <Text label={`${String(i + 1).padStart(2, '0')} · Title *`} value={it.title} onChange={(title) => up({ title })} err={err(`story.${i}.title`)} maxLength={80} disabled={ro} />
                <Text label="Text *" area value={it.text} onChange={(text) => up({ text })} err={err(`story.${i}.text`)} maxLength={600} disabled={ro} />
              </div>
              <FormField label="Photo" error={err(`story.${i}.image`)}><ImageField value={it.image} onChange={(image) => up({ image })} disabled={ro} /></FormField>
            </div>
          )}
        </Rows>
      </Section>
      <Section title="Numbers" sub="Boxes like “12,000+ Happy customers” · up to 4 · leave empty to hide">
        <Rows items={v.stats ?? []} onChange={(stats) => set({ stats })} max={4} blank={{ value: '', label: '' }} addLabel="Add number" disabled={ro}>
          {(it, up, i) => (
            <div className="grid gap-2.5 sm:grid-cols-[160px_1fr]">
              <Text label="Number *" value={it.value} onChange={(value) => up({ value })} err={err(`stats.${i}.value`)} maxLength={20} disabled={ro} placeholder="12,000+" />
              <Text label="Label *" value={it.label} onChange={(label) => up({ label })} err={err(`stats.${i}.label`)} maxLength={40} disabled={ro} placeholder="Happy customers" />
            </div>
          )}
        </Rows>
      </Section>
      <Section title="Bottom banner" on={cta.enabled} onToggle={(enabled) => setCta({ enabled })} disabled={ro}>
        <Text label="Title *" value={cta.title} onChange={(title) => setCta({ title })} err={err('cta.title')} maxLength={80} disabled={ro} />
        <div className="grid gap-3.5 md:grid-cols-2">
          <Text label="Button text" value={cta.button_text} onChange={(button_text) => setCta({ button_text })} err={err('cta.button_text')} maxLength={30} disabled={ro} help="Empty = no button" />
          <Text label="Button link" value={cta.link} onChange={(link) => setCta({ link })} err={err('cta.link')} disabled={ro} placeholder="/shop" />
        </div>
        <FormField label="Background photo" error={err('cta.image')}><ImageField value={cta.image} onChange={(image) => setCta({ image })} disabled={ro} aspect="aspect-[16/7]" size="w-[200px]" /></FormField>
      </Section>
    </>
  )
}

function ContactForm({ v, set, err, ro }) {
  const hero = v.hero ?? {}
  const showroom = v.showroom ?? {}
  const promo = v.promo ?? {}
  const setHero = (patch) => set({ hero: { ...hero, ...patch } })
  const setShowroom = (patch) => set({ showroom: { ...showroom, ...patch } })
  const setPromo = (patch) => set({ promo: { ...promo, ...patch } })
  return (
    <>
      <Section title="Top banner">
        <Text label="Title *" value={hero.title} onChange={(title) => setHero({ title })} err={err('hero.title')} maxLength={80} disabled={ro} />
        <Text label="Text" area rows={2} value={hero.subtitle} onChange={(subtitle) => setHero({ subtitle })} err={err('hero.subtitle')} maxLength={250} disabled={ro} />
        <FormField label="Background photo" error={err('hero.image')}><ImageField value={hero.image} onChange={(image) => setHero({ image })} disabled={ro} aspect="aspect-[16/5]" size="w-[200px]" /></FormField>
      </Section>
      <Section title="Contact boxes" sub="Phone, WhatsApp, email and Facebook come from Settings → Store information and Social links">
        <div className="grid gap-3.5 md:grid-cols-3">
          <Text label="Opening hours (under the phone)" value={v.hours} onChange={(hours) => set({ hours })} err={err('hours')} maxLength={60} disabled={ro} placeholder="Sat–Thu · 10am–8pm" help="Also shown in the footer" />
          <Text label="WhatsApp note" value={v.whatsapp_note} onChange={(whatsapp_note) => set({ whatsapp_note })} err={err('whatsapp_note')} maxLength={60} disabled={ro} placeholder="Replies in ~5 min" />
          <Text label="Email note" value={v.email_note} onChange={(email_note) => set({ email_note })} err={err('email_note')} maxLength={60} disabled={ro} placeholder="Reply within 24h" />
        </div>
        <p className="text-[11px] text-amute">Change the numbers and email in <Link to="/admin/settings/general" className="font-semibold text-tan">Settings</Link>.</p>
      </Section>
      <Section title="Showroom" sub="A contact box and a map card" on={showroom.enabled} onToggle={(enabled) => setShowroom({ enabled })} disabled={ro}>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Text label="Area *" value={showroom.area} onChange={(area) => setShowroom({ area })} err={err('showroom.area')} maxLength={80} disabled={ro} placeholder="Dhanmondi, Dhaka" />
          <Text label="Note" value={showroom.note} onChange={(note) => setShowroom({ note })} err={err('showroom.note')} maxLength={60} disabled={ro} placeholder="By appointment" />
        </div>
        <Text label="Google Maps link" value={showroom.map_link} onChange={(map_link) => setShowroom({ map_link })} err={err('showroom.map_link')} maxLength={500} disabled={ro} placeholder="https://maps.app.goo.gl/…" help="Google Maps → Share → Copy link" />
      </Section>
      <Section title="Message subjects" sub="Choices in the “Subject” box of the contact form">
        <Rows items={v.subjects ?? []} onChange={(subjects) => set({ subjects })} max={10} blank="" addLabel="Add subject" disabled={ro}>
          {(it, up, i) => <TextInput value={it ?? ''} onChange={(e) => up(e.target.value)} maxLength={60} disabled={ro} aria-label={`Subject ${i + 1}`} invalid={!!err(`subjects.${i}`)} />}
        </Rows>
        {err('subjects') && <p className="text-xs text-bad">{err('subjects')}</p>}
      </Section>
      <Section title="Promo card" sub="Dark card next to the form, e.g. corporate gifting" on={promo.enabled} onToggle={(enabled) => setPromo({ enabled })} disabled={ro}>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Text label="Small heading" value={promo.eyebrow} onChange={(eyebrow) => setPromo({ eyebrow })} err={err('promo.eyebrow')} maxLength={40} disabled={ro} />
          <Text label="Text *" value={promo.text} onChange={(text) => setPromo({ text })} err={err('promo.text')} maxLength={200} disabled={ro} />
          <Text label="Button text" value={promo.button_text} onChange={(button_text) => setPromo({ button_text })} err={err('promo.button_text')} maxLength={30} disabled={ro} help="Empty = no button" />
          <Text label="Button link" value={promo.link} onChange={(link) => setPromo({ link })} err={err('promo.link')} disabled={ro} placeholder="/contact" />
        </div>
        <FormField label="Background photo" error={err('promo.image')}><ImageField value={promo.image} onChange={(image) => setPromo({ image })} disabled={ro} /></FormField>
      </Section>
    </>
  )
}

function FooterForm({ v, set, err, ro }) {
  const nl = v.newsletter ?? {}
  const setNl = (patch) => set({ newsletter: { ...nl, ...patch } })
  return (
    <>
      <Section title="Newsletter strip" sub="The “Join the circle” row at the top of the footer" on={nl.enabled} onToggle={(enabled) => setNl({ enabled })} disabled={ro}>
        <div className="grid gap-3.5 md:grid-cols-2">
          <Text label="Title *" value={nl.title} onChange={(title) => setNl({ title })} err={err('newsletter.title')} maxLength={60} disabled={ro} />
          <Text label="Text" value={nl.text} onChange={(text) => setNl({ text })} err={err('newsletter.text')} maxLength={120} disabled={ro} />
        </div>
      </Section>
      <Section title="About the store" sub="Under the logo · social links come from Settings → Social links">
        <Text label="Short text" area rows={2} value={v.about} onChange={(about) => set({ about })} err={err('about')} maxLength={250} disabled={ro} />
      </Section>
      <Section title="Link columns" sub="Up to 3 columns · the Contact column is added automatically from Settings">
        <Rows items={v.columns ?? []} onChange={(columns) => set({ columns })} max={3} blank={{ title: '', links: [{ label: '', link: '' }] }} addLabel="Add column" disabled={ro}>
          {(col, up, ci) => (
            <div className="space-y-2.5">
              <Text label="Column title *" value={col.title} onChange={(title) => up({ title })} err={err(`columns.${ci}.title`)} maxLength={30} disabled={ro} />
              <Rows items={col.links ?? []} onChange={(links) => up({ links })} max={10} blank={{ label: '', link: '' }} addLabel="Add link" disabled={ro}>
                {(l, upLink, li) => (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextInput value={l.label ?? ''} onChange={(e) => upLink({ label: e.target.value })} maxLength={40} placeholder="Label, e.g. Wallets" disabled={ro} aria-label="Link label" invalid={!!err(`columns.${ci}.links.${li}.label`)} />
                    <TextInput value={l.link ?? ''} onChange={(e) => upLink({ link: e.target.value })} placeholder="/shop?c=wallets" disabled={ro} aria-label="Link address" invalid={!!err(`columns.${ci}.links.${li}.link`)} />
                  </div>
                )}
              </Rows>
              {err(`columns.${ci}.links`) && <p className="text-xs text-bad">{err(`columns.${ci}.links`)}</p>}
            </div>
          )}
        </Rows>
      </Section>
      <Section title="Bottom line">
        <Text label="Copyright" value={v.copyright} onChange={(copyright) => set({ copyright })} err={err('copyright')} maxLength={120} disabled={ro} help="{year} becomes the current year · payment badges follow the payment methods switched on in Settings" />
      </Section>
    </>
  )
}

const FORMS = { about: AboutForm, contact: ContactForm, footer: FooterForm }

function Editor({ page, current }) {
  const { can } = useAdminAuth()
  const ro = !can('content', 'edit')
  const [draft, setDraft] = useState(null)
  const v = draft ?? current ?? {}
  const set = (patch) => setDraft({ ...v, ...patch })
  const save = useAdminMutation((body) => adminApi.put(`/admin/content/pages/${page}`, body), {
    success: 'Saved — live on the website',
    onSuccess: () => setDraft(null),
  })
  const fields = save.error?.fields ?? {}
  const err = (k) => fields[k]
  const submit = () => {
    save.mutate(v, { onError: (e) => { if (e?.status === 422 && Object.keys(e.fields ?? {}).length) toast.error('Please fix the highlighted fields.') } })
  }
  const Form = FORMS[page]
  return (
    <div className="space-y-4">
      <Form v={v} set={set} err={err} ro={ro} />
      {!ro && (
        <div className={cx('sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 rounded-xl border border-aline bg-white/95 p-3 backdrop-blur', !draft && 'opacity-80')}>
          {draft && <span className="mr-auto text-xs text-amute">Unsaved changes</span>}
          {draft && <Btn v="white" sm onClick={() => { setDraft(null); save.reset() }}>Discard</Btn>}
          <Btn sm disabled={!draft || save.isPending} onClick={submit}>{save.isPending && <Spin />}Save</Btn>
        </div>
      )}
    </div>
  )
}

export default function AdminPages() {
  const [tab, setTab] = useState('about')
  const { data, isPending } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings').then((r) => r.data) })
  const [, , view] = TABS.find(([, k]) => k === tab)
  return (
    <>
      <PageHead
        title="Pages"
        sub="About page, Contact page and footer · changes go live when you save"
        actions={<Btn v="white" icon={Eye} onClick={() => window.open(view, '_blank')}>View on site</Btn>}
      />
      <Tabs items={TABS.map(([l, k]) => [l, null, k])} active={tab} onChange={setTab} />
      {isPending ? <Card><div className="h-40 animate-pulse rounded-md bg-asoft" /></Card> : <Editor key={tab} page={tab} current={data?.[SETTING[tab]]} />}
    </>
  )
}
