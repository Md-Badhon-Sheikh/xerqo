// Static demo data for the storefront. Replace with Laravel REST API calls (see src/lib/api.js).
export const img = (name) => `/images/${name}.jpg`

// Home hero slider — a banner without `title` is shown as a plain image
export const heroBanners = [
  { image: img('cover'), alt: 'XERQO — crafted for class, made to last', to: '/shop' },
  { image: img('workshop'), to: '/about', eyebrow: 'Made by hand', title: 'Cut, stitched & burnished in Dhaka', text: 'Full-grain leather goods that only get better with age.', cta: 'Our story' },
  { image: img('leather-close'), to: '/shop?c=bags', eyebrow: 'New season', title: 'The leather bag edit', text: 'Totes, messengers and doctor bags — up to 15% off.', cta: 'Shop bags' },
  { image: img('hands-brown'), to: '/shop?c=wallets', eyebrow: 'Up to 25% off', title: 'Wallets for every day', text: 'Bifold, slim and card-slot wallets in full-grain leather.', cta: 'Shop wallets' },
]

export const categories = [
  { slug: 'wallets', name: 'Wallets', image: img('fb-wallet'), count: 48 },
  { slug: 'long-wallets', name: 'Long Wallets', image: img('fb-long-wallet'), count: 22 },
  { slug: 'passport-covers', name: 'Passport Covers', image: img('fb-passport-hand'), count: 18 },
  { slug: 'card-holders', name: 'Card Holders', image: img('card-tan'), count: 15 },
  { slug: 'key-holders', name: 'Key Holders', image: img('keys-red'), count: 20 },
  { slug: 'womens-purses', name: "Women's Purses", image: img('pink-purse'), count: 16 },
  { slug: 'bags', name: 'Bags', image: img('tote'), count: 12 },
  { slug: 'belts', name: 'Belts', image: img('belt-tan'), count: 9 },
]

const P = (id, name, category, image, price, oldPrice, extra = {}) => ({
  id, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name, category, image: img(image), price, oldPrice, rating: 5, reviews: 40 + ((id * 37) % 300), stock: 12, ...extra,
})

export const products = [
  // Wallets
  P(1, 'Classic Bifold Wallet', 'Wallets', 'fb-wallet', 1450, 1750, { badge: 'Best seller', reviews: 412 }),
  P(2, 'Slim Croc Wallet', 'Wallets', 'fb-slim-croc', 1290, 1590),
  P(3, 'Mini Bifold Wallet', 'Wallets', 'wallet-small', 990, 1290, { badge: 'New' }),
  P(4, 'Noir Bifold Wallet', 'Wallets', 'black-wallet', 1350, null),
  P(5, 'Card-Slot Bifold', 'Wallets', 'open-wallet', 1190, 1390, { stock: 0 }),
  // Long wallets
  P(6, 'Heritage Long Wallet', 'Long Wallets', 'fb-long-wallet', 2450, 2800, { reviews: 236 }),
  P(7, 'Zip-Around Long Wallet', 'Long Wallets', 'zip-key', 1990, 2390),
  P(8, 'Premium Long Wallet', 'Long Wallets', 'fb-premium', 2750, null),
  P(9, 'Clutch Long Wallet', 'Long Wallets', 'wallet-cash', 2190, 2490),
  P(10, 'Travel Long Wallet', 'Long Wallets', 'wallet-float', 2350, null, { stock: 0 }),
  // Passport covers
  P(11, 'Handcrafted Passport Cover', 'Passport Covers', 'fb-passport-hand', 1250, 1450),
  P(12, 'Voyager Passport Cover', 'Passport Covers', 'fb-passport-black', 1250, 1450, { reviews: 189 }),
  P(13, 'Custom Name Passport Cover', 'Passport Covers', 'fb-passport-custom', 1450, 1650, { badge: 'Personalise' }),
  P(14, 'Travel Document Holder', 'Passport Covers', 'card-tan', 1590, null),
  P(15, 'Passport Sleeve', 'Passport Covers', 'sleeve', 890, 1090),
  // Key holders
  P(16, 'Key Holder — Red', 'Key Holders', 'keys-red', 450, 590),
  P(17, 'Grey Loop Key Holder', 'Key Holders', 'grey-key', 490, null),
  P(18, 'Ring Key Pouch', 'Key Holders', 'desk-keys', 550, 650),
  P(19, 'Floral Key Tag', 'Key Holders', 'keys-flower', 390, null, { stock: 0 }),
  P(20, 'Zip Key Pouch', 'Key Holders', 'zip-key', 590, 690),
  // Women's purses
  P(21, 'Rose Clasp Purse', "Women's Purses", 'pink-purse', 2150, 2450),
  P(22, 'Teal Crossbody Mini', "Women's Purses", 'teal-bag', 2490, null),
  P(23, 'Snap Card Purse', "Women's Purses", 'card-snap', 990, 1190),
  P(24, 'Noir Card Purse', "Women's Purses", 'black-card', 950, null),
  P(25, 'Suede Bucket Bag', "Women's Purses", 'bag-hand', 3290, 3690),
  // Bags
  P(26, 'Everyday Tote Bag', 'Bags', 'tote', 5900, 6500, { reviews: 97 }),
  P(27, 'Messenger Bag', 'Bags', 'messenger', 6450, null),
  P(28, 'Doctor Bag', 'Bags', 'doctor-bag', 8900, 9900),
  P(29, 'Executive Briefcase', 'Bags', 'briefcase', 9500, null, { stock: 0 }),
  P(30, 'Leather Backpack', 'Bags', 'backpack', 7800, 8500),
  // Card holders & belts
  P(31, 'Slim Card Holder', 'Card Holders', 'card-tan', 890, null, { badge: 'New' }),
  P(32, 'Classic Dress Belt', 'Belts', 'belt-tan', 1890, 2190),
  P(33, 'Braided Leather Belt', 'Belts', 'belt-braid', 2090, null),
]

