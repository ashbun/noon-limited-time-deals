import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../../components/AppBottomNav'
import './styles.css'

// noon homepage — ported from the marketplace-switcher experiment in
// noon-app/frontend (src/experiments/marketplace-switcher). That version is
// Tailwind; this is the same layout rewritten in plain CSS to match the rest of
// this repo, and trimmed to the shell plus the All tab:
//
//   ported      status bar, address bar, search, the 7-tab department nav with
//               its gradient skin, and the All tab's CMS widget carousel
//   not ported  the marketplace switcher rail that sits above the address bar,
//               and the Electronics / Grocery / Beauty tab content and themes
//
// Entry point of the app: the search bar and the carousel's product tiles open
// the listing.

/* Figma's two vertical gradients for the All (blue) theme. Every tab shares
   this skin here — in the source, Electronics/Grocery/Beauty each re-skin the
   header, and Fashion/Wellness/Home deliberately fall back to this one. */
const HEADER_GRADIENT = 'linear-gradient(180deg, #D8EFFF 0%, #D8F5FF 100%)'
const LAYOUT_GRADIENT = 'linear-gradient(180deg, #D9F5FE 0%, #8BDEF9 100%)'

const TABS = [
  { id: 'all', label: 'All', icon: 'all', size: 24 },
  { id: 'electronics', label: 'Electronics', icon: 'electronics', size: 24, isNew: true },
  { id: 'grocery', label: 'Grocery', icon: 'grocery', size: 24 },
  { id: 'beauty', label: 'Beauty', icon: 'beauty', size: 24 },
  { id: 'fashion', label: 'Fashion', icon: 'fashion', size: 24 },
  { id: 'wellness', label: 'Wellness', icon: 'wellness', size: 20 },
  { id: 'home', label: 'Home', icon: 'home', size: 20 },
]

// Every tab is the same width, so the indicator's resting place is index × TAB_W
// — no measuring, and it stays exact while the nav scrolls horizontally.
const TAB_W = 76

/* Verbatim from the source's data/marketplace.js, ellipsis included — the line
   is pre-truncated there rather than clipped by CSS. */
const ADDRESS = { label: 'Home', line: 'BDA Complex, 100 Feet Rd 3rd Block, Kora...' }

const FADE = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
const CONTROL = { type: 'spring', stiffness: 420, damping: 34 }

/* Noontree dirham (AED) glyph — private-use codepoint U+E001. Written as an
   escape rather than the literal character, which does not survive every editor
   — it was silently lost here once already, leaving every price unprefixed. */
const DH = '\uE001'
function Dh() {
  return <span className="dh" aria-label="AED">{DH}</span>
}

