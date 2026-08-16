import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import LimitedTimeDeal, { DealSwitcher, formatCountdown, useLimitedTimeDeal } from './LimitedTimeDeal'
import AppBottomNav from '../../components/AppBottomNav'
import './styles.css'

// Product page, ported from ashbun/noon-pdp-prototype and trimmed to the PDP
// view alone — the cart sheet, checkout, payment and PLP screens that shipped
// with it were removed. Assets live in /public/pdp; the design tokens and the
// phone frame come from src/index.css.

const MOTION = { type: 'tween', ease: 'linear', duration: 0.18 }

/* Noontree dirham (AED) glyph — private-use codepoint U+E001 */
const DH = ''
function Dh() {
  return <span className="dh" aria-label="AED">{DH}</span>
}

export default function PdpPage() {
  return (
    <div className="stage">
      <div className="phone">
        <PDP />
      </div>
    </div>
  )
}

function TouchPoints() {
  return (
    <button className="touch-points" type="button" aria-label="Touch points">
      <img src="/pdp/icons/touch-points.svg" alt="" width="24" height="27" />
    </button>
  )
}

function NotifyToast({ onDismiss }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="notify-toast"
      data-testid="notify-toast"
      role="status"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="notify-toast-icon" aria-hidden="true">
        <img src="/pdp/icons/notify-toast-bell.svg" alt="" />
      </span>
      <span className="notify-toast-message">You'll be notified when the deal unlocks</span>
      <button className="notify-toast-close" type="button" aria-label="Close notification" onClick={onDismiss}>
        <img src="/pdp/icons/notify-toast-close.svg" alt="" />
      </button>
    </motion.div>
  )
}

function PDP() {
  // Scroll-linked gallery: the product image shrinks as the page scrolls,
  // so the content sliding over the pinned gallery feels more interactive.
  const scrollRef = useRef(null)
  const deal = useLimitedTimeDeal()
  const [showBottomDeal, setShowBottomDeal] = useState(false)
  const [notified, setNotified] = useState(false)
  const [showNotifyToast, setShowNotifyToast] = useState(false)
  const notifyTimerRef = useRef(null)
  const { scrollY } = useScroll({ container: scrollRef })
  const imgScale = useTransform(scrollY, [0, 320], [1, 0.7], { clamp: true })
  const imgOpacity = useTransform(scrollY, [0, 260, 400], [1, 1, 0.35], { clamp: true })

  const dismissNotifyToast = () => {
    window.clearTimeout(notifyTimerRef.current)
    notifyTimerRef.current = null
    setShowNotifyToast(false)
  }

  const requestDealNotification = () => {
    if (notified) return
    setNotified(true)
    setShowNotifyToast(true)
    window.clearTimeout(notifyTimerRef.current)
    notifyTimerRef.current = window.setTimeout(() => {
      setShowNotifyToast(false)
      notifyTimerRef.current = null
    }, 4000)
  }

  useEffect(() => () => window.clearTimeout(notifyTimerRef.current), [])

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return undefined

    let frame = 0
    const updateBottomDeal = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const widget = scroller.querySelector('.ltd')
        if (!widget || deal.state === 'ended') {
          setShowBottomDeal(false)
          return
        }

        const scrollTop = scroller.getBoundingClientRect().top
        const widgetBottom = widget.getBoundingClientRect().bottom
        setShowBottomDeal(widgetBottom <= scrollTop)
      })
    }

    updateBottomDeal()
    scroller.addEventListener('scroll', updateBottomDeal, { passive: true })
    window.addEventListener('resize', updateBottomDeal)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', updateBottomDeal)
      window.removeEventListener('resize', updateBottomDeal)
    }
  }, [deal.state])

  return (
    <div className="pdp">
      <AnimatePresence>
        {showNotifyToast && <NotifyToast onDismiss={dismissNotifyToast} />}
      </AnimatePresence>
      <StatusBar />
      <div className="pdp-scroll" ref={scrollRef}>
        <Gallery imgScale={imgScale} imgOpacity={imgOpacity} />
        <div className="pdp-sections">
          <MainInfo deal={deal} notified={notified} onNotify={requestDealNotification} />
          <Delivery />
          <PaymentOffers />
          <VariantPicker />
          <Trustmarkers />
          <ProductDetails />
          <AdditionalInfo />
          <SellerWidget />
          <Reviews />
        </div>
      </div>
      <BottomNav
        deal={deal}
        showDeal={showBottomDeal}
        notified={notified}
        onNotify={requestDealNotification}
      />
    </div>
  )
}

