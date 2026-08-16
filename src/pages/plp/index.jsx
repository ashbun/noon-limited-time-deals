import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../../components/AppBottomNav'
import { formatCountdown, useLimitedTimeDeal } from '../pdp/LimitedTimeDeal'
import './styles.css'

// Product listing — Figma "PDP new features" 23044:77826, cards 23044:78434.
//
// Cards come in two deal states, matching the two variants in the design:
//   locked    — deal not open yet. Normal price sits on top; the tinted block
//               below teases the DEAL price and counts down to the unlock.
//   activated — deal running. The tinted block takes over the price entirely:
//               the deal price in orange, the saving, the pre-deal price struck
//               through, and a countdown to the close.
// Tapping a card opens the PDP in the matching state.

/* Noontree dirham (AED) glyph — private-use codepoint U+E001. Written as an
   escape rather than the literal character, which does not survive every editor. */
const DH = '\uE001'
function Dh() {
  return <span className="dh" aria-label="AED">{DH}</span>
}

const PRODUCTS = [
  {
    id: 'airpods-locked',
    deal: 'locked',
    img: '/plp/product-shoerack.png',
    fit: 'cover',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    rating: '4.3',
    reviews: '(128)',
    tag: 'Best Seller',
    ad: true,
    price: 350,
    was: 1399,
    off: '40%',
    dealPrice: 301,
  },
  {
    id: 'airpods-live',
    deal: 'activated',
    img: '/plp/product-airpods.png',
    fit: 'contain',
    title: 'Apple Airpods Pro 2 Wireless Earbuds',
    rating: '4.3',
    reviews: '(128)',
    tag: 'Best Seller',
    ad: true,
    dealPrice: 849,
    save: 49,
    beforeDeal: 899,
  },
]

// The grid repeats the pair so the listing scrolls like a real one; the extra
// rows reuse the same two cards rather than inventing products.
const GRID = [...PRODUCTS, ...PRODUCTS.map((p) => ({ ...p, id: `${p.id}-2` }))]

const CHIPS = [
  { label: 'Filter', icon: '/plp/icons/filter.svg' },
  { label: 'Sort', chevron: true },
  { label: 'Price', chevron: true },
  { label: 'Cases & Covers' },
  { label: 'Accessories' },
]

export default function PlpPage() {
  return (
    <div className="stage">
      <div className="phone">
        <div className="plp">
          <PlpHeader />
          <div className="plp-scroll">
            <div className="plp-grid">
              {GRID.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
          <AppBottomNav />
          <div className="home-bar"><span /></div>
        </div>
      </div>
    </div>
  )
}

function PlpHeader() {
  return (
    <div className="plp-header">
      <div className="plp-statusbar">
        <span className="plp-time">9:41</span>
        <span className="plp-status-icons" aria-hidden="true">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="none"><rect x="0" y="7" width="3" height="4" rx="1" fill="#000"/><rect x="4.5" y="5" width="3" height="6" rx="1" fill="#000"/><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="#000"/><rect x="13.5" y="0" width="3" height="11" rx="1" fill="#000"/></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M8 10.2 6 8.2a2.8 2.8 0 0 1 4 0l-2 2Zm-4-4a6.5 6.5 0 0 1 8 0l-1.4 1.4a4.5 4.5 0 0 0-5.2 0L4 6.2ZM1.2 3.4a10.4 10.4 0 0 1 13.6 0l-1.4 1.4a8.4 8.4 0 0 0-10.8 0L1.2 3.4Z" fill="#000"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="2.7" stroke="#000" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="8" rx="1.3" fill="#000"/><path d="M23 4v4a2 2 0 0 0 0-4Z" fill="#000" fillOpacity="0.4"/></svg>
        </span>
      </div>

      <div className="plp-searchrow">
        <div className="plp-search">
          <span className="plp-ico plp-ico--18"><img src="/plp/icons/back.svg" alt="" /></span>
          <span className="plp-search-label">Search</span>
          <span className="plp-search-divider" aria-hidden="true" />
          <span className="plp-ico plp-ico--20"><img src="/plp/icons/camera.svg" alt="" /></span>
        </div>
      </div>

      <div className="plp-chips">
        {CHIPS.map(({ label, icon, chevron }) => (
          <button className="plp-chip" type="button" key={label}>
            {icon && <span className="plp-ico plp-ico--16"><img src={icon} alt="" /></span>}
            {label}
            {chevron && <span className="plp-ico plp-ico--20"><img src="/plp/icons/chevron-down.svg" alt="" /></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const navigate = useNavigate()
  const deal = useLimitedTimeDeal()
  const activated = product.deal === 'activated'
  // The card's own state decides which PDP you land on, so a locked card opens
  // the locked PDP even while another card on screen shows a running deal.
  const open = () => navigate(`/pdp?deal=${activated ? 'live' : 'upcoming'}`)

  return (
    <article className="pc" onClick={open}>
      <div className="pc-media">
        <img className={`pc-img pc-img--${product.fit}`} src={product.img} alt="" />
        {product.tag && <span className="pc-tag">{product.tag}</span>}
        <button className="pc-wish" type="button" aria-label="Add to wishlist" onClick={(e) => e.stopPropagation()}>
          <span className="plp-ico plp-ico--16"><img src="/plp/icons/heart.svg" alt="" /></span>
        </button>
        {product.ad && <span className="pc-ad">Ad</span>}
        <span className="pc-dots" aria-hidden="true">
          <i className="on" /><i /><i className="sm" /><i className="xs" />
        </span>
        <button className="pc-atc" type="button" aria-label="Add to cart" onClick={(e) => e.stopPropagation()}>
          <span className="plp-ico plp-ico--24"><img src="/plp/icons/plus.svg" alt="" /></span>
        </button>
      </div>

      <div className="pc-dealstrip">Limited time deal</div>

      <div className="pc-body">
        <h3 className="pc-title">{product.title}</h3>
        <span className="pc-rating">
          <span className="plp-ico plp-ico--star"><img src="/plp/icons/star.svg" alt="" /></span>
          <b>{product.rating}</b> <span>{product.reviews}</span>
        </span>

        {activated ? (
          <div className="pc-deal pc-deal--live">
            <div className="pc-deal-row">
              <span className="pc-deal-price"><Dh />{product.dealPrice}</span>
              <span className="pc-save">Save <Dh />{product.save}</span>
            </div>
            <div className="pc-before"><s><Dh />{product.beforeDeal}</s> Before deal</div>
            <div className="pc-timer">
              <span className="plp-ico plp-ico--12"><img src="/plp/icons/timelapse.svg" alt="" /></span>
              Deal ends in <b>{formatCountdown(deal.remaining)}</b>
            </div>
          </div>
        ) : (
          <>
            <div className="pc-price">
              <span className="pc-now"><Dh />{product.price}</span>
              <span className="pc-was">{product.was}</span>
              <span className="pc-off">{product.off}</span>
            </div>
            <div className="pc-deal">
              <div className="pc-deal-row">
                <span className="pc-deal-price"><Dh />{product.dealPrice}</span>
                <span className="pc-deal-label">Deal price</span>
              </div>
              <div className="pc-timer">
                <span className="plp-ico plp-ico--12"><img src="/plp/icons/lock.svg" alt="" /></span>
                Unlocks in <b>{formatCountdown(deal.remaining)}</b>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}
