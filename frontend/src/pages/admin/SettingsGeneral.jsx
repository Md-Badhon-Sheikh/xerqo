import { useState } from 'react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Card, PageHead, Field, Select, Textarea, Toggle } from '../../components/admin/ui'

const META_TITLE = 'XERQO — Premium Leather Wallets, Bags & Accessories in Bangladesh'
const META_DESC = 'Handcrafted genuine leather wallets, long wallets, passport covers, key holders, purses and bags. Cash on delivery all over Bangladesh.'

function Switch({ label, sub, on: init }) {
  const [on, setOn] = useState(init)
  return (
    <button type="button" onClick={() => setOn(!on)} className="flex w-full items-center gap-3 text-left">
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold">{label}</span><span className="block text-[11px] text-amute">{sub}</span></span>
      <Toggle on={on} />
    </button>
  )
}

function LogoTile({ size, title, meta }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-aline p-3.5">
      <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-lg bg-white p-1.5"><img src="/images/logo-dark.png" alt="XERQO logo" className="max-h-full" /></span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="text-[11px] text-amute">{meta}</p>
        <p className="mt-1 text-[11px] font-semibold text-tan"><button>Replace</button> · <button>Remove</button></p>
      </div>
    </div>
  )
}

export default function AdminSettingsGeneral() {
  const [title, setTitle] = useState(META_TITLE)
  const [desc, setDesc] = useState(META_DESC)
  return (
    <>
      <PageHead title="Settings" sub="Store profile, branding, locale, SEO & social links" actions={<Btn>Save changes</Btn>} />
      <SettingsShell>
        <Card title="Store information">
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Store name" defaultValue="XERQO" />
            <Field label="Tagline" defaultValue="Premium leather goods, handcrafted" />
            <Field label="Support email" type="email" defaultValue="support@xerqo.com" />
            <Field label="Phone / WhatsApp" defaultValue="+880 1XXX-XXXXXX" />
            <Field label="Business address" className="md:col-span-2" defaultValue="Hazaribagh, Dhaka 1209, Bangladesh" />
            <Field label="Trade license no." defaultValue="TRAD/DNCC/XXXXXX" />
            <Field label="BIN / VAT (optional)" placeholder="—" />
          </div>
        </Card>

        <Card title="Logo & branding">
          <div className="grid gap-3.5 md:grid-cols-2 md:items-start">
            <LogoTile size={64} title="Logo (from Facebook page)" meta="PNG/SVG · 512×512" />
            <LogoTile size={40} title="Favicon" meta="32×32 / 180×180" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold">Brand colours</span>
            {['bg-tan', 'bg-espresso', 'bg-cream', 'bg-gold'].map((c) => <span key={c} className={`size-6 rounded-md border border-aline ${c}`} />)}
          </div>
        </Card>

        <Card title="Currency, language & region">
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Currency"><Select options={['BDT (৳) — Bangladeshi Taka', 'USD ($) — US Dollar']} /></Field>
            <Field label="Storefront language"><Select options={['English + বাংলা', 'English', 'বাংলা']} /></Field>
            <Field label="Timezone"><Select options={['Asia/Dhaka (GMT+6)']} /></Field>
            <Field label="Order ID prefix" defaultValue="XQ-" />
          </div>
        </Card>

        <Card title="SEO" sub="How XERQO appears on Google & when shared">
          <Field label="Meta title" help={`${title.length} / 60 characters`} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Field label="Meta description"><Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
          <div className="rounded-xl bg-asoft p-3.5">
            <p className="text-[11px] text-ok">xerqo.com</p>
            <p className="mt-0.5 line-clamp-2 text-[15px] text-info">{title.replace(' in Bangladesh', '')}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-amute">{desc}</p>
          </div>
        </Card>

        <Card title="Social & chat">
          <Field label="Facebook" defaultValue="facebook.com/xerqo.bd" />
          <Field label="Instagram" defaultValue="instagram.com/xerqo.bd" />
          <Field label="WhatsApp (chat bubble)" defaultValue="+880 1XXX-XXXXXX" />
          <Field label="Messenger" defaultValue="m.me/xerqo.bd" />
          <Switch label="Show floating chat button on storefront" sub="Bottom-right bubble on every page" on />
        </Card>

        <Card title="Store status">
          <Switch label="Maintenance mode" sub="Show “We’ll be back soon” page to visitors · admins can still browse" on={false} />
          <Switch label="Guest checkout" sub="Allow ordering without an account" on />
        </Card>
      </SettingsShell>
    </>
  )
}
