import { useState } from 'react'
import { Upload, LogOut } from 'lucide-react'
import { Btn, Badge, Card, PageHead, Field, Select, Toggle, KV, Two, Col, cx } from '../../components/admin/ui'

function Switch({ label, sub, on: init }) {
  const [on, setOn] = useState(init)
  return (
    <button type="button" onClick={() => setOn(!on)} className="flex w-full items-center gap-3 text-left">
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium">{label}</span><span className="block text-[11px] text-amute">{sub}</span></span>
      <Toggle on={on} />
    </button>
  )
}

function Password({ label, value, onChange, focus }) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label}>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} className={cx('ainput pr-16', focus && 'border-tan')} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-tan">{show ? 'Hide' : 'Show'}</button>
      </div>
    </Field>
  )
}

const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) && p.length >= 14].filter(Boolean).length
const LABEL = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong']

function ChangePassword() {
  const [cur, setCur] = useState('Xerqo@2025')
  const [pw, setPw] = useState('Leather#2026')
  const [confirm, setConfirm] = useState('Leather#2026')
  const s = strength(pw)
  const good = s >= 3
  return (
    <Card title="Change password" sub="Last changed 42 days ago">
      <Password label="Current password" value={cur} onChange={(e) => setCur(e.target.value)} />
      <div className="space-y-2.5">
        <Password label="New password" value={pw} onChange={(e) => setPw(e.target.value)} focus />
        <div className="grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={cx('h-1 rounded-full', i < s ? (good ? 'bg-ok' : 'bg-amber') : 'bg-aline')} />)}</div>
        <p className={cx('text-[11px] font-semibold', good ? 'text-ok' : 'text-amber')}>{LABEL[s]} · {pw.length} characters, number & symbol</p>
      </div>
      <Field label="Confirm new password" help={confirm && confirm !== pw ? 'Passwords do not match' : undefined}>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="ainput" />
      </Field>
      <Btn className="w-full">Update password</Btn>
    </Card>
  )
}

export default function AdminProfile() {
  return (
    <>
      <PageHead title="My profile" sub="Your personal details, password and preferences" />

      <section className="flex flex-col gap-4 rounded-xl border border-aline bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-tan text-xl font-bold text-white sm:size-[72px] sm:text-2xl">DH</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">Dip Hossain</h2><Badge tone="tan">Super Admin</Badge></div>
          <p className="mt-1 text-xs text-amute">dip@xerqo.com · Last login today 11:02 AM · Dhaka</p>
        </div>
        <Btn v="white" icon={Upload} className="self-start sm:self-auto">Change photo</Btn>
      </section>

      <Two ratio="even">
        <Col>
          <Card title="Personal information">
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Full name" defaultValue="M M Hossain Dip" />
              <Field label="Display name" defaultValue="Dip Hossain" />
              <Field label="Email" type="email" defaultValue="dip@xerqo.com" />
              <Field label="Mobile" defaultValue="+880 1XXX-XXXXXX" />
            </div>
            <Field label="Role" help="Only another Super Admin can change your role">
              <input className="ainput bg-abg text-amute" value="Super Admin · all permissions" readOnly />
            </Field>
            <Btn>Save details</Btn>
          </Card>
          <Card title="Preferences">
            <div className="grid gap-3.5 md:grid-cols-2">
              <Field label="Admin language"><Select options={['English', 'বাংলা']} /></Field>
              <Field label="Date format"><Select options={['01 Oct 2026', '2026-10-01', '01/10/2026']} /></Field>
            </div>
            <Switch label="Dark sidebar" sub="Current theme" on />
            <Switch label="Sound on new order" sub="Plays a short chime" on />
          </Card>
        </Col>
        <Col>
          <ChangePassword />
          <Card title="2-step verification" right={<Badge tone="green">On</Badge>} bodyClass="space-y-3!">
            <KV k="Method" v="SMS OTP to ••••-XX45" />
            <div className="flex items-center justify-between text-[13px]"><span className="text-amute">Backup codes</span><button className="font-semibold text-tan">8 remaining</button></div>
            <Switch label="Use authenticator app instead" sub="Google Authenticator / Authy" on={false} />
          </Card>
          <Btn v="danger" to="/admin/login" icon={LogOut} className="w-full">Log out</Btn>
        </Col>
      </Two>
    </>
  )
}
