import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import Select2 from '../../components/common/Select2'
import { PasswordInput } from './Login'

const ADDRESSES = [
  { label: 'Home', name: 'Rahim Uddin', phone: '01712-XXXXXX', line: 'House 12, Road 5, Dhanmondi, Dhaka 1205', zone: 'Inside Dhaka', isDefault: true },
  { label: 'Office', name: 'Rahim Uddin', phone: '01712-XXXXXX', line: 'Level 7, Gulshan Avenue, Gulshan-1, Dhaka', zone: 'Inside Dhaka' },
  { label: 'Parents', name: 'Abdul Karim', phone: '01819-XXXXXX', line: 'Station Road, Chattogram Sadar, Chattogram', zone: 'Outside Dhaka' },
]

const Card = ({ className, children }) => <div className={cx('rounded-lg bg-white p-4 sm:p-6', className)}>{children}</div>

function Toggle({ label, defaultOn }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-3 text-[13px]">
      {label}
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => setOn(!on)} className={cx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-leaf' : 'bg-line')}>
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  )
}

const Select = ({ placeholder, options }) => <Select2 variant="store" placeholder={placeholder} options={options} />

function PersonalInfo() {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-tan text-lg font-bold text-white">RU</span>
        <div><h2 className="text-base font-semibold">Personal info</h2><button className="text-xs font-semibold text-tan underline underline-offset-2">Change photo</button></div>
      </div>
      <Field label="Full name" defaultValue="Rahim Uddin" />
      <Field label="Mobile">
        <div className="relative"><input className="input pr-24" defaultValue="01712-XXXXXX" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-leaf">✓ Verified</span></div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" type="email" defaultValue="rahim@email.com" />
        <Field label="Date of birth" defaultValue="12 / 04 / 1994" />
      </div>
      <Button size="sm" className="sm:!px-4 sm:!py-3">Save changes</Button>
    </Card>
  )
}

function PasswordNotifications() {
  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold">Password &amp; notifications</h2>
      <Field label="Current password" type="password" defaultValue="Leather25" />
      <Field label="New password"><PasswordInput placeholder="Min. 8 characters" /></Field>
      <Button variant="outline" size="sm" className="sm:!px-4 sm:!py-3">Update password</Button>
      <div className="pt-1">
        <Toggle label="Order updates by SMS" defaultOn />
        <Toggle label="Offers & new arrivals (SMS)" />
        <Toggle label="Email newsletter" defaultOn />
      </div>
    </Card>
  )
}

function AddressCard({ a }) {
  return (
    <article className={cx('space-y-2 rounded-lg bg-white p-4 sm:p-5', a.isDefault ? 'border-[1.5px] border-tan' : 'border border-line')}>
      <p className="flex items-center gap-2 font-semibold">{a.label}{a.isDefault && <span className="rounded-full bg-amber/12 px-2 py-0.5 text-[10px] font-semibold text-amber">Default</span>}</p>
      <p className="text-[13px]">{a.name} · {a.phone}</p>
      <p className="text-xs leading-relaxed text-mute">{a.line}</p>
      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold', a.zone === 'Inside Dhaka' ? 'bg-info/12 text-info' : 'bg-violet/12 text-violet')}>{a.zone}</span>
      <div className="flex gap-4 pt-1 text-xs text-mute">
        <button className="font-semibold text-tan underline underline-offset-2">Edit</button>
        <button className="hover:text-rust">Delete</button>
        {!a.isDefault && <button className="hover:text-ink">Set as default</button>}
      </div>
    </article>
  )
}

function AddAddress() {
  const [type, setType] = useState('Other')
  return (
    <Card className="space-y-4">
      <h3 className="text-base font-semibold">Add new address</h3>
      <div className="flex gap-2">
        {['Home', 'Office', 'Other'].map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} className={cx('rounded-full border px-3.5 py-1.5 text-xs font-medium', type === t ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{t}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Recipient name" placeholder="Full name" />
        <Field label="Phone" inputMode="tel" placeholder="01XXXXXXXXX" />
        <Field label="District"><Select placeholder="Select district" options={['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh']} /></Field>
        <Field label="Area / Thana"><Select placeholder="Select area" options={['Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara', 'Mohammadpur', 'Banani']} /></Field>
      </div>
      <Field label="Full address" placeholder="House, road, landmark" />
      <Checkbox label="Set as default address" />
      <div className="flex gap-2">
        <Button size="sm" className="sm:!px-4 sm:!py-3">Save address</Button>
        <Button variant="outline" size="sm" className="sm:!px-4 sm:!py-3">Cancel</Button>
      </div>
    </Card>
  )
}

export default function Profile() {
  return (
    <AccountShell title="Profile & addresses">
      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-2">
        <PersonalInfo />
        <PasswordNotifications />
      </div>

      <section id="addresses" className="scroll-mt-32 space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="h-display text-[26px] sm:text-[32px]">Address book</h2>
          <Button variant="tan" size="sm" className="sm:!px-4 sm:!py-2.5"><Plus className="size-3.5" />Add address</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {ADDRESSES.map((a) => <AddressCard key={a.label} a={a} />)}
        </div>
        <AddAddress />
      </section>

      <button className="text-xs text-rust underline underline-offset-2">Delete my account</button>
    </AccountShell>
  )
}
