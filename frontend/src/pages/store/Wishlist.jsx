import { Heart, ShoppingBag } from 'lucide-react'
import { AccountShell } from '../../components/store/AccountShell'
import { Button, ProductCard, ProductCardSkeleton, EmptyState } from '../../components/store/ui'
import { useWishlist } from '../../context/WishlistContext'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/StoreUIContext'
import { cartLine, normalizeProduct } from '../../lib/product'
import { toast } from '../../lib/alert'

export default function Wishlist() {
  const { items, loading } = useWishlist()
  const cart = useCart()
  const ui = useUI()
  const products = items.map(normalizeProduct)
  // items that can go straight into the cart (in stock, no colour to choose)
  const ready = products.filter((p) => p.inStock && !p.hasVariants)
  const onSale = products.filter((p) => p.discount > 0).length

  const addAll = () => {
    ready.forEach((p) => cart.add(cartLine(p)))
    const skipped = products.length - ready.length
    toast.success(`${ready.length} ${ready.length === 1 ? 'item' : 'items'} added to cart${skipped ? ` · ${skipped} need a colour or are sold out` : ''}`)
    ui?.setDrawer(true)
  }

  return (
    <AccountShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="h-display text-[30px] sm:text-4xl">My wishlist</h1>
          <p className="text-[13px] text-mute">{products.length} {products.length === 1 ? 'item' : 'items'}{onSale ? ` · ${onSale} on sale` : ''}</p>
        </div>
        {ready.length > 0 && <Button size="sm" className="sm:!px-4 sm:!py-2.5" onClick={addAll}><ShoppingBag className="size-3.5" />Add all to cart</Button>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">{Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      ) : items.length ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8">
            {items.map((p) => <ProductCard key={p.id} p={p} badge={p.discount_percent > 0 ? `-${p.discount_percent}%` : undefined} />)}
          </div>
          <p className="text-center text-xs text-mute">Tap the <Heart className="inline size-3 fill-rust text-rust" /> on a product to remove it from your wishlist.</p>
        </>
      ) : (
        <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<Button to="/shop">Start shopping</Button>} />
      )}
    </AccountShell>
  )
}
