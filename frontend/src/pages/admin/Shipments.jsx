import { Printer, Truck, MoreHorizontal } from 'lucide-react'
import { Btn, Badge, Card, PageHead, KPIs, Tabs, Field, Select, Avatar } from '../../components/admin/ui'

const couriers = [
  { name: 'Steadfast', amount: '৳1,12,400', sub: 'pending COD · payout Thu', on: true },
  { name: 'Pathao', amount: '৳38,250', sub: 'pending COD · payout Sun', on: true },
  { name: 'RedX', amount: '৳0', sub: 'Not connected', on: false },
]

const shipments = [
  { cn: 'SF-88213457', order: '#XQ-24817', courier: 'Steadfast', name: 'Rahim Uddin', city: 'Dhaka', cod: '৳2,600', status: 'In transit', tone: 'blue' },
  { cn: 'SF-88213401', order: '#XQ-24815', courier: 'Steadfast', name: 'Tanvir Ahmed', city: 'Dhaka', cod: '৳4,890', status: 'Picked', tone: 'purple' },
  { cn: 'PT-5520931', order: '#XQ-24814', courier: 'Pathao', name: 'Farhana Akter', city: 'Sylhet', cod: '৳0 (bKash)', status: 'Out for delivery', tone: 'teal' },
  { cn: 'SF-88212977', order: '#XQ-24811', courier: 'Steadfast', name: 'Mehedi Hasan', city: 'Dhaka', cod: '৳0 (bKash)', status: 'Delivered' },
  { cn: 'RX-771230', order: '#XQ-24808', courier: 'RedX', name: 'Karim Sheikh', city: 'Rangpur', cod: '৳1,450', status: 'Returned' },
  { cn: '—', order: '#XQ-24816', courier: '—', name: 'Nusrat Jahan', city: 'Chattogram', cod: '৳0 (bKash)', status: 'To book', tone: 'amber', checked: true },
]

const th = 'whitespace-nowrap px-4 py-3 font-semibold'

function ShipTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-aline bg-white max-sm:hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>
              <th className="w-10 py-3 pl-4" />
              <th className={`${th} max-lg:hidden`}>Consignment</th>
              <th className={th}>Order</th>
              <th className={`${th} max-md:hidden`}>Courier</th>
              <th className={th}>Customer</th>
              <th className={th}>COD</th>
              <th className={th}>Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-aline">
            {shipments.map((s) => (
              <tr key={s.order} className="hover:bg-abg/60">
                <td className="py-3 pl-4"><input type="checkbox" defaultChecked={s.checked} className="size-4 accent-tan" aria-label={`Select ${s.order}`} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-amute max-lg:hidden">{s.cn}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{s.order}</td>
                <td className="px-4 py-3 max-md:hidden">{s.courier}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5"><Avatar name={s.name} /><div><p className="whitespace-nowrap font-semibold">{s.name}</p><p className="text-[11px] text-amute">{s.city}</p></div></div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{s.cod}</td>
                <td className="px-4 py-3"><Badge tone={s.tone}>{s.status}</Badge></td>
                <td className="pr-4 text-right"><button aria-label="More"><MoreHorizontal className="size-4 text-amute" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ShipCards() {
  return (
    <div className="space-y-2.5 sm:hidden">
      {shipments.map((s) => (
        <div key={s.order} className="space-y-1.5 rounded-xl border border-aline bg-white p-3.5">
          <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold">{s.order} · {s.courier}</p><Badge tone={s.tone}>{s.status}</Badge></div>
          <div className="flex items-center justify-between gap-2 text-xs"><span className="text-amute">{s.name} · {s.city}</span><b className="text-[13px]">{s.cod}</b></div>
          <p className="text-[11px] text-amute">CN {s.cn}</p>
        </div>
      ))}
    </div>
  )
}

export default function AdminShipments() {
  return (
    <>
      <PageHead
        title="Shipments"
        sub="Courier bookings, tracking & COD settlement"
        actions={<>
          <Btn v="white" icon={Printer}><span className="sm:hidden">Labels</span><span className="max-sm:hidden">Print labels</span></Btn>
          <Btn icon={Truck}><span className="sm:hidden">Book</span><span className="max-sm:hidden">Book selected (3)</span></Btn>
        </>}
      />
      <KPIs items={[['Ready to book', '11', 'Packed orders', 'amber'], ['In transit', '32', 'Avg 2.1 days'], ['Delivered today', '27', '▲ 5'], ['Returned / failed', '4', '1.8% rate', 'red']]} />

      <div className="grid gap-2.5 sm:gap-4 md:grid-cols-3">
        {couriers.map((c) => (
          <div key={c.name} className="rounded-xl border border-aline bg-white p-4 sm:p-[18px]">
            <div className="flex items-center justify-between gap-2"><p className="text-[15px] font-bold">{c.name}</p><Badge tone={c.on ? 'green' : 'gray'}>{c.on ? 'Connected' : 'Connect'}</Badge></div>
            <p className="mt-2 text-2xl font-bold text-tan">{c.amount}</p>
            <p className="mt-1 text-xs text-amute">{c.sub}</p>
          </div>
        ))}
      </div>

      <Tabs items={[['All', '76'], ['To book', '11'], ['Picked', '8'], ['In transit', '32'], ['Delivered', '842'], ['Returned', '4']]} />
      <ShipTable />
      <ShipCards />

      <Card title="Book courier — #XQ-24816" sub="Nusrat Jahan · Chattogram · prepaid (bKash)">
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Courier"><Select options={['Steadfast Courier', 'Pathao Courier', 'RedX']} /></Field>
          <Field label="Delivery type"><Select options={['Regular (2–4 days)', 'Express (24 h)']} /></Field>
          <Field label="Weight" defaultValue="0.3 kg" />
          <Field label="COD amount" defaultValue="৳0" />
        </div>
        <Field label="Note for rider" defaultValue="Call before delivery. Fragile gift box." />
        <div className="flex gap-2.5"><Btn icon={Truck}>Book & print label</Btn><Btn v="white">Cancel</Btn></div>
      </Card>
    </>
  )
}
