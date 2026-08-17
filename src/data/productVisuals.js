export const PRODUCT_VISUALS = {
  shoerack: {
    image: '/plp/product-shoerack.png',
    fit: 'cover',
    alt: 'Multi-level shoe rack',
    edgeToEdge: true,
  },
  airpods: {
    image: '/plp/product-airpods.png',
    fit: 'contain',
    alt: 'Apple AirPods Pro 2 wireless earbuds',
    edgeToEdge: true,
  },
}

export const DEFAULT_PDP_VISUAL = {
  image: '/pdp/anker-charger.png',
  fit: 'contain',
  alt: 'Anker 737 GaN USB-C charger',
}

export function getProductVisual(productKey) {
  return Object.hasOwn(PRODUCT_VISUALS, productKey)
    ? PRODUCT_VISUALS[productKey]
    : DEFAULT_PDP_VISUAL
}
