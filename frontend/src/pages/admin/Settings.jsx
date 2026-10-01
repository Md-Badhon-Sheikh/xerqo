import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, MoreHorizontal } from 'lucide-react'
import { SettingsShell } from '../../components/admin/AdminLayout'
import { Btn, Badge, Card, PageHead, Toggle, cx } from '../../components/admin/ui'

const zones = [
  { name: 'Inside Dhaka', sub: 'Dhaka city corporation areas', charge: 'Tk 60', time: '1–2 days', on: true },
  { name: 'Dhaka suburbs', sub: 'Savar, Gazipur, Narayanganj, Keraniganj', charge: 'Tk 100', time: '2–3 days', on: true },
  { name: 'Outside Dhaka', sub: 'All other districts (61)', charge: 'Tk 120', time: '2–4 days', on: true },
  { name: 'Express (Dhaka)', sub: 'Same-day before 12 PM', charge: 'Tk 150', time: 'Same day', on: false },
]

const methods = [
  { chip: 'COD', cls: 'bg-ink', name: 'Cash on Delivery', sub: 'Advance delivery charge for outside Dhaka: On', on: true },
  { chip: 'bKash', cls: 'bg-bkash', name: 'bKash', sub: 'Merchant API · Tokenized checkout · Connected', on: true },
  { chip: 'Nagad', cls: 'bg-nagad', name: 'Nagad', sub: 'Merchant API · Connected', on: true },
  { chip: 'Card', cls: 'bg-info', name: 'SSLCommerz', sub: 'Visa, Mastercard, Rocket, Upay · Not connected', on: false },
]

const couriers = [
  { name: 'Steadfast', sub: 'Default · API key saved', on: true },
  { name: 'Pathao', sub: 'Connected · Dhaka only', on: true },
  { name: 'RedX', sub: 'Not connected', on: false },
]

// Local toggle that actually flips (static demo)
function Switch({ on: init, label }) {
  const [on, setOn] = useState(init)
  return <button type="button" onClick={() => setOn(!on)} aria-label={label} className="shrink-0"><Toggle on={on} /></button>
}

function Zones() {
  return (
    <Card title="Delivery zones & charges" sub="Charges shown at checkout based on district" right={<Btn v="white" sm icon={Plus} className="max-sm:hidden">Add zone</Btn>}>
      {/* tablet / desktop table */}
      <div className="overflow-hidden rounded-xl border border-aline max-sm:hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr><th className="px-3.5 py-3 font-semibold">Zone</th><th className="px-3.5 py-3 font-semibold">Charge</th><th className="whitespace-nowrap px-3.5 py-3 font-semibold">Delivery time</th><th className="px-3.5 py-3 font-semibold">On</th><th className="w-8" /></tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {zones.map((z) => (
              <tr key={z.name}>
                <td className="px-3.5 py-3"><p className="font-semibold">{z.name}</p><p className="text-[11px] text-amute">{z.sub}</p></td>
                <td className="whitespace-nowrap px-3.5 py-3 font-bold">{z.charge}</td>
                <td className="whitespace-nowrap px-3.5 py-3">{z.time}</td>
                <td className="px-3.5 py-3"><Switch on={z.on} label={z.name} /></td>
                <td className="pr-3.5"><MoreHorizontal className="size-4 text-amute" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* mobile list */}
      <div className="divide-y divide-aline sm:hidden">
        {zones.map((z) => (
          <div key={z.name} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{z.name}</p><p className="text-[11px] text-amute">{z.charge} · {z.time}</p></div>
            <Switch on={z.on} label={z.name} />
          </div>
        ))}
        <div className="pt-3"><Btn v="white" icon={Plus} className="w-full">Add zone</Btn></div>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-ok/8 p-3.5">
        <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">Free delivery threshold</p><p className="text-[11px] text-amute">Orders above this amount ship free</p></div>
        <input className="ainput w-[84px]! shrink-0 sm:w-[96px]!" defaultValue="৳  2,000" aria-label="Free delivery threshold" />
        <Switch on label="Free delivery" />
      </div>
    </Card>
  )
}

function Methods() {
  return (
    <Card title="Payment methods" sub="Enable the gateways customers can use at checkout" className="scroll-mt-24">
      {methods.map((m) => (
        <div key={m.name} className="flex items-center gap-3 rounded-xl border border-aline p-3.5">
          <span className={cx('grid h-6 w-[46px] shrink-0 place-items-center rounded text-[10px] font-bold text-white', m.cls)}>{m.chip}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-amute">{m.sub}</p></div>
          <span className="max-sm:hidden">{m.on ? <Btn v="white" sm>Configure</Btn> : <Btn sm>Connect</Btn>}</span>
          <Switch on={m.on} label={m.name} />
        </div>
      ))}
    </Card>
  )
}

function Couriers() {
  return (
    <Card title="Courier integrations" sub="Book parcels & sync delivery status automatically">
      <div className="grid gap-3 sm:grid-cols-3">
        {couriers.map((c) => (
          <div key={c.name} className="space-y-3 rounded-xl border border-aline p-3.5">
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{c.name}</p><Badge tone={c.on ? 'green' : 'gray'}>{c.on ? 'Active' : 'Off'}</Badge></div>
            <p className="text-xs text-amute">{c.sub}</p>
            <Btn v={c.on ? 'soft' : 'dark'} sm className="w-full py-2!">{c.on ? 'Manage' : 'Connect'}</Btn>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">Auto-book confirmed orders</p><p className="text-[11px] text-amute">Send to default courier when status = Packed</p></div>
        <Switch on label="Auto-book" />
      </div>
    </Card>
  )
}

export default function AdminSettings() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    // wait for the layout's scroll-to-top on route change, then jump to the section
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50)
    return () => clearTimeout(t)
  }, [hash])
  return (
    <>
      <PageHead title="Settings" sub="Store, delivery charges, payment & courier integrations" actions={<Btn className="max-sm:hidden">Save changes</Btn>} />
      <SettingsShell>
        <Zones />
        <section id="payments" className="scroll-mt-24"><Methods /></section>
        <section id="couriers" className="scroll-mt-24"><Couriers /></section>
        <Btn className="w-full sm:hidden">Save changes</Btn>
      </SettingsShell>
    </>
  )
}