/* -------------------------------- Bottom nav ------------------------------- */
/* Both CTAs are inert — the cart sheet and checkout flow they used to open
   were dropped when this was trimmed to the PDP view alone. */
function BottomDeal({ deal, notified, onNotify }) {
  const live = deal.state === 'live'

  return (
    <div className={`bottom-deal${live ? ' bottom-deal--live' : ''}`}>
      <div className="bottom-deal-left">
        <img
          className="bottom-deal-ribbon"
          src={live
            ? '/pdp/icons/deal-sticky-active-ribbon.svg'
            : '/pdp/icons/deal-sticky-inactive-ribbon.svg'}
          alt=""
        />
        <span className="bottom-deal-left-content">
          <span className="bottom-deal-icon">
            <img
              src={live ? '/pdp/icons/deal-sticky-bolt.svg' : '/pdp/icons/deal-sticky-lock.svg'}
              alt=""
            />
          </span>
          <span className="bottom-deal-label">
            {live ? (
              'Limited time deal'
            ) : (
              <>Deal unlocks in <b>{formatCountdown(deal.remaining)}</b></>
            )}
          </span>
        </span>
      </div>

      <div className="bottom-deal-right">
        {live ? (
          <span className="bottom-deal-ending">
            <span className="bottom-deal-icon">
              <img src="/pdp/icons/deal-sticky-timelapse.svg" alt="" />
            </span>
            <span>Ending in <b>{formatCountdown(deal.remaining)}</b></span>
          </span>
        ) : (
          <button
            className={`bottom-deal-notify${notified ? ' bottom-deal-notify--notified' : ''}`}
            type="button"
            data-testid="bottom-strip-notify"
            disabled={notified}
            onClick={onNotify}
          >
            <span className="bottom-deal-icon bottom-deal-icon--18">
              <img
                src={notified
                  ? '/pdp/icons/deal-sticky-notified.svg'
                  : '/pdp/icons/deal-sticky-bell.svg'}
                alt=""
              />
            </span>
            {notified ? 'Notified' : 'Notify me'}
          </button>
        )}
      </div>
    </div>
  )
}

