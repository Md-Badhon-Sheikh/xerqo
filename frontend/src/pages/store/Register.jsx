import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { AuthShell } from '../../components/store/AccountShell'
import { Button, Field, Checkbox, cx } from '../../components/store/ui'
import { AuthTabs, OrDivider, SocialButtons, PasswordInput } from './Login'

const DISTRICTS = ['Dhaka', 'Chattogram', 'Gazipur', 'Narayanganj', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Cumilla']

// Static strength preview for the demo password ("Leather25")
function Strength({ level = 3 }) {
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const tones = ['bg-rust', 'bg-amber', 'bg-leaf', 'bg-leaf']
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {labels.map((_, i) => <span key={i} className={cx('h-1 rounded-full', i < level ? tones[level - 1] : 'bg-line')} />)}
      </div>
      <p className="flex justify-between text-xs text-mute"><span>Min. 8 characters with a number</span><span className="font-semibold text-leaf">{labels[level - 1]}</span></p>
    </div>
  )
}

export default function Register() {
  const [gender, setGender] = useState('Male')
  return (
    <AuthShell photo="/images/hands-brown.jpg" quote="Join XERQO — your leather, your name, your story.">
      <AuthTabs active="Create account" />
      <div className="space-y-1.5">
        <h1 className="h-display text-[30px] sm:text-[36px]">Create your account</h1>
        <p className="text-sm text-mute">Takes 30 seconds. We’ll verify your mobile with an OTP.</p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Full name *" defaultValue="Rahim Uddin" />
        <Field label="Mobile number *">
          <div className="flex items-center rounded border-[1.5px] border-ink bg-white">
            <span className="pl-4 text-sm font-semibold">+880</span>
            <input inputMode="tel" placeholder="1712-XXXXXX" className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-mute" />
            <button type="button" className="px-4 text-xs font-semibold text-tan">Send OTP</button>
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email (optional)" type="email" placeholder="you@email.com" />
          <Field label="District">
            <div className="relative">
              <select defaultValue="Dhaka" className="input appearance-none pr-10">{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            </div>
          </Field>
        </div>
        <Field label="Password *"><PasswordInput defaultValue="Leather25" /></Field>
        <Strength />
        <Field label="Confirm password *"><PasswordInput defaultValue="Leather25" placeholder="Re-enter password" /></Field>

        <div className="flex flex-wrap gap-2">
          {['Male', 'Female', 'Prefer not to say'].map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)} className={cx('rounded-full border px-3.5 py-2 text-xs font-medium transition', gender === g ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink')}>{g}</button>
          ))}
        </div>

        <div className="space-y-2.5">
          <Checkbox label={<span>I agree to the <Link to="/policy" className="underline underline-offset-2">Terms &amp; Privacy Policy</Link></span>} defaultChecked />
          <Checkbox label="Send me offers & new arrivals by SMS" />
        </div>
        <Button size="lg" className="w-full">Create account</Button>
      </form>

      <OrDivider />
      <SocialButtons verb="Sign up" />
      <p className="text-center text-[13px] font-semibold text-tan">Already have an account? <Link to="/login" className="underline underline-offset-4">Sign in</Link></p>
    </AuthShell>
  )
}
