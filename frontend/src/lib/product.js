// One shape for product cards, whether the product came from the API or the legacy static demo data.
export function normalizeProduct(p) {
  if (!p) return p
  const api = 'compare_price' in p || 'reviews_count' in p
  if (!api) {
    return { ...p, inStock: p.stock !== 0, rating: p.rating ?? 5, reviews: p.reviews ?? 0, hasVariants: false }
  }
  return {
    ...p,
    category: p.category?.name ?? '',
    categorySlug: p.category?.slug,
    brandName: p.brand?.name,
    oldPrice: p.compare_price || null,
    discount: p.discount_percent || 0,
    inStock: p.in_stock ?? p.stock > 0,
    rating: p.rating ?? 0,
    reviews: p.reviews_count ?? 0,
    hasVariants: !!p.has_variants,
  }
}

// Cart line for a product (+ optional colour variant / engraving)
export function cartLine(p, variant = null, engraving = '') {
  return {
    product_id: p.id,
    variant_id: variant?.id ?? null,
    slug: p.slug,
    name: p.name,
    image: variant?.image || p.image,
    color: variant?.name ?? null,
    price: variant?.price ?? p.price,
    stock: variant ? Math.min(variant.stock, p.stock) : p.stock,
    engraving_text: engraving || null,
  }
}