export const byCategory = (name) => products.filter((p) => p.category === name)
export const findProduct = (slug) => products.find((p) => p.slug === slug) || products[0]

export const flashSale = [products[6], products[2], products[13], products[21], products[19]]
export const topSelling = [products[0], products[5], products[11], products[25]]
export const homeSections = [
  { title: 'Wallets', sub: '48 products · bifold, slim & card-slot', items: byCategory('Wallets') },
  { title: 'Long Wallets', sub: '22 products · zip-around & clutch', items: byCategory('Long Wallets') },
  { title: 'Passport Covers', sub: '18 products · free name engraving', items: byCategory('Passport Covers') },
  { title: 'Key Holders', sub: '20 products · loops, pouches & rings', items: byCategory('Key Holders') },
  { title: "Women's Purses", sub: '16 products · clasp, crossbody & card purses', items: byCategory("Women's Purses") },
  { title: 'Bags', sub: '12 products · tote, messenger & travel', items: byCategory('Bags') },
]

export const cartItems = [
  { product: products[0], qty: 1, variant: 'Burgundy Croc' },
  { product: products[12], qty: 1, variant: 'Black · Engraving: "M. HOSSAIN"' },
]

export const reviews = [
  { name: 'Tanvir Ahmed', city: 'Dhaka', rating: 5, text: 'The stitching is so neat and the leather smells real. After 6 months my wallet looks better than day one.' },
  { name: 'Nusrat Jahan', city: 'Chattogram', rating: 5, text: 'Ordered a long wallet with my husband’s name engraved. Arrived in 2 days in a beautiful box!' },
  { name: 'Rafiul Islam', city: 'Sylhet', rating: 5, text: 'Cash on delivery made it easy to trust. Quality is better than imported brands at double the price.' },
]

export const orders = [
  { id: 'XQ-24817', date: '1 Oct 2026', total: 2600, status: 'Processing', items: [products[0], products[12]] },
  { id: 'XQ-23102', date: '12 Sep 2026', total: 1450, status: 'Delivered', items: [products[0]], reviewPending: true },
  { id: 'XQ-21877', date: '20 Aug 2026', total: 3180, status: 'Delivered', items: [products[11], products[15]] },
]

export const tk = (n) => '৳' + Number(n).toLocaleString('en-IN')
export const discount = (p) => (p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0)