// A direction reversal has to travel this far before the bottom bar reacts.
// Comparing against the previous event's offset instead made a trackpad's ±1px
// jitter flip the bar open and shut every frame, and each flip runs a 220ms
// height transition that resizes the scroll container — which is what read as
// the page shuddering as you scrolled.
const NAV_THRESHOLD = 10

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('all')
  const [navVisible, setNavVisible] = useState(true)
  const [switcherCollapsed, setSwitcherCollapsed] = useState(false)
  const latestTop = useRef(0)
  const navAnchor = useRef(0)
  const frame = useRef(0)
  const navigate = useNavigate()

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // Scrolling down hides the bottom bar, scrolling up brings it back — the
  // behaviour the source page added in "Hide bottom navigation while scrolling".
  // The marketplace rail collapses on its own hysteresis (36px down, 12px back
  // up) so it can't flutter around a single threshold either.
  //
  // Coalesced to one update per frame: scroll fires far more often than the
  // browser paints, and every handler run here sets state on two transitions.
  const onScroll = (event) => {
    latestTop.current = Math.max(0, event.currentTarget.scrollTop)
    if (frame.current) return

    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const top = latestTop.current

      setSwitcherCollapsed((collapsed) => (collapsed ? top > 12 : top > 36))

      if (top <= 4) {
        setNavVisible(true)
        navAnchor.current = top
        return
      }

      // The anchor only moves when the bar actually changes, so the threshold is
      // measured from the last decision rather than from the last event.
      const travelled = top - navAnchor.current
      if (travelled > NAV_THRESHOLD) {
        setNavVisible(false)
        navAnchor.current = top
      } else if (travelled < -NAV_THRESHOLD) {
        setNavVisible(true)
        navAnchor.current = top
      }
    })
  }

  const openListing = () => navigate('/plp')
  // The deal widget's cards go straight to the product, in its live-deal state —
  // that's the whole point of the widget.
  const openProduct = () => navigate('/pdp?deal=live&product=shoerack')

  return (
    <div className="stage">
      <div className="phone">
        <div className="home">
          <div className="home-scroll" onScroll={onScroll}>
            <header className="home-header" style={{ backgroundImage: HEADER_GRADIENT }}>
              <HomeStatusBar />
              <MarketplaceSwitcher collapsed={switcherCollapsed} />
              <div className={`home-locationwrap${switcherCollapsed ? ' is-collapsed' : ''}`} aria-hidden={switcherCollapsed}>
                <LocationBar label={ADDRESS.label} line={ADDRESS.line} />
              </div>
              <div className="home-searchrow">
                <SearchBar onClick={openListing} />
              </div>
            </header>

            <TabLayout
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenProduct={openProduct}
              onOpenListing={openListing}
            />

            <div className="home-body">
              <BestPicks title="Best picks for you" onOpenProduct={openProduct} />
              <LimitedTimeDealBand onOpenProduct={openProduct} onOpenListing={openListing} />
              <CategoryGrid onOpenListing={openListing} />
              <BestPicks title="Trending products" onOpenProduct={openProduct} />
            </div>
          </div>

          <div className={`home-navshell${navVisible ? '' : ' home-navshell--hidden'}`} aria-hidden={!navVisible}>
            <AppBottomNav />
          </div>
          <div className="home-bar"><span /></div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Header chrome ------------------------------ */
function HomeStatusBar() {
  return (
    <div className="home-statusbar" aria-hidden="true">
      <span className="home-time">9:41</span>
      <img className="home-sb-cellular" src="/home/chrome/cellular.svg" alt="" />
      <img className="home-sb-wifi" src="/home/chrome/wifi.svg" alt="" />
      <span className="home-sb-battery"><span /></span>
      <img className="home-sb-batterycap" src="/home/chrome/battery-cap.svg" alt="" />
    </div>
  )
}

function LocationBar({ label, line }) {
  return (
    <div className="home-location">
      <div className="home-location-info">
        <span className="home-location-top">
          <span className="home-ico home-ico--home"><img src="/home/chrome/home.svg" alt="" /></span>
          <span className="home-location-label">{label} - </span>
        </span>
        <span className="home-location-line">
          <span className="home-location-address">{line}</span>
          <span className="home-ico home-ico--chevron"><img src="/home/chrome/chevron.svg" alt="" /></span>
        </span>
      </div>
      <button className="home-wishlist" type="button" aria-label="Wishlist">
        <img src="/home/chrome/wishlist.svg" alt="" />
      </button>
    </div>
  )
}

function SearchBar({ onClick }) {
  return (
    <button className="home-search" type="button" onClick={onClick}>
      <span className="home-search-main">
        <span className="home-ico home-ico--search"><img src="/home/chrome/search.svg" alt="" /></span>
        <span className="home-search-label">Search for “Maybelline 1014”</span>
      </span>
      <span className="home-search-divider" aria-hidden="true">
        <img src="/home/chrome/divider.svg" alt="" />
      </span>
      <span className="home-ico home-ico--camera"><img src="/home/chrome/camera.svg" alt="" /></span>
    </button>
  )
}

/* --------------------------- Marketplace switcher -------------------------- */
/* The V1 rail from the source: 76px tiles that collapse to 32px pills on scroll.
   Several marks swap artwork rather than just scaling, because the stacked
   lock-ups don't read at 32px. */
function MarketplaceSwitcher({ collapsed }) {
  const cls = (extra = '') => `home-mp-tile${collapsed ? ' is-collapsed' : ''} ${extra}`.trim()

  return (
    <div className={`home-mp${collapsed ? ' is-collapsed' : ''}`} aria-label="Marketplace switcher">
      <div className={cls('home-mp-tile--noon')} aria-label="noon">
        <img className="home-mp-noon" src="/home/switcher/noon.svg" alt="noon" />
      </div>

      <div className={cls()} aria-label="supermall">
        {/* Collapsed, "super" and "mall" sit on one line — but "super" carries a
            'p' descender, so its box bottom is ~3px below its baseline. Nudged
            down so the "r" and "m" share a baseline. */}
        <span className={`home-mp-supermall${collapsed ? ' is-collapsed' : ''}`}>
          <img className="home-mp-super" src="/home/switcher/super.svg" alt="" />
          <img className="home-mp-mall" src="/home/switcher/mall.svg" alt="supermall" />
        </span>
      </div>

      <div className={cls()} aria-label="noon Food">
        {collapsed ? (
          <img className="home-mp-food--sm" src="/home/switcher/food.svg" alt="noon Food" />
        ) : (
          <span className="home-mp-food">
            <img src="/home/switcher/noon.svg" alt="" />
            <img src="/home/switcher/food.svg" alt="noon Food" />
          </span>
        )}
      </div>

      <div className={cls()} aria-label="15 Minutes">
        <img
          className={collapsed ? 'home-mp-minutes--sm' : 'home-mp-minutes'}
          src={collapsed ? '/home/switcher/minutes-word.svg' : '/home/switcher/minutes-15.svg'}
          alt="15 Minutes"
        />
      </div>

      <div className={cls()} aria-label="now now">
        <img
          className={collapsed ? 'home-mp-nownow--sm' : 'home-mp-nownow'}
          src={collapsed ? '/home/switcher/nownow-compact.png' : '/home/switcher/nownow.svg'}
          alt="now now"
        />
      </div>

      <div className={cls()} aria-label="Namshi">
        {collapsed ? (
          <span className="home-mp-word">Namshi</span>
        ) : (
          <span className="home-mp-stack">
            <img className="home-mp-namshi" src="/home/switcher/namshi.png" alt="" />
            <span className="home-mp-word">Namshi</span>
          </span>
        )}
      </div>

      <div className={cls()} aria-label="Pay">
        {collapsed ? (
          <span className="home-mp-word home-mp-word--pay">Pay</span>
        ) : (
          <span className="home-mp-stack">
            <span className="home-mp-pay">
              <img className="home-mp-pay-a" src="/home/switcher/pay-send.svg" alt="" />
              <img className="home-mp-pay-b" src="/home/switcher/pay-send-reverse.svg" alt="" />
            </span>
            <span className="home-mp-word">Pay</span>
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- Best picks for you --------------------------- */
const BEST_PICKS = [
  {
    id: 'airpods-pro-2',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    image: '/home/picks/airpods.png',
    imageSize: 122,
    rating: '4.3',
    price: '899',
    originalPrice: '1399',
    discount: '33%',
    delivery: 'Free Delivery',
    bestSeller: true,
    badge: '/home/picks/express-today.svg',
    badgeAlt: 'express Today',
  },
  {
    id: 'whirlpool-magic-clean',
    title: 'Whirlpool 7 kg Magic Clean',
    image: '/home/picks/washer.png',
    imageSize: 142,
    rating: '4.3',
    price: '899',
    originalPrice: '1399',
    discount: '33%',
    delivery: 'Free Delivery',
    ad: true,
    badge: '/home/picks/express.svg',
    badgeAlt: 'express',
  },
  {
    id: 'maynos-phone-mount',
    title: 'MAYNOS Suction Phone Case Mount',
    image: '/home/picks/phone-mount.png',
    imageSize: 122,
    rating: '4.3',
    price: '899',
    originalPrice: '1399',
    discount: '33%',
    delivery: 'Free Delivery',
    badge: '/home/picks/express-today-alt.svg',
    badgeAlt: 'express Today',
    alternateHeart: true,
  },
]

function CompactCard({ product, onClick }) {
  return (
    <article className="home-pick" onClick={onClick}>
      <div className="home-pick-media">
        <img
          className="home-pick-img"
          src={product.image}
          alt={product.title}
          style={{ width: product.imageSize, height: product.imageSize }}
        />
        <button className="home-pick-wish" type="button" aria-label={`Add ${product.title} to wishlist`} onClick={(e) => e.stopPropagation()}>
          <img src={product.alternateHeart ? '/home/picks/heart-alt.svg' : '/home/picks/heart.svg'} alt="" aria-hidden="true" />
        </button>
        <button className="home-pick-atc" type="button" aria-label={`Add ${product.title} to cart`} onClick={(e) => e.stopPropagation()}>
          <img src="/home/picks/plus.svg" alt="" aria-hidden="true" />
        </button>
        {product.bestSeller && <span className="home-pick-bestseller">Best Seller</span>}
        {product.ad && <span className="home-pick-ad">Ad</span>}
      </div>

      <div className="home-pick-body">
        <h3 className="home-pick-title">{product.title}</h3>
        <span className="home-pick-rating">
          <img src="/home/picks/rating-star.svg" alt="" aria-hidden="true" />
          {product.rating}
        </span>
        <span className="home-pick-price">
          <b><Dh />{product.price}</b>
          <s>{product.originalPrice}</s>
          <i>{product.discount}</i>
        </span>
        <span className="home-pick-delivery">
          <img src="/home/picks/truck.svg" alt="" aria-hidden="true" />
          {product.delivery}
        </span>
        <img className="home-pick-badge" src={product.badge} alt={product.badgeAlt} />
      </div>
    </article>
  )
}

/* Titled rail of compact product cards. Rendered twice — as "Best picks for you"
   above the deal band and as "Trending products" below the category grid — so the
   heading is a prop rather than baked in. */
function BestPicks({ title, onOpenProduct }) {
  return (
    <section className="home-section">
      <h2 className="home-section-title">{title}</h2>
      <div className="home-rail">
        <div className="home-rail-row">
          {BEST_PICKS.map((product) => (
            <CompactCard key={product.id} product={product} onClick={onOpenProduct} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- Limited time deal ---------------------------- */
/* Figma "PDP new features" 23063:119711. A full-bleed orange band — two soft
   blobs behind a rail of 160px deal cards. Three price/footer treatments, which
   is the point of the widget: a running deal, one that hasn't opened yet, and a
   plain discount. Cards open the PDP; the band itself opens the listing. */
const HP_DEALS = [
  {
    id: 'airpods-live',
    image: '/home/hpdeal/airpods.png',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    bestSeller: true,
    price: '849', save: '50',
    was: '899', wasLabel: 'Before deal',
    footer: { kind: 'live', label: 'Deal ends in', time: '02: 40: 32' },
  },
  {
    id: 'sneaker-upcoming',
    image: '/home/hpdeal/sneaker.png',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    price: '899', priceDark: true, listed: '1699', off: '33%',
    dealPrice: '849',
    footer: { kind: 'locked', label: 'Deal starts in', time: '01: 40: 32' },
  },
  {
    id: 'airpods-live-2',
    image: '/home/hpdeal/airpods.png',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    bestSeller: true,
    price: '849', save: '50',
    was: '899', wasLabel: 'Before deal',
    footer: { kind: 'live', label: 'Deal ends in', time: '02: 40: 32' },
  },
  {
    id: 'airpods-off',
    image: '/home/hpdeal/airpods.png',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    price: '849', off: '60% OFF',
    secondary: '899', listed: '1699',
    footer: { kind: 'live', label: 'Ends in', time: '02: 40: 32' },
  },
  {
    id: 'sneaker-off',
    image: '/home/hpdeal/sneaker.png',
    title: 'Nike sneakers white shoes with comfortable soles',
    price: '849', off: '60% OFF',
    secondary: '899', listed: '1699',
    footer: { kind: 'live', label: 'Ends in', time: '02: 40: 32' },
  },
]

function HpDealCard({ deal, onClick }) {
  return (
    <article className="home-hpd-card" onClick={onClick}>
      <div className="home-hpd-media">
        <span className="home-hpd-plate">
          <img src={deal.image} alt={deal.title} />
        </span>
        {deal.bestSeller && <span className="home-hpd-tag">Best Seller</span>}
        <button className="home-hpd-atc" type="button" aria-label={`Add ${deal.title} to cart`} onClick={(e) => e.stopPropagation()}>
          <img src="/home/hpdeal/plus.svg" alt="" aria-hidden="true" />
        </button>
      </div>

      <div className="home-hpd-body">
        <h3 className="home-hpd-title">{deal.title}</h3>

        <span className="home-hpd-pricerow">
          <b className={deal.priceDark ? 'is-dark' : ''}><Dh />{deal.price}</b>
          {deal.listed && !deal.secondary && <s><Dh />{deal.listed}</s>}
          {deal.save && <i>Save <Dh />{deal.save}</i>}
          {deal.off && <i>{deal.off}</i>}
        </span>

        {/* Second line differs per treatment: a struck pre-deal price, the deal
            price still to come, or the regular price above the listed one. */}
        {deal.was && (
          <span className="home-hpd-sub"><s><Dh />{deal.was}</s> {deal.wasLabel}</span>
        )}
        {deal.dealPrice && (
          <span className="home-hpd-sub home-hpd-sub--deal"><b><Dh />{deal.dealPrice}</b> Deal price</span>
        )}
        {deal.secondary && (
          <span className="home-hpd-sub"><em><Dh />{deal.secondary}</em> <s><Dh />{deal.listed}</s></span>
        )}
      </div>

      <div className={`home-hpd-foot home-hpd-foot--${deal.footer.kind}`}>
        {deal.footer.kind === 'locked'
          ? <img className="home-hpd-foot-ico" src="/home/hpdeal/lock.svg" alt="" aria-hidden="true" />
          : <img className="home-hpd-foot-ico" src="/home/hpdeal/timelapse.svg" alt="" aria-hidden="true" />}
        {deal.footer.label} <b>{deal.footer.time}</b>
      </div>
    </article>
  )
}

function LimitedTimeDealBand({ onOpenProduct, onOpenListing }) {
  return (
    <section className="home-hpd" onClick={onOpenListing}>
      <img className="home-hpd-blob home-hpd-blob--l" src="/home/hpdeal/blob-left.svg" alt="" aria-hidden="true" />
      <img className="home-hpd-blob home-hpd-blob--r" src="/home/hpdeal/blob-right.svg" alt="" aria-hidden="true" />

      <div className="home-hpd-head">
        <div className="home-hpd-heading">
          <h2>Limited time deal</h2>
          <p>Enjoy extra 30% off with no min. spend.</p>
        </div>
        <span className="home-hpd-more" aria-hidden="true">
          <img src="/home/hpdeal/chevron.svg" alt="" />
        </span>
      </div>

      <div className="home-hpd-rail">
        <div className="home-hpd-rail-row">
          {HP_DEALS.map((deal) => (
            <HpDealCard key={deal.id} deal={deal} onClick={(e) => { e.stopPropagation(); onOpenProduct() }} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- Shop by category ---------------------------- */
/* Each tile is a 92px background plate with one or two pieces of art absolutely
   placed on top — the offsets are Figma's, not derivable, so they're data. */
const CATEGORY_ART = {
  beauty: [
    { src: 'beauty-left.png', left: 3, top: 18, w: 66, h: 66, shadow: 'soft' },
    { src: 'beauty-right.png', left: 37, top: 28, w: 53, h: 53, shadow: 'side' },
  ],
  'beauty-alt': [
    { src: 'beauty-left.png', left: 2, top: 12, w: 66, h: 66, shadow: 'soft' },
    { src: 'beauty-right.png', left: 36, top: 24, w: 53, h: 53, shadow: 'side' },
  ],
  grocery: [
    { src: 'grocery-left.png', left: -10, top: 25, w: 71, h: 71, rotate: -17.5, shadow: 'soft' },
    { src: 'grocery-center.png', left: 34, top: 13, w: 26, h: 76, fit: 'cover' },
    { src: 'grocery-right.png', left: 36, top: 25, w: 67, h: 68, shadow: 'side' },
  ],
  'grocery-alt': [
    { src: 'grocery-left.png', left: -7, top: 14, w: 74, h: 74, rotate: -8.3, shadow: 'soft' },
    { src: 'grocery-right.png', left: 8, top: 0, w: 91, h: 91, shadow: 'side' },
  ],
  appliances: [
    { src: 'appliance-left.png', left: -16, top: 2, w: 99, h: 99 },
    { src: 'appliance-right.png', left: 34, top: 8, w: 74, h: 84 },
  ],
  toys: [
    { src: 'toys-left.png', left: -4, top: 12, w: 71, h: 71 },
    { src: 'toys-right.png', left: 50, top: 28, w: 33, h: 53 },
  ],
  electronics: [
    { src: 'electronics-left.png', left: 0, top: 4, w: 74, h: 82 },
    { src: 'electronics-right.png', left: 33, top: 25, w: 54, h: 54 },
  ],
  hair: [
    { src: 'hair-left.png', left: -6, top: 7, w: 83, h: 77 },
    { src: 'hair-right.png', left: 29, top: 5, w: 69, h: 84 },
  ],
  fashion: [
    { src: 'fashion-left.png', left: -5, top: -1, w: 81, h: 75 },
    { src: 'fashion-right.png', left: 20, top: 6, w: 81, h: 81, rotate: -90 },
  ],
}

const CATEGORY_ROWS = [
  [
    { id: 'beauty-sale', label: 'Beauty & Skin Care', art: 'beauty', bg: 'bg-sale.svg', sale: true },
    { id: 'grocery', label: 'Grocery & Kitchen', art: 'grocery', bg: 'bg.svg' },
    { id: 'appliances', label: 'Home Appliances', art: 'appliances', bg: 'bg-appliances.svg' },
    { id: 'beauty', label: 'Beauty & Skin Care', art: 'beauty-alt', bg: 'bg.svg' },
    { id: 'grocery-repeat', label: 'Grocery & Kitchen', art: 'grocery-alt', bg: 'bg.svg' },
  ],
  [
    { id: 'toys', label: 'Toys & Games', art: 'toys', bg: 'bg.svg' },
    { id: 'electronics', label: 'Electronics & Tools', art: 'electronics', bg: 'bg.svg' },
    { id: 'hair', label: 'Hair Care', art: 'hair', bg: 'bg.svg' },
    { id: 'fashion', label: 'Shoes & Clothes', art: 'fashion', bg: 'bg.svg' },
    { id: 'toys-repeat', label: 'Toys & Games', art: 'toys', bg: 'bg.svg' },
  ],
]

function CategoryGrid({ onOpenListing }) {
  return (
    <section className="home-section home-section--categories">
      <h2 className="home-section-title">Shop by category</h2>
      <div className="home-rail">
        <div className="home-catgrid">
          {CATEGORY_ROWS.map((row, index) => (
            <div className="home-catrow" key={index}>
              {row.map((item) => (
                <button className="home-cat" type="button" key={item.id} onClick={onOpenListing}>
                  <img className="home-cat-bg" src={`/home/category/${item.bg}`} alt="" />
                  {item.sale && <span className="home-cat-sale">SALE</span>}
                  {CATEGORY_ART[item.art].map((art, i) => (
                    <img
                      key={i}
                      className={`home-cat-art${art.shadow ? ` home-cat-art--${art.shadow}` : ''}`}
                      src={`/home/category/${art.src}`}
                      alt=""
                      style={{
                        left: art.left,
                        top: art.top,
                        width: art.w,
                        height: art.h,
                        objectFit: art.fit ?? 'contain',
                        transform: art.rotate ? `rotate(${art.rotate}deg)` : undefined,
                      }}
                    />
                  ))}
                  <span className="home-cat-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- Tab layout ------------------------------- */
function TabLayout({ activeTab, onTabChange, onOpenProduct, onOpenListing }) {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab))

  return (
    <section className="home-tabs" style={{ backgroundImage: LAYOUT_GRADIENT }}>
      <div className="home-tabnav" role="tablist" aria-label="Shop departments">
        <div className="home-tabnav-row">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const icon = isActive && ACTIVE_ICONS.has(tab.icon)
              ? `/home/tabs/${tab.icon}-active.svg`
              : `/home/tabs/${tab.icon}.svg`

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className="home-tab"
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="home-tabpanel"
                onClick={() => onTabChange(tab.id)}
              >
                {tab.isNew && <span className="home-tab-new" aria-hidden="true">NEW</span>}
                <span className="home-tab-inner">
                  <span className="home-tab-ico">
                    <img src={icon} alt="" aria-hidden="true" style={{ width: tab.size, height: tab.size }} />
                  </span>
                  <span className={`home-tab-label${isActive ? ' is-active' : ''}`}>{tab.label}</span>
                </span>
              </button>
            )
          })}

          {/* One indicator for the whole rail, so it slides between tabs rather
              than unmounting and remounting per button. */}
          <motion.span
            className="home-tab-indicator"
            aria-hidden="true"
            initial={false}
            animate={{ x: activeIndex * TAB_W }}
            transition={CONTROL}
          />
        </div>
      </div>

      <div className="home-tabpanel" id="home-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {/* Absolute layers so outgoing and incoming panels cross-fade instead of
            pushing each other around. */}
        <AnimatePresence initial={false}>
          <motion.div
            className="home-tabpanel-layer"
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            <AllCmsContent onOpenProduct={onOpenProduct} onOpenListing={onOpenListing} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

// Only these ship a second, filled-in version for the selected state.
const ACTIVE_ICONS = new Set(['all', 'electronics', 'grocery', 'beauty', 'fashion'])

/* ----------------------------- All tab content ----------------------------- */
/* The sponsored CMS carousel: a video hero followed by three brand widgets. */
const WHOOP_PRODUCTS = [
  { id: 'black', image: '/home/all-cms/whoop-black.png', badge: 'Flash Deal' },
  { id: 'grey', image: '/home/all-cms/whoop-grey.png', badge: 'Flash Deal' },
  { id: 'blue', image: '/home/all-cms/whoop-blue.png', badge: 'Selling fast' },
  { id: 'silver', image: '/home/all-cms/whoop-silver.png', badge: 'Selling fast' },
]

const NIKE_PRODUCTS = [
  {
    id: 'revolution',
    image: '/home/all-cms/nike-revolution.png',
    badge: 'Eid offer',
    title: 'NIKE REVOLUTION 8 EASYON',
    price: '129',
    originalPrice: '299',
  },
  {
    id: 'downshifter',
    image: '/home/all-cms/nike-downshifter.png',
    badge: 'Eid offer',
    title: 'NIKE DOWNSHIFTER 14',
    price: '129',
    originalPrice: '299',
  },
]

const AJMAL_PRODUCTS = [
  { id: 'ajmal-oud', image: '/home/all-cms/ajmal-oud.png', badge: 'Flash Deal' },
  { id: 'ajmal-leather-noir', image: '/home/all-cms/ajmal-leather-noir.png', badge: 'Flash Deal' },
  { id: 'ajmal-silver-shade', image: '/home/all-cms/ajmal-silver-shade.png', badge: 'Flash Deal' },
  { id: 'ajmal-yearn', image: '/home/all-cms/ajmal-yearn.png', badge: 'Flash Deal' },
]

function AdTag({ className = '' }) {
  return <span className={`home-adtag ${className}`}>Ad</span>
}

function PromoTile({ product, badgeColor, fit = 'cover', showDetails, onClick }) {
  return (
    <button
      className="home-promo"
      type="button"
      aria-label={product.title ?? product.badge}
      onClick={onClick}
    >
      <span className="home-promo-media">
        <img src={product.image} alt="" aria-hidden="true" style={{ objectFit: fit }} />
        <span className="home-promo-badge" style={{ backgroundColor: badgeColor }}>{product.badge}</span>
      </span>

      {showDetails && (
        <span className="home-promo-meta">
          <span className="home-promo-title">{product.title}</span>
          <span className="home-promo-price">
            <b><Dh />{product.price}</b>
            <s>{product.originalPrice}</s>
          </span>
        </span>
      )}
    </button>
  )
}

/* Deal widget — Figma "PDP new features" 22921:360504. Leads the All rail: an
   orange-tinted CMS card counting down to the deal's close over a 2 × 2 of
   discounted products. Tapping a product opens its PDP; tapping anywhere else
   on the widget opens the listing. */
const DEAL_WIDGET_PRODUCTS = [
  { id: 'shoe-1', image: '/home/deal/shoe-1.png' },
  { id: 'shoe-2', image: '/home/deal/shoe-2.png' },
  { id: 'shoe-3', image: '/home/deal/shoe-3.png' },
  { id: 'shoe-4', image: '/home/deal/shoe-2.png' },
]

function DealWidget({ onOpenProduct, onOpenListing }) {
  return (
    <article className="home-deal" onClick={onOpenListing}>
      <div className="home-deal-head">
        <span className="home-deal-timer">
          <span className="home-ico home-ico--timelapse"><img src="/home/deal/timelapse.svg" alt="" /></span>
          {/* The colons are lighter than the digits in the design, so they're
              their own spans rather than part of the string. */}
          <span className="home-deal-countdown">
            Deal ends in 02<i>:</i>40<i>:</i>32
          </span>
        </span>
        <span className="home-deal-more" aria-hidden="true">
          <img src="/home/deal/chevron.svg" alt="" />
        </span>
      </div>

      <div className="home-deal-grid">
        {DEAL_WIDGET_PRODUCTS.map((product) => (
          <button
            className="home-deal-card"
            type="button"
            key={product.id}
            aria-label="Limited Deal — Ð129, was Ð299"
            onClick={(event) => { event.stopPropagation(); onOpenProduct() }}
          >
            <span className="home-deal-media">
              <img src={product.image} alt="" aria-hidden="true" />
              <span className="home-deal-notch">Limited Deal</span>
            </span>
            <span className="home-deal-price">
              <b><Dh />129</b>
              <s>299</s>
            </span>
          </button>
        ))}
      </div>
    </article>
  )
}

function AllCmsContent({ onOpenProduct, onOpenListing }) {
  return (
    <div className="home-cms">
      <div className="home-cms-rail">
        <DealWidget onOpenProduct={onOpenProduct} onOpenListing={onOpenListing} />

        <article className="home-cms-card home-cms-card--hero">
          <img className="home-cms-hero-img" src="/home/all-cms/nike-hero.png" alt="Nike Eid offer" />
          <AdTag className="home-adtag--hero" />
          <button className="home-cms-pause" type="button" aria-label="Pause sponsored video">
            <img src="/home/all-cms/pause.svg" alt="" aria-hidden="true" />
          </button>
        </article>

        <article className="home-cms-card">
          <div className="home-cms-banner home-cms-banner--whoop">
            <img src="/home/all-cms/whoop-banner-overlay.png" alt="WHOOP — Add more life to your years" />
          </div>
          <div className="home-cms-grid">
            {WHOOP_PRODUCTS.map((product) => (
              <PromoTile key={product.id} product={product} badgeColor="#A5622B" onClick={onOpenListing} />
            ))}
          </div>
        </article>

        <article className="home-cms-card">
          <div className="home-cms-banner home-cms-banner--nike">
            <img src="/home/all-cms/nike-banner.png" alt="Nike Eid collection" />
          </div>
          <div className="home-cms-grid home-cms-grid--pair">
            {NIKE_PRODUCTS.map((product) => (
              <PromoTile key={product.id} product={product} badgeColor="#0580AB" showDetails onClick={onOpenListing} />
            ))}
          </div>
          <AdTag className="home-adtag--card" />
        </article>

        <article className="home-cms-card home-cms-card--ajmal">
          <div className="home-cms-banner home-cms-banner--ajmal">
            <img src="/home/all-cms/ajmal-banner.png" alt="Ajmal perfumes" />
          </div>
          <div className="home-cms-grid">
            {AJMAL_PRODUCTS.map((product) => (
              <PromoTile key={product.id} product={product} badgeColor="#D92626" fit="contain" onClick={onOpenListing} />
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
