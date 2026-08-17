// `name` is the single source of truth for the product title: the PLP card and
// the PDP both read it, so the two can never drift apart.
export const PRODUCT_VISUALS = {
  shoerack: {
    image: '/plp/product-shoerack.png',
    fit: 'cover',
    name: 'Multi-Level Shoe Rack Storage Organiser, 6 Tier Dustproof Cover',
    alt: 'Multi-level shoe rack',
    edgeToEdge: true,
  },
  airpods: {
    image: '/plp/product-airpods.png',
    fit: 'contain',
    name: 'Apple Airpods Pro 2 Wireless Earbuds',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    edgeToEdge: true,
  },
}

export const DEFAULT_PDP_VISUAL = {
  image: '/pdp/anker-charger.png',
  fit: 'contain',
  name: 'USB C Plug, 735 Charger (Nano II 65W), PPS 3-Port Fast Compact USB C Charger',
  alt: 'Anker 737 GaN USB-C charger',
}

export function getProductVisual(productKey) {
  return Object.hasOwn(PRODUCT_VISUALS, productKey)
    ? PRODUCT_VISUALS[productKey]
    : DEFAULT_PDP_VISUAL
}
