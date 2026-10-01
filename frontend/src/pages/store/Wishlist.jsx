import { Heart, Share2, ShoppingBag } from 'lucide-react'
import { products } from '../../data/store'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, ProductCard, EmptyState } from '../../components/store/ui'

// Saved items (Rose Clasp Purse shown as sold out to demo the "Notify me" state)
const saved = [
  { p: products[5], badge: 'Price dropped' },
  { p: products[25] },
  { p: { ...products[20], stock: 0 } },
  { p: products[11] },
  { p: products[31] },
  { p: products[21] },
]

export default function Wishlist() {
  return (
    <AccountShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="h-display text-[30px] sm:text-4xl">My wishlist</h1>
          <p className="text-[13px] text-mute">{saved.length} items · 1 price drop</p>
        </div>
        <div className="flex gap-2">
          <Button variant="white" size="sm" className="sm:!px-4 sm:!py-2.5"><Share2 className="size-3.5" />Share</Button>
          <Button size="sm" className="sm:!px-4 sm:!py-2.5"><ShoppingBag className="size-3.5" />Add all to cart</Button>
        </div>
      </div>

      {saved.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">
          {saved.map(({ p, badge }) => <ProductCard key={p.id} p={p} badge={badge} fav />)}
        </div>
      ) : (
        <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<Button to="/shop">Start shopping</Button>} />
      )}
      <p className="text-center text-xs text-mute">Tap the <Heart className="inline size-3 fill-rust text-rust" /> on a product to remove it from your wishlist.</p>
    </AccountShell>
  )
}