function BottomNav({ deal, showDeal, notified, onNotify }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="pdp-bottomnav">
      <TouchPoints />
      <AnimatePresence initial={false}>
        {showDeal && deal.state !== 'ended' && (
          <motion.div
            className="bottom-deal-reveal"
            initial={reduceMotion ? false : { height: 0 }}
            animate={{ height: 32 }}
            exit={reduceMotion
              ? { height: 0 }
              : {
                  height: 0,
                  transition: { duration: 0.36, ease: [0.4, 0, 1, 1] },
                }}
            transition={reduceMotion
              ? { duration: 0 }
              : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <BottomDeal deal={deal} notified={notified} onNotify={onNotify} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pdp-bottomnav-row">
        <div className="qty-box">
          <span className="qty-label">QTY</span>
          <span className="qty-val">1</span>
        </div>
        <button className="cta buy-now">Buy now</button>
        <button className="cta add-cart">Add to cart</button>
      </div>
      <AppBottomNav />
      <div className="home-bar"><span /></div>
    </div>
  )
}

/* ----------------------------- Status bar + header ----------------------------- */
/* Shared top navigation. state 1: back + search(icon) + wishlist + share.
   state 2: back + search(pill) + share. */
function TopNav({ state = 1, onBack }) {
  const navigate = useNavigate()

  // Pop history when we arrived from the listing, rather than pushing another
  // entry, so the browser's own back button stays coherent. On a deep link into
  // the PDP there is nothing to pop — going back would leave the app — so land
  // on the listing instead. (The listing returns scrolled to the top either
  // way; its scroll lives in an inner container the router doesn't restore.)
  const goBack = onBack ?? (() => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/plp')
  })

  return (
    <div className="tb-nav">
      <button className="tb-btn" onClick={goBack} aria-label="Back">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
      </button>
      <DealSwitcher />
      <div className="tb-actions">
        {state === 2 ? (
          <motion.button
            className="tb-search"
            aria-label="Search"
            initial={{ width: 44 }}
            animate={{ width: 112 }}
            exit={{ width: 44 }}
            transition={{ type: 'tween', ease: [0.22, 0.61, 0.36, 1], duration: 0.32 }}
            style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m20 20-3.5-3.5"/></svg>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>Search</motion.span>
          </motion.button>
        ) : (
          <button className="tb-btn" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.9"/><path stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" d="m20 20-3.5-3.5"/></svg>
          </button>
        )}
        {state === 1 && (
          <button className="tb-btn" aria-label="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="1.9" d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.6 12 20 12 20z"/></svg>
          </button>
        )}
        <button className="tb-btn" aria-label="Share">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" d="M12 3v13M8 7l4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>
        </button>
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="pdp-topbar">
      <TopNav state={1} />
    </div>
  )
}

/* --------------------------------- Gallery --------------------------------- */
function Gallery({ imgScale, imgOpacity }) {
  return (
    <div className="gallery">
      <motion.img
        className="gallery-img"
        style={{ scale: imgScale, opacity: imgOpacity }}
        src="/pdp/anker-charger.png"
        alt="Anker 737 GaN USB-C charger"
      />
      <div className="gallery-dots">
        <span className="dot on" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  )
}

/* -------------------------------- Main info -------------------------------- */
function InfoDot() {
  return <svg width="15" height="15" viewBox="0 0 24 24" className="i-info" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7"/><path fill="currentColor" d="M11 10h2v7h-2zm0-4h2v2h-2z"/></svg>
}

// The two reference states use different comparison prices while sharing the
// same deal price and discount.
const DEAL = { price: '300.99', upcomingWas: '500.99', liveWas: 899, off: 60 }

function UnitDetails() {
  return (
    <div className="unit-row">
      <span>500ml</span>
      <span className="unit-div" />
      <span><Dh />2.35/ml</span>
    </div>
  )
}

function MainInfo({ deal, notified, onNotify }) {
  return (
    <section className="main-info">
      <div className="store-row">
        <span className="store-name">
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden className="i-verified"><path fill="currentColor" d="m12 2 2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 2Z"/><path fill="#fff" d="m10.6 14.6-2-2-1.2 1.2 3.2 3.2 5.8-5.8-1.2-1.2z"/></svg>
          Anker
        </span>
        <button className="store-visit">Visit Store <Chev /></button>
      </div>

      <div className="mi-card">
      <button className="pdp-title">
        <span>USB C Plug, 735 Charger (Nano II 65W), PPS 3-Port Fast Compact USB C Charge&hellip;</span>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="title-chev"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/></svg>
      </button>

      <div className="rating-row">
        <span className="rating">
          <span className="rstar">★</span> 4.3 <span className="rmuted">(126 reviews)</span>
        </span>
        <span className="tag-prepaid">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"/><path stroke="currentColor" strokeWidth="1.8" d="M3 10h18"/></svg>
          Prepaid Only
        </span>
      </div>

      {/* while the deal is live its banner carries the price, so this row would
          otherwise show it twice — the Figma toggles it off for that state */}
      {deal.state !== 'live' && (
        <div className="price-row">
          <span className="price-now"><Dh />109</span>
          <span className="price-was"><Dh />209</span>
          <span className="price-off">47% OFF</span>
          <span className="price-vat">(incl. of VAT)</span>
          <InfoDot />
        </div>
      )}

      {deal.state === 'upcoming' && <UnitDetails />}
      <LimitedTimeDeal deal={deal} dh={Dh} notified={notified} onNotify={onNotify} {...DEAL} />
      {deal.state !== 'upcoming' && <UnitDetails />}

      <div className="coupons">
        <span className="coupon">
          <CouponIcon /> Extra 15%, CODE: ENDD15
        </span>
        <span className="coupon">
          <CouponIcon /> Extra 10% o
        </span>
      </div>

      {/* inert — used to open the "Bestseller in Chargers" PLP, now removed */}
      <button className="bestseller">
        <span className="bs-badge">
          <svg viewBox="0 0 16 16" aria-hidden><path fill="#1d2539" d="M8 0l1.6 1.2 2-.2.9 1.8 1.8.9-.2 2L15.9 8l-1.2 1.6.2 2-1.8.9-.9 1.8-2-.2L8 15.9l-1.6-1.2-2 .2-.9-1.8-1.8-.9.2-2L.1 8l1.2-1.6-.2-2 1.8-.9.9-1.8 2 .2z"/></svg>
          <span className="bs-badge-num">1</span>
        </span>
        <span className="bs-txt">Bestseller #1 in <a>Chargers</a></span>
        <Chev className="row-chev" />
      </button>
      </div>
    </section>
  )
}

function CouponIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="i-coupon">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="m8 16 8-8"/>
      <circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/>
    </svg>
  )
}

