import { CalendarDays, Download } from 'lucide-react'
import { Btn, Card, PageHead, KPIs, Two, Col, Thumb, cx } from '../../components/admin/ui'

// Daily revenue for September (thousand ৳)
const daily = [44, 50, 39, 58, 55, 48, 62, 66, 57, 61, 59, 75, 72, 66, 79, 74, 62, 82, 78, 72, 80, 86, 73, 85, 79, 92, 83, 89, 81, 98]
const MAX = 100

const categories = [['Long Wallets', 6.2], ['Wallets', 4.8], ['Passport Covers', 3.1], ['Bags', 3.0], ["Women's Purses", 2.4], ['Key Holders & Belts', 1.9]]
const payMix = [['COD', 62, 'bg-ink'], ['bKash', 22, 'bg-bkash'], ['Nagad', 10, 'bg-nagad'], ['Card', 6, 'bg-info']]
const districts = [['Dhaka', 52], ['Chattogram', 14], ['Gazipur', 7], ['Sylhet', 6], ['Narayanganj', 4]]
const traffic = [['Facebook (organic + ads)', '58%'], ['Direct / WhatsApp', '19%'], ['Google', '14%'], ['Instagram', '9%']]
const top = [
  ['Heritage Long Wallet', '/images/fb-long-wallet.jpg', 214, '৳5.2L', '1.2%'],
  ['Classic Bifold Wallet', '/images/fb-wallet.jpg', 188, '৳2.7L', '0.8%'],
  ['Voyager Passport Cover', '/images/fb-passport-black.jpg', 96, '৳1.2L', '0.5%'],
  ['Everyday Tote Bag', '/images/tote.jpg', 41, '৳2.4L', '2.4%'],
]

function Bar({ label, value, pct, color = 'bg-tan' }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-amute">{label}</span><b className="font-semibold">{value}</b></div>
      <div className="h-1.5 rounded-full bg-asoft"><div style={{ width: `${pct}%` }} className={cx('h-full rounded-full', color)} /></div>
    </div>
  )
}

function RevenueChart() {
  const labelsDesk = [1, 6, 11, 16, 21, 26]
  const labelsMob = [21, 24, 27, 30]
  return (
    <Card title="Revenue by day" right={<span className="text-[13px] font-semibold text-tan">৳21.4L total</span>}>
      <div className="relative h-[150px] sm:h-[190px]">
        {[0, 1, 2, 3].map((i) => <div key={i} style={{ top: `${i * 25}%` }} className="absolute inset-x-0 border-t border-aline/70" />)}
        <div className="absolute inset-0 flex items-end gap-2 border-b border-aline sm:gap-1.5 xl:gap-[7px]">
          {daily.map((v, i) => (
            <div
              key={i}
              title={`${i + 1} Sep · ৳${v}K`}
              style={{ height: `${(v / MAX) * 100}%` }}
              className={cx('flex-1 rounded-t-sm', i === daily.length - 1 ? 'bg-tan' : 'bg-[#DCC6AE] hover:bg-[#cdb093]', i < 20 && 'max-sm:hidden')}
            />
          ))}
        </div>
      </div>
      <div className="relative h-3 text-[10px] text-amute">
        {labelsDesk.map((d) => <span key={d} style={{ left: `${((d - 1) / daily.length) * 100}%` }} className="absolute whitespace-nowrap max-sm:hidden">{d} Sep</span>)}
        {labelsMob.map((d) => <span key={d} style={{ left: `${((d - 21 + 0.5) / 10) * 100}%` }} className="absolute -translate-x-1/2 whitespace-nowrap sm:hidden">{d} Sep</span>)}
      </div>
    </Card>
  )
}

function TopProducts() {
  return (
    <Card title="Top products">
      <div className="overflow-hidden rounded-lg">
        <table className="w-full text-[13px]">
          <thead className="bg-asoft text-left text-[11px] uppercase tracking-wider text-amute">
            <tr>
              <th className="px-3.5 py-3 font-semibold">Product</th>
              <th className="px-3.5 py-3 font-semibold max-sm:hidden">Units</th>
              <th className="px-3.5 py-3 font-semibold">Revenue</th>
              <th className="px-3.5 py-3 font-semibold max-sm:hidden">Returns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aline border-b border-aline">
            {top.map(([n, img, u, r, ret]) => (
              <tr key={n}>
                <td className="px-3.5 py-3"><div className="flex items-center gap-2.5"><Thumb src={img} size={32} /><span className="font-medium">{n}</span></div></td>
                <td className="px-3.5 py-3 max-sm:hidden">{u}</td>
                <td className="px-3.5 py-3 font-semibold">{r}</td>
                <td className="px-3.5 py-3 text-amute max-sm:hidden">{ret}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default function AdminReports() {
  return (
    <>
      <PageHead
        title="Reports & analytics"
        sub="1 Sep – 30 Sep 2026 · compared to August"
        actions={<><Btn v="white" icon={CalendarDays}>Sep 2026</Btn><Btn v="white" icon={Download}>Export</Btn></>}
      />
      <KPIs items={[['Revenue', '৳21.4L', '▲ 18% vs Aug'], ['Orders', '938', '▲ 11%'], ['Avg order value', '৳2,280', '▲ 6%'], ['Return rate', '1.8%', '▼ 0.4%']]} />
      <Two ratio="main">
        <Col>
          <RevenueChart />
          <Card title="Sales by category">
            {categories.map(([l, v]) => <Bar key={l} label={l} value={`৳${v.toFixed(1)}L`} pct={(v / 11) * 100} />)}
          </Card>
          <TopProducts />
        </Col>
        <Col className="md:max-xl:grid md:max-xl:grid-cols-2 md:max-xl:gap-5 md:max-xl:space-y-0!">
          <Card title="Payment methods">
            <div className="flex h-3 overflow-hidden rounded-full">{payMix.map(([m, p, bg]) => <div key={m} style={{ width: `${p}%` }} className={bg} />)}</div>
            <div className="space-y-2.5">
              {payMix.map(([m, p, bg]) => (
                <div key={m} className="flex items-center gap-2.5 text-[13px]"><span className={cx('size-2.5 rounded-full', bg)} /><span className="flex-1">{m}</span><b className="font-semibold">{p}%</b></div>
              ))}
            </div>
          </Card>
          <Card title="Top districts">
            {districts.map(([d, p]) => <Bar key={d} label={d} value={`${p}%`} pct={(p / 62) * 100} color="bg-info" />)}
          </Card>
          <Card title="Traffic sources" className="md:max-xl:col-span-2">
            <div className="space-y-2.5">
              {traffic.map(([s, p]) => <div key={s} className="flex justify-between text-[13px]"><span className="text-amute">{s}</span><b className="font-semibold">{p}</b></div>)}
            </div>
            <div className="rounded-lg bg-asoft p-3.5">
              <p className="text-xs font-semibold">Conversion funnel</p>
              <p className="mt-1 text-xs text-amute">Visits 41,200 → Cart 3,120 → Checkout 1,410 → Orders 938</p>
              <p className="mt-1.5 text-[13px] font-bold text-ok">Conversion rate 2.3%</p>
            </div>
          </Card>
        </Col>
      </Two>
    </>
  )
}
