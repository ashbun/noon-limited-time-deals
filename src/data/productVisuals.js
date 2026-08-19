// The product catalogue. Every surface reads from here — the homepage widgets,
// the listing cards and the PDP — so a tile can never advertise one price and
// then open a page showing another.
//
// `deal` is the shape the PDP's LimitedTimeDeal expects:
//   price        the deal price, and what a card shows as its deal figure
//   regular      today's price, shown in the locked state's left column
//   upcomingWas  struck price beside `regular`, paired with `off`
//   liveWas      the "Before deal" price in the live state
//   off          per-cent off, as a number
//   save         the saving
//
// The listing derives its card figures from the same object (see pages/plp), so
// the card and the page it opens are the same numbers by construction.

export const PRODUCT_VISUALS = {
  /* ---- listing products ---- */
  shoerack: {
    image: '/plp/product-shoerack.png',
    fit: 'cover',
    name: 'Multi-Level Shoe Rack Storage Organiser, 6 Tier Dustproof Cover',
    alt: 'Multi-level shoe rack',
    edgeToEdge: true,
    deal: { price: '301', regular: '350', upcomingWas: 399, liveWas: 350, off: 12, save: 49 },
  },
  airpods: {
    image: '/plp/product-airpods.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    edgeToEdge: true,
    // 40% is the badge the card carries rather than 1399→899's true 36%; kept as
    // designed so the card and the page agree.
    deal: { price: '849', regular: '899', upcomingWas: 1399, liveWas: 899, off: 40, save: 50 },
  },

  /* ---- homepage CMS deal widget (All tab) ---- */
  'deal-shoe-1': {
    image: '/home/deal/shoe-1.png',
    fit: 'contain',
    name: 'Nike Court Vision Low Retro Sneakers, Red & Black',
    alt: 'Red and black low-top sneaker',
    deal: { price: '349', regular: '399', upcomingWas: 449, liveWas: 399, off: 11, save: 50 },
  },
  'deal-shoe-2': {
    image: '/home/deal/shoe-2.png',
    fit: 'contain',
    name: 'Nike Killshot Suede Trainers, Brown & Sail',
    alt: 'Brown suede trainer',
    deal: { price: '349', regular: '399', upcomingWas: 449, liveWas: 399, off: 11, save: 50 },
  },
  'deal-shoe-3': {
    image: '/home/deal/shoe-3.png',
    fit: 'contain',
    name: 'Nike Waffle Debut Retro Runners, Sail & Team Red',
    alt: 'Cream and red retro running shoe',
    deal: { price: '349', regular: '399', upcomingWas: 449, liveWas: 399, off: 11, save: 50 },
  },

  /* ---- homepage "Limited time deal" band ---- */
  'hpd-airpods-live': {
    image: '/home/hpdeal/airpods.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    deal: { price: '849', regular: '899', upcomingWas: 1699, liveWas: 899, off: 47, save: 50 },
  },
  'hpd-sneaker': {
    image: '/home/hpdeal/sneaker.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'White leather sneaker',
    deal: { price: '849', regular: '899', upcomingWas: 1699, liveWas: 899, off: 47, save: 50 },
  },
  'hpd-airpods-off': {
    image: '/home/hpdeal/airpods.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    deal: { price: '849', regular: '899', upcomingWas: 1699, liveWas: 899, off: 60, save: 50 },
  },
  'hpd-nike': {
    image: '/home/hpdeal/sneaker.png',
    fit: 'contain',
    name: 'Nike sneakers white shoes with comfortable soles',
    alt: 'White Nike sneaker',
    deal: { price: '849', regular: '899', upcomingWas: 1699, liveWas: 899, off: 60, save: 50 },
  },

  /* ---- homepage "Best picks for you" / "Trending products" ---- */
  'pick-airpods': {
    image: '/home/picks/airpods.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    deal: { price: '899', regular: '999', upcomingWas: 1399, liveWas: 999, off: 33, save: 100 },
  },
  'pick-washer': {
    image: '/home/picks/washer.png',
    fit: 'contain',
    name: 'Whirlpool 7 kg Magic Clean Fully Automatic Top Load Washing Machine',
    alt: 'Whirlpool top-load washing machine',
    deal: { price: '899', regular: '999', upcomingWas: 1399, liveWas: 999, off: 33, save: 100 },
  },
  'pick-mount': {
    image: '/home/picks/phone-mount.png',
    fit: 'contain',
    name: 'MAYNOS Suction Phone Case Mount',
    alt: 'Suction phone case mount',
    deal: { price: '899', regular: '999', upcomingWas: 1399, liveWas: 999, off: 33, save: 100 },
  },
}

export const DEFAULT_PDP_VISUAL = {
  image: '/pdp/anker-charger.png',
  fit: 'contain',
  name: 'USB C Plug, 735 Charger (Nano II 65W), PPS 3-Port Fast Compact USB C Charger',
  alt: 'Anker 737 GaN USB-C charger',
  deal: { price: '300.75', regular: '349.75', upcomingWas: 899, liveWas: 349, off: 47, save: 49 },
}

export function getProductVisual(productKey) {
  return Object.hasOwn(PRODUCT_VISUALS, productKey)
    ? PRODUCT_VISUALS[productKey]
    : DEFAULT_PDP_VISUAL
}

/* The deal figures for a product, falling back to the default page's. Separate
   from getProductVisual so a caller that only wants prices doesn't have to know
   about the fallback visual. */
export function getProductDeal(productKey) {
  return getProductVisual(productKey).deal ?? DEFAULT_PDP_VISUAL.deal
}