/* --------------------------------- Delivery -------------------------------- */
function Delivery() {
  return (
    <section className="card delivery">
      <div className="delivery-head">
        <h3>Delivery Information</h3>
        <span className="one-badge"><span className="one-pill">one</span> member</span>
      </div>
      <div className="delivery-express">
        <span className="express-pill">express</span>
        <span>Get it <b>Tomorrow before 12 PM</b></span>
      </div>
      <button className="row-item other-delivery">
        <span>Other Delivery Options</span>
        <Chev className="row-chev down" />
      </button>
    </section>
  )
}

/* ------------------------------ Payment offers ----------------------------- */
const PAY_OFFERS = [
  { img: '/pdp/icons/pay-noon-card.png', kind: 'card', inline: true },
  { img: '/pdp/icons/save-tabby.png', kind: 'logo', title: 'Get extra 5% cashback', sub: 'on using ENBD noon VISA credit card' },
  { img: '/pdp/icons/save-tamara.png', kind: 'logo', title: 'Split your payment in 4', sub: 'Pay zero interest on 4 instalments' },
]
function PaymentOffers() {
  return (
    <section className="card pay-offers">
      <h3 className="po-title">Payment offers</h3>
      <div className="po-rail">
        {PAY_OFFERS.map((o, i) => (
          <div className="po-card" key={i}>
            <span className={`po-icon po-icon-${o.kind}`}><img src={o.img} alt="" /></span>
            {o.inline ? (
              <p className="po-desc"><b>Get extra 5% cashback</b> using ENBD noon VISA credit card <a className="po-cta">Apply Now</a></p>
            ) : (
              <div className="po-stack">
                <p className="po-h">{o.title}</p>
                <p className="po-sub">{o.sub}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Variant picker ----------------------------- */
const VP_COLOURS = [
  { name: '735 GaN', img: '/pdp/anker-charger.png' },
  { name: '735 GaN II', img: '/pdp/pab-wallcharger.jpg' },
  { name: '736 GaN II', img: '/pdp/pab-anker737.png' },
  { name: '736 GaN', img: '/pdp/pab-powerbank.png', oos: true },
]
function VariantPicker() {
  const [version, setVersion] = useState('UK 3 PIN')
  const [model, setModel] = useState('UK 3 PIN')
  const [colour, setColour] = useState('735 GaN II')
  return (
    <section className="card variant-picker">
      <div className="vp-group">
        <div className="vp-head">
          <h3 className="vp-title">Versions</h3>
          <button className="vp-link"><InfoDot /> Learn more</button>
        </div>
        <div className="vp-chips">
          {['UK 3 PIN', 'US 2 PIN'].map((v) => (
            <button key={v} className={`vp-chip${version === v ? ' on' : ''}`} onClick={() => setVersion(v)}>{v}</button>
          ))}
        </div>
      </div>
      <div className="vp-group">
        <div className="vp-head">
          <h3 className="vp-title">Charger Model</h3>
          <button className="vp-link">Size Guide <Chev className="row-chev" /></button>
        </div>
        <div className="vp-chips">
          {['UK 3 PIN', 'US 2 PIN'].map((v) => (
            <button key={v} className={`vp-chip${model === v ? ' on' : ''}`} onClick={() => setModel(v)}>{v}</button>
          ))}
        </div>
      </div>
      <div className="vp-group">
        <div className="vp-head">
          <h3 className="vp-title">Colour</h3>
          <button className="vp-link vp-viewall">View All</button>
        </div>
        <div className="vp-colours">
          {VP_COLOURS.map((c) => (
            <button
              key={c.name}
              className={`vp-colour${colour === c.name ? ' on' : ''}${c.oos ? ' oos' : ''}`}
              onClick={() => !c.oos && setColour(c.name)}
            >
              <span className="vp-colour-img">
                <img src={c.img} alt={c.name} />
                {c.oos && <span className="vp-oos">OUT OF STOCK</span>}
              </span>
              <span className="vp-colour-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Trustmarkers ------------------------------ */
function Trustmarkers() {
  const items = [
    { label: 'High\nRated', icon: '/pdp/icons/trust-return.svg' },
    { label: 'Low & Easy\nReturns', icon: '/pdp/icons/trust-verified.svg' },
    { label: 'Secure\nTransactions', icon: '/pdp/icons/trust-support.svg' },
  ]
  return (
    <section className="card trust-row">
      {items.map((it) => (
        <div className="trust-col" key={it.label}>
          <img className="trust-ico" src={it.icon} alt="" width="20" height="20" />
          <span className="trust-label">{it.label.split('\n').map((l, i) => <span key={i}>{l}</span>)}</span>
        </div>
      ))}
    </section>
  )
}

/* ----------------------------- Product details ----------------------------- */
function ProductDetails() {
  const rows = ['Overview', 'Highlights', 'Specifications']
  const [open, setOpen] = useState(null)
  return (
    <section className="card details">
      <h3 className="section-h">Product Details</h3>
      {rows.map((r) => (
        <div className="accordion" key={r}>
          <button className="accordion-head" onClick={() => setOpen(open === r ? null : r)}>
            <span>{r}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className={`acc-chev${open === r ? ' open' : ''}`}><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/></svg>
          </button>
          <AnimatePresence initial={false}>
            {open === r && (
              <motion.div className="accordion-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={MOTION}>
                <p>Compact 3-port GaN charger delivering up to 65W with PPS fast charging. Charge a MacBook Air, iPhone and AirPods simultaneously.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </section>
  )
}

/* --------------------------- Additional information -------------------------- */
function AdditionalInfo() {
  const rows = [
    { label: 'Not eligible for returns', icon: <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M3 8l4-4h10l4 4v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 8h18M9 12h6"/> },
    { label: 'Free delivery with Lockers & Pickup', icon: <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v16H5zM9 4v6l3-2 3 2V4"/> },
    { label: '1 year warranty applicable', icon: <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6zM9.5 12l1.8 1.8L15 10"/> },
  ]
  return (
    <section className="card add-info">
      <h3 className="section-h">Additional Information</h3>
      {rows.map((r) => (
        <button className="row-item info-row" key={r.label}>
          <span className="info-ico">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>{r.icon}</svg>
          </span>
          <span className="info-label">{r.label}</span>
          <Chev className="row-chev" />
        </button>
      ))}
    </section>
  )
}

/* ------------------------------- Seller widget ------------------------------ */
function SellerWidget() {
  const chips = ['Low Return Seller', 'Great Recent Ratings', 'Partner Since 5+ Years', 'Item as Described 100%']
  return (
    <section className="card seller">
      <div className="seller-head">
        <span className="seller-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden fill="currentColor"><path d="M16.4 12.6c0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.5 2 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.4-2c.7-1.1 1-2.1 1-2.2 0 0-1.9-.7-1.9-2.9zM14.5 6.4c.5-.7.9-1.6.8-2.5-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.4.9 0 1.8-.5 2.3-1.1z"/></svg>
        </span>
        <div className="seller-meta">
          <button className="seller-name">Sold by <b>Anker UAE Inc.</b> <Chev /></button>
          <div className="seller-rating">
            <span className="rstar">★</span> 4.3 <span className="rmuted">(128)</span>
            <span className="seller-pos"><b>74% Positive</b> Seller Ratings</span>
          </div>
        </div>
      </div>

      <div className="seller-chips">
        {chips.map((c) => (
          <span className="seller-chip" key={c}>
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 18.2l.9-5.5-4-3.9L9.5 8z"/></svg>
            {c === 'Item as Described 100%'
              ? <span>Item as Described <b className="emerald">100%</b></span>
              : <span>{c}</span>}
          </span>
        ))}
      </div>

      <button className="seller-offers">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="i-tag"><path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M3 11V4h7l10 10-7 7L3 11z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor"/></svg>
        <span>5 offers from other sellers from <span className="offers-price"><Dh />649</span></span>
        <Chev className="row-chev" />
      </button>
    </section>
  )
}

/* ------------------------------ Ratings & Reviews ----------------------------- */
const REVIEW_SUMMARY = [
  'The portrait mode includes a fantastic wide-angle',
  'Users appreciate the overall performance of phone.',
  'Enjoy the wide-angle capability while using portrait a fantastic wide-angle',
  'Users appreciate the overall performance of this phone.',
]
const REVIEW_PHOTOS = ['/pdp/icons/rev-photo-1.png', '/pdp/icons/rev-photo-2.png', '/pdp/icons/rev-photo-3.png', '/pdp/icons/rev-photo-1.png']
const TOP_REVIEWS = [
  {
    id: 'r1', name: 'John Anderson', stars: 4, verified: true, when: '8 days ago',
    specs: ['Mac OS', '8 GB RAM', 'Internal Version', '256 GB'],
    title: 'This is simply amazing!',
    body: 'If the camera had the wide angle feature in the portrait mode. If the camera has more fe..',
    more: 'More', helpful: 15, photos: ['/pdp/icons/rev-photo-1.png', '/pdp/icons/rev-photo-2.png'],
  },
  {
    id: 'r2', name: 'John Anderson', stars: 5, source: 'from trusted source', when: '6 months ago',
    specs: ['Mac OS', '8 GB RAM', 'Internal Version', '256 GB'],
    title: 'This is simply amazing!',
    body: 'If the camera had the wide angle feature in the portrait mode. If the camera has more fewer features than than the last one it will be worse better than others.',
    more: 'Less', helpful: 14, photos: ['/pdp/icons/rev-photo-1.png', '/pdp/icons/rev-photo-2.png'],
  },
]

function Stars({ value, size = 15 }) {
  return (
    <span className="rv-stars" aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className={i < value ? 'on' : ''}>
          <path fill="currentColor" d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 18.2l.9-5.5-4-3.9L9.5 8z"/>
        </svg>
      ))}
    </span>
  )
}

function Reviews() {
  return (
    <section className="card reviews">
      <h3 className="section-h">Ratings &amp; Reviews</h3>

      <div className="rv-summary-top">
        <span className="rv-score">4.8</span>
        <Stars value={5} size={20} />
        <button className="rv-info" aria-label="About ratings">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 11v5M12 8h.01"/></svg>
        </button>
      </div>
      <p className="rv-sub">Avg. rating based on 64 reviews from trusted sources</p>

      <button className="rv-ai">
        <span className="rv-ai-txt"><b>64 reviews</b>, summarised by <b className="rv-ai-noon">noon AI</b></span>
        <svg className="rv-ai-spark" width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/></svg>
      </button>
      <ul className="rv-bullets">
        {REVIEW_SUMMARY.map((t, i) => <li key={i}>{t}</li>)}
      </ul>

      <h4 className="rv-h">Photo Reviews (64)</h4>
      <div className="rv-photos">
        {REVIEW_PHOTOS.map((src, i) => <img key={i} src={src} alt="review" />)}
      </div>

      <h4 className="rv-h">Top Reviews (64)</h4>
      {TOP_REVIEWS.map((r) => (
        <div className="rv-card" key={r.id}>
          <div className="rv-card-head">
            <span className="rv-name">{r.name}</span>
            {r.verified && (
              <span className="rv-verified">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="10" fill="var(--emerald)"/><path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M7 12.5l3.2 3.2L17 9"/></svg>
                Verified Buy
              </span>
            )}
          </div>
          <div className="rv-card-sub">
            <Stars value={r.stars} />
            <span className="rv-when">{r.source ? `${r.source} · ${r.when}` : r.when}</span>
          </div>
          <div className="rv-specs">
            {r.specs.map((s) => <span className="rv-spec" key={s}>{s}</span>)}
          </div>
          <div className="rv-viewprod">
            <span>Dual core memory</span>
            <button className="rv-vp-link">View product <Chev className="rv-vp-chev" /></button>
          </div>
          <div className="rv-title">{r.title}</div>
          <p className="rv-body">{r.body} <span className="rv-more">{r.more}</span></p>
          <button className="rv-translate">Translate to <span className="rv-ar">عربي</span></button>
          <div className="rv-card-photos">
            {r.photos.map((src, i) => <img key={i} src={src} alt="review" />)}
          </div>
          <button className="rv-helpful">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM7 11l4-8a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>
            Helpful ({r.helpful})
          </button>
        </div>
      ))}

      <button className="rv-all">All customer reviews <Chev className="rv-all-chev" /></button>
    </section>
  )
}

/* --------------------------------- helpers --------------------------------- */
function Chev({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className={`chev ${className}`}>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6"/>
    </svg>
  )
}
