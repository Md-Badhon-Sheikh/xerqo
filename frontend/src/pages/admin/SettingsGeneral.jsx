import { useState } from 'react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Card, PageHead, Textarea } from '../../components/admin/ui'
import { FormField, LoadingBlock, MoneyInput, Spin, SwitchRow, TextInput } from '../../components/admin/form'
import { useAdminAuth } from '../../context/AuthContext'
import { confirm } from '../../lib/alert'
import { useSettingSave, useSettingsData } from './Settings'

const SaveBar = ({ save, onSave, children = 'Save' }) => (
  <div className="flex justify-end border-t border-aline pt-4">
    <Btn disabled={save.isPending} onClick={onSave} className="max-sm:w-full">{save.isPending && <Spin />}{children}</Btn>
  </div>
)

// keeps a local copy of one settings object; save() sends only these fields
function useDraft(initial) {
  const [v, setV] = useState(() => ({ ...initial }))
  return [v, (patch) => setV((x) => ({ ...x, ...patch }))]
}

const nul = (s) => (typeof s === 'string' && !s.trim() ? null : s)
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, nul(obj[k] ?? null)]))

function StoreInfo({ initial, canEdit }) {
  const [v, set] = useDraft(initial)
  const { save, err } = useSettingSave('store', { success: 'Store information saved' })
  const field = (k, label, props = {}) => (
    <FormField label={label} error={err(k)} className={props.wide ? 'md:col-span-2' : undefined}>
      <TextInput value={v[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} disabled={!canEdit} {...props} wide={undefined} />
    </FormField>
  )
  return (
    <Card title="Store information" sub="Shown in the footer, on invoices and in emails">
      <div className="grid gap-3.5 md:grid-cols-2">
        {field('name', 'Store name', { maxLength: 100 })}
        {field('tagline', 'Tagline', { maxLength: 150 })}
        {field('email', 'Support email', { type: 'email' })}
        {field('phone', 'Phone', { maxLength: 30 })}
        {field('address', 'Business address', { wide: true, maxLength: 255 })}
        {field('trade_license', 'Trade license no. (optional)', { maxLength: 60 })}
        {field('bin', 'BIN / VAT (optional)', { maxLength: 60 })}
      </div>
      {canEdit && <SaveBar save={save} onSave={() => save.mutate(pick(v, ['name', 'tagline', 'email', 'phone', 'address', 'trade_license', 'bin']))}>Save store information</SaveBar>}
    </Card>
  )
}

function Social({ initial, canEdit }) {
  const [v, set] = useDraft(initial)
  const { save, err } = useSettingSave('store', { success: 'Social links saved' })
  const url = (k, label, placeholder) => (
    <FormField label={label} error={err(k)}><TextInput type="url" value={v[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} placeholder={placeholder} disabled={!canEdit} /></FormField>
  )
  return (
    <Card title="Social & chat">
      <div className="grid gap-3.5 md:grid-cols-2">
        {url('facebook', 'Facebook page', 'https://facebook.com/xerqo.bd')}
        {url('instagram', 'Instagram', 'https://instagram.com/xerqo.bd')}
        {url('messenger', 'Messenger link', 'https://m.me/xerqo.bd')}
        <FormField label="WhatsApp number" error={err('whatsapp')} help="Used by the chat button"><TextInput value={v.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+880 1XXX-XXXXXX" disabled={!canEdit} /></FormField>
      </div>
      <SwitchRow label="Floating WhatsApp chat button" sub="Bottom-right bubble on every storefront page" checked={v.show_chat_button !== false} onChange={(show_chat_button) => set({ show_chat_button })} disabled={!canEdit} />
      {canEdit && <SaveBar save={save} onSave={() => save.mutate({ ...pick(v, ['facebook', 'instagram', 'messenger', 'whatsapp']), show_chat_button: v.show_chat_button !== false })}>Save social links</SaveBar>}
    </Card>
  )
}

function Seo({ initial, canEdit }) {
  const [v, set] = useDraft(initial)
  const { save, err } = useSettingSave('seo', { success: 'SEO saved' })
  const title = v.meta_title ?? ''
  const desc = v.meta_description ?? ''
  return (
    <Card title="SEO" sub="How XERQO appears on Google and when the home page is shared">
      <FormField label="Meta title" error={err('meta_title')} help={`${title.length} / 60 characters${title.length > 60 ? ' — Google may cut it short' : ''}`}>
        <TextInput value={title} onChange={(e) => set({ meta_title: e.target.value })} maxLength={70} disabled={!canEdit} />
      </FormField>
      <FormField label="Meta description" error={err('meta_description')} help={`${desc.length} / 160 characters`}>
        <Textarea rows={3} value={desc} onChange={(e) => set({ meta_description: e.target.value })} maxLength={170} disabled={!canEdit} />
      </FormField>
      <div className="rounded-xl bg-asoft p-3.5">
        <p className="text-[11px] text-ok">xerqo.com</p>
        <p className="mt-0.5 line-clamp-1 text-[15px] text-info">{title || 'XERQO'}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-amute">{desc || 'Add a short description of the store.'}</p>
      </div>
      {canEdit && <SaveBar save={save} onSave={() => save.mutate(pick(v, ['meta_title', 'meta_description']))}>Save SEO</SaveBar>}
    </Card>
  )
}

function StoreStatus({ maintenance, auth, canEdit }) {
  const [m, setM] = useDraft(maintenance)
  const [a, setA] = useDraft(auth)
  const sm = useSettingSave('maintenance', { success: 'Store status saved' })
  const sa = useSettingSave('auth', { success: 'Sign-in options saved' })
  const toggleMaintenance = async (enabled) => {
    if (enabled && !(await confirm({ title: 'Close the shop for visitors?', text: 'Visitors see a “We’ll be back soon” page. You can still browse while signed in to the admin.', confirmText: 'Turn on maintenance', danger: true }))) return
    setM({ enabled })
  }
  return (
    <>
      <Card title="Store status">
        <SwitchRow label="Maintenance mode" sub={m.enabled ? 'On — visitors see the “back soon” page' : 'Off — the shop is open'} checked={!!m.enabled} onChange={toggleMaintenance} disabled={!canEdit} />
        {m.enabled && (
          <FormField label="Message for visitors" error={sm.err('message')}><Textarea rows={2} value={m.message ?? ''} onChange={(e) => setM({ message: e.target.value })} maxLength={300} disabled={!canEdit} /></FormField>
        )}
        {canEdit && <SaveBar save={sm.save} onSave={() => sm.save.mutate({ enabled: !!m.enabled, message: nul(m.message ?? '') })}>Save store status</SaveBar>}
      </Card>
      <Card title="Customer sign-in" sub="Every order needs an account — guest checkout is off">
        <SwitchRow label="Sign in with an SMS code" sub="Customers can log in with a one-time code instead of a password" checked={!!a.otp_login} onChange={(otp_login) => setA({ otp_login })} disabled={!canEdit} />
        <SwitchRow label="Confirm phone when registering" sub="New accounts verify their number with an SMS code" checked={!!a.register_otp} onChange={(register_otp) => setA({ register_otp })} disabled={!canEdit} />
        <p className="text-[11px] text-amute">Both use the SMS balance. If SMS is switched off or the balance runs out, customers can still use their password.</p>
        {canEdit && <SaveBar save={sa.save} onSave={() => sa.save.mutate({ otp_login: !!a.otp_login, register_otp: !!a.register_otp })}>Save sign-in options</SaveBar>}
      </Card>
    </>
  )
}

function Policies({ returns, engraving, reviews, canEdit }) {
  const [r, setR] = useDraft(returns)
  const [e, setE] = useDraft({ ...engraving, fee: String(engraving.fee ?? 0) })
  const [rv, setRv] = useDraft(reviews)
  const sr = useSettingSave('returns', { success: 'Return policy saved' })
  const se = useSettingSave('engraving', { success: 'Engraving saved' })
  const srv = useSettingSave('reviews', { success: 'Review setting saved' })
  return (
    <>
      <Card title="Returns">
        <FormField label="Return window (days after delivery)" error={sr.err('window_days')} help="0 turns customer return requests off">
          <TextInput inputMode="numeric" value={String(r.window_days ?? 7)} onChange={(ev) => setR({ window_days: ev.target.value.replace(/\D/g, '') })} className="sm:w-32" disabled={!canEdit} />
        </FormField>
        <FormField label="Return policy" error={sr.err('policy')}><Textarea rows={3} value={r.policy ?? ''} onChange={(ev) => setR({ policy: ev.target.value })} maxLength={2000} disabled={!canEdit} /></FormField>
        {canEdit && <SaveBar save={sr.save} onSave={() => sr.save.mutate({ window_days: Number(r.window_days) || 0, policy: nul(r.policy ?? '') })}>Save return policy</SaveBar>}
      </Card>
      <Card title="Name engraving">
        <SwitchRow label="Offer engraving" sub="Products with engraving switched on show a name field" checked={!!e.enabled} onChange={(enabled) => setE({ enabled })} disabled={!canEdit} />
        {e.enabled && (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField label="Max characters" error={se.err('max_length')}><TextInput inputMode="numeric" value={String(e.max_length ?? 30)} onChange={(ev) => setE({ max_length: ev.target.value.replace(/\D/g, '') })} disabled={!canEdit} /></FormField>
            <FormField label="Engraving fee" error={se.err('fee')} help="0 = free"><MoneyInput value={e.fee} onChange={(fee) => setE({ fee })} disabled={!canEdit} /></FormField>
          </div>
        )}
        {canEdit && <SaveBar save={se.save} onSave={() => se.save.mutate({ enabled: !!e.enabled, max_length: Number(e.max_length) || 30, fee: Number(e.fee) || 0 })}>Save engraving</SaveBar>}
      </Card>
      <Card title="Product reviews">
        <SwitchRow label="Publish reviews without moderation" sub={rv.auto_approve ? 'New reviews go live straight away' : 'New reviews wait in Reviews → Pending'} checked={!!rv.auto_approve} onChange={(auto_approve) => setRv({ auto_approve })} disabled={!canEdit} />
        {canEdit && <SaveBar save={srv.save} onSave={() => srv.save.mutate({ auto_approve: !!rv.auto_approve })}>Save</SaveBar>}
      </Card>
    </>
  )
}

export default function AdminSettingsGeneral() {
  const { can } = useAdminAuth()
  const canEdit = can('settings', 'edit')
  const { values, isPending } = useSettingsData()
  return (
    <>
      <PageHead title="Settings" sub="Store profile, SEO, social links, store status and policies" />
      <SettingsShell>
        {isPending || !values ? <LoadingBlock /> : <>
          <StoreInfo initial={values.store ?? {}} canEdit={canEdit} />
          <StoreStatus maintenance={values.maintenance ?? {}} auth={values.auth ?? {}} canEdit={canEdit} />
          <Seo initial={values.seo ?? {}} canEdit={canEdit} />
          <Social initial={values.store ?? {}} canEdit={canEdit} />
          <Policies returns={values.returns ?? {}} engraving={values.engraving ?? {}} reviews={values.reviews ?? {}} canEdit={canEdit} />
        </>}
      </SettingsShell>
    </>
  )
}
