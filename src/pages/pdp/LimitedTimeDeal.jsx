import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'

// Limited-time deal banner — Figma "PDP new features" node 22627:19400.
//
// Two states, driven by the clock rather than a prop, so the widget behaves
// like the real thing:
//   upcoming — deal hasn't started; header counts down to `startsAt` ("Unlocking
//              in") and offers a Notify me CTA. The page's normal price row
//              stays visible, because the deal price isn't in effect yet.
//   live     — deal is running; header counts down to `endsAt` ("Ending in") and
//              the banner carries the price itself, so the page hides its normal
//              price row (matches the Figma, where that row is toggled off).
// Past `endsAt` the deal is 'ended' and the caller drops the banner entirely.
//
// Which one you see is held in the URL (?deal=live | ?deal=upcoming) and driven
// by the floating DealSwitcher, so a given state is also shareable as a link.

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

// Seeded to land on the timings shown in the Figma the moment the page loads.
const SCENARIOS = {
  live: { startsAt: -5 * MINUTE, endsAt: 1 * HOUR + 10 * MINUTE + 24 * SECOND },
  upcoming: { startsAt: 1 * HOUR + 20 * MINUTE + 24 * SECOND, endsAt: 3 * HOUR },
}

/* Ticks once a second. One interval drives both the state and the readout. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), SECOND)
    return () => clearInterval(id)
  }, [])
  return now
}

function useScenario() {
  const [params, setParams] = useSearchParams()
  const scenario = params.get('deal') === 'upcoming' ? 'upcoming' : 'live'
  const setScenario = (next) => {
    const q = new URLSearchParams(params)
    q.set('deal', next)
    setParams(q, { replace: true })
  }
  return [scenario, setScenario]
}

/* scenarioOverride lets a caller ask for a specific state regardless of the URL —
   the homepage's deal band shows a running deal and an unopened one side by side,
   so the two cards can't both take their state from `?deal=`. */
export function useLimitedTimeDeal(scenarioOverride) {
  const [urlScenario] = useScenario()
  const scenario = scenarioOverride ?? urlScenario
  const now = useNow()

  // The offsets above are relative to an anchor, so the countdown actually runs
  // down. Re-anchoring on every switch means each flip restarts the timer from
  // the top — otherwise a long review session would run a scenario out and the
  // banner would vanish the moment you selected it.
  const [anchor, setAnchor] = useState(() => ({ scenario, at: Date.now() }))
  if (anchor.scenario !== scenario) setAnchor({ scenario, at: Date.now() })

  const { startsAt, endsAt } = SCENARIOS[anchor.scenario]
  const start = anchor.at + startsAt
  const end = anchor.at + endsAt
  const state = now < start ? 'upcoming' : now < end ? 'live' : 'ended'
  const remaining = Math.max(0, (state === 'upcoming' ? start : end) - now)

  return { state, remaining }
}

/* Design-review control, not product UI — lives in the top bar so you can flip
   states without hand-editing the URL. */
export function DealSwitcher() {
  const [scenario, setScenario] = useScenario()
  return (
    <div className="deal-switch" role="group" aria-label="Limited time deal state">
      {[
        ['live', 'Active'],
        ['upcoming', 'Inactive'],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`deal-switch-btn${scenario === value ? ' on' : ''}`}
          aria-pressed={scenario === value}
          onClick={() => setScenario(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/* [hh, mm, ss], for callers that style the separators themselves — the homepage's
   deal widget sets its colons in a lighter weight than the digits. Hours are
   uncapped so a multi-day deal reads 52 rather than silently wrapping. */
export function countdownParts(ms) {
  const total = Math.floor(ms / SECOND)
  const pad = (n) => String(n).padStart(2, '0')
  return [pad(Math.floor(total / 3600)), pad(Math.floor(total / 60) % 60), pad(total % 60)]
}

/* "01: 20: 24" — the spaced format the PDP and listing use. */
export function formatCountdown(ms) {
  return countdownParts(ms).join(': ')
}

function useViewportPresence() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.6 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

const INITIAL_DEAL_PRICE = '349.99'

// Reel timing. Columns start left-to-right REEL_STAGGER apart and — the point of
// this shape — LAND left-to-right too, each landing REEL_LAND_STAGGER after the
// column to its left. Deriving each column's duration from its travel distance
// instead meant the landing order fell out of whichever digit happened to have
// furthest to go, which read as random.
const REEL_DELAY = 600
const REEL_STAGGER = 45
const REEL_SPAN = 900
const REEL_LAND_STAGGER = 120

/* Ordered landings mean duration no longer scales with distance, so a column
   with only a step or two to travel would crawl. Every column laps until it has
   a comparable distance to cover, keeping the speeds within sight of each other. */
const MIN_TRANSITIONS = 6

function isReelColumn(price, index) {
  const end = String(price)[index]
  if (!/\d/.test(end)) return false
  const start = INITIAL_DEAL_PRICE[index] ?? end
  // A leading digit that isn't changing has nothing to show, so it stays put.
  return !(index === 0 && start === end)
}

function reelColumnCount(price) {
  return [...String(price)].filter((_, index) => isReelColumn(price, index)).length
}

/* reelIndex is the column's position among the reeling columns, left to right —
   which is what both the start and the landing are staggered by. */
function columnTiming(reelIndex, startDelay) {
  const delay = startDelay + reelIndex * REEL_STAGGER
  const land = startDelay + REEL_SPAN + reelIndex * REEL_LAND_STAGGER
  return { delay, duration: land - delay }
}

/* When the last column lands, measured from the moment the reel mounts.
   startDelay must match the one handed to the reel, or the reveal's hold drifts
   off the landing. */
export function reelDuration(price, startDelay = REEL_DELAY) {
  const count = reelColumnCount(price)
  if (!count) return 0
  const { delay, duration } = columnTiming(count - 1, startDelay)
  return delay + duration
}

function buildDigitReel(start, end) {
  const startDigit = Number(start)
  const endDigit = Number(end)
  // Matching digits that are animated elsewhere in the price still travel
  // through one complete reel so every animated column has visible movement.
  let transitions = startDigit === endDigit
    ? 10
    : (startDigit - endDigit + 10) % 10
  while (transitions < MIN_TRANSITIONS) transitions += 10

  return Array.from(
    { length: transitions + 1 },
    (_, step) => String((startDigit - step + 10) % 10),
  )
}

// rowHeight is the reel's row pitch. The travel distance is derived from it,
// so the two must always agree — the reveal renders at 40px and would land
// between digits if CSS resized the rows on its own.
function AnimatedDealPrice({ price, dh: Dh, rowHeight = 28, startDelay = REEL_DELAY }) {
  const finalPrice = String(price)
  // Each column overshoots its landing by a tenth of a row and eases back, so
  // the digits settle rather than stopping dead. The spare row appended below
  // each track is what shows through during that overshoot.
  const overshoot = Math.max(2, Math.round(rowHeight * 0.1))
  let reelIndex = -1

  return (
    <span
      className="ltd-now ltd-price-slot"
      style={{ '--slot-row': `${rowHeight}px`, '--slot-overshoot': `${-overshoot}px` }}
    >
      <span className="ltd-price-slot-label"><Dh />{price}</span>
      <span className="ltd-price-slot-visual" aria-hidden="true">
        <Dh />
        {[...finalPrice].map((end, index) => {
          if (!/\d/.test(end)) {
            return <span className="ltd-price-decimal" key={`${end}-${index}`}>{end}</span>
          }

          const start = INITIAL_DEAL_PRICE[index] ?? end
          if (!isReelColumn(price, index)) {
            return <span className="ltd-price-static-digit" key={`${index}-${end}`}>{end}</span>
          }

          reelIndex += 1
          const digits = buildDigitReel(start, end)
          const transitions = digits.length - 1
          const { delay, duration } = columnTiming(reelIndex, startDelay)
          const style = {
            '--slot-delay': `${delay}ms`,
            '--slot-duration': `${duration}ms`,
            '--slot-distance': `${transitions * -rowHeight}px`,
          }
          // Kept off `digits` so the landing distance and reelDuration()'s maths
          // stay based on the real transition count.
          const spare = String((Number(end) - 1 + 10) % 10)

          return (
            <span className="ltd-price-digit" style={style} key={`${index}-${start}-${end}`}>
              <span className="ltd-price-digit-track">
                {digits.map((digit, step) => <span key={`${digit}-${step}`}>{digit}</span>)}
                <span aria-hidden="true">{spare}</span>
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}

export default function LimitedTimeDeal({ deal, price, regular, upcomingWas, liveWas, off, save, dh: Dh, notified, onNotify, animatePrice = true }) {
  const [widgetRef, inView] = useViewportPresence()
  if (deal.state === 'ended') return null
  const live = deal.state === 'live'

  // Live keeps the ribbon header — that is what the shimmer runs along, and the
  // deal price under it is what the digit reel spins into.
  if (live) {
    return (
      <div ref={widgetRef} className={`ltd ltd--live${inView ? ' ltd--in-view' : ''}`}>
        <div className="ltd-head">
          <div className="ltd-head-left">
            <img className="ltd-ribbon" src="/pdp/icons/o-ribbon-active.svg" alt="" width="164" height="28" />
            <span className="ltd-shimmer" aria-hidden="true" />
            <span className="ltd-head-left-inner">
              <span className="ltd-ico ltd-ico--14"><img src="/pdp/icons/o-bolt.svg" alt="" /></span>
              <span className="ltd-label">Limited time deal</span>
            </span>
          </div>
          <div className="ltd-head-right">
            <span className="ltd-ico ltd-ico--14"><img src="/pdp/icons/o-timelapse.svg" alt="" /></span>
            <span className="ltd-timer">Ending in <b>{formatCountdown(deal.remaining)}</b></span>
          </div>
        </div>

        <div className="ltd-body">
          <div className="ltd-price-row">
            {/* The reveal overlay runs the drop itself. When it does, this price
                is already the discounted one from the first paint — reeling it
                here as well would replay the same animation behind the modal. */}
            {animatePrice
              ? <AnimatedDealPrice price={price} dh={Dh} />
              : <span className="ltd-now"><Dh />{price}</span>}
            <span className="ltd-save">Save <Dh />{save}</span>
          </div>
          <div className="ltd-subrow">
            <span className="ltd-before"><s><Dh />{liveWas}</s> Before deal</span>
            <span className="ltd-vat">(incl. of VAT)</span>
          </div>
        </div>
      </div>
    )
  }

  // Locked splits into two columns: today's price on the left, the deal being
  // held back on the right. No ribbon here, so no shimmer — the design drops it.
  return (
    <div ref={widgetRef} className={`ltd ltd--locked${inView ? ' ltd--in-view' : ''}`}>
      <div className="ltd-col ltd-col--regular">
        <span className="ltd-reg-price"><Dh />{regular}</span>
        <span className="ltd-reg-sub">
          <s><Dh />{upcomingWas}</s>
          <b>{off}% OFF</b>
        </span>
        <span className="ltd-vat">(incl. of VAT)</span>
      </div>

      <div className="ltd-col ltd-col--deal">
        <span className="ltd-deal-price"><Dh />{price}</span>
        <span className="ltd-save">Save extra <Dh />{save}</span>
        <span className="ltd-unlock">
          <span className="ltd-ico ltd-ico--14"><img src="/pdp/icons/o-lock-white.svg" alt="" /></span>
          <span className="ltd-unlock-text">Unlocks in <b>{formatCountdown(deal.remaining)}</b></span>
        </span>
        <button
          className={`ltd-bell${notified ? ' ltd-bell--notified' : ''}`}
          type="button"
          data-testid="widget-notify"
          aria-label={notified ? 'Notification set' : 'Notify me'}
          disabled={notified}
          onClick={onNotify}
        >
          <span className="ltd-ico ltd-ico--19"><img src="/pdp/icons/o-bell.svg" alt="" /></span>
        </button>
      </div>
    </div>
  )
}

/* --------------------------- Deal reveal overlay --------------------------- */
/* Figma 23048:82257. Opening a product on a running deal drops the price in
   front of you once, then gets out of the way so the PDP behind it reads as
   already discounted. Once per session, not per product — seeing it on every
   card would be a nuisance rather than a reveal. */

// How long the settled price stays up after the reel finishes.
const REVEAL_LINGER = 400
// The pre-deal price has to be readable, not just present: the card is legible
// from roughly 250ms (opacity full, near its resting place), so holding the reel
// to 520ms leaves a genuine 300ms to read Ð349.99 before it moves.
const REVEAL_REEL_DELAY = 520

// Module scope, deliberately not sessionStorage: this resets on every page load
// so a refresh replays the reveal, while still holding across SPA navigation so
// hopping between cards within one load doesn't repeat it.
let revealShownThisLoad = false

/* Returns { visible, ownsPrice }. ownsPrice latches true on the first render
   where the reveal is due, so the widget behind can paint the settled price
   immediately instead of reeling into it a second time. It stays true after the
   modal leaves — by then the price has already been revealed. */
export function useDealReveal(active, price) {
  // Both initialise from the render phase rather than flipping on a timer: the
  // modal has to be in the same painted frame as the PDP. Showing it a beat later
  // gave you a clear look at the undiscounted page first, which is the one thing
  // the reveal exists to prevent.
  const [visible, setVisible] = useState(() => active && !revealShownThisLoad)
  const [ownsPrice, setOwnsPrice] = useState(() => active && !revealShownThisLoad)
  if (!ownsPrice && active && !revealShownThisLoad) setOwnsPrice(true)

  useEffect(() => {
    // Gated on ownsPrice, not the module flag. The flag is set here, so a second
    // effect run — StrictMode does exactly that in dev — would read it as
    // already-shown and bail without ever scheduling the hide, leaving the modal
    // up for good. ownsPrice was latched during render, before the flag moved.
    if (!ownsPrice) return undefined

    revealShownThisLoad = true
    setVisible(true)
    const visibleFor = reelDuration(price, REVEAL_REEL_DELAY) + REVEAL_LINGER
    const hide = setTimeout(() => setVisible(false), visibleFor)
    return () => clearTimeout(hide)
  }, [ownsPrice])

  return { visible, ownsPrice }
}

export function DealRevealModal({ price, remaining, dh: Dh }) {
  const reduceMotion = useReducedMotion()

  // Rises up as though lifted off the card you tapped, then drops back down and
  // fades once the reel has landed. A spring rather than a tween: the slight
  // overshoot at the top of the travel is what stops the arrival reading as
  // snappy. Opacity gets its own tween — a spring would overshoot past 1 and
  // waste the first frames of the fade on a value the browser clamps anyway.
  const card = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
      initial: { opacity: 0, y: 88, scale: 0.94 },
      animate: { opacity: 1, y: 0, scale: 1 },
      // Leaving is not an arrival: it drops clean out of the frame on a steeply
      // accelerating curve rather than easing to a stop mid-air. 560px is past
      // the bottom of the tallest phone frame, and .phone clips it on the way.
      // Scale holds at 1 — shrinking would read as receding, not falling.
      exit: {
        opacity: 0,
        y: 560,
        transition: { duration: 0.34, ease: [0.7, 0, 0.84, 0] },
      },
    }

  return (
    <motion.div
      className="deal-reveal"
      role="status"
      aria-live="polite"
      data-testid="deal-reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Outlasts the card's fall, so the scrim doesn't take the falling card
      // with it before it has cleared the frame.
      exit={{
        opacity: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.32, delay: 0.06, ease: 'linear' },
      }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      {/* ltd--in-view is what arms the digit reel, so the card carries it */}
      <motion.div
        className="deal-reveal-card ltd--in-view"
        {...card}
        transition={reduceMotion
          ? { duration: 0 }
          : {
            type: 'spring',
            visualDuration: 0.52,
            bounce: 0.28,
            opacity: { type: 'tween', duration: 0.22, ease: 'linear' },
          }}
      >
        <span className="deal-reveal-tab" aria-hidden="true">
          <img className="deal-reveal-notch deal-reveal-notch--l" src="/pdp/icons/reveal-notch-l.svg" alt="" />
          <span className="deal-reveal-tab-art">
            <img className="deal-reveal-tab-bg" src="/pdp/icons/reveal-tab.svg" alt="" />
            <span className="deal-reveal-shimmer" />
          </span>
          <img className="deal-reveal-notch deal-reveal-notch--r" src="/pdp/icons/reveal-notch-r.svg" alt="" />
          <span className="deal-reveal-tab-content">
            <span className="ltd-ico ltd-ico--16"><img src="/pdp/icons/reveal-bolt.svg" alt="" /></span>
            <span className="deal-reveal-tab-label">Limited time deal</span>
          </span>
        </span>

        <span className="deal-reveal-price">
          <AnimatedDealPrice price={price} dh={Dh} rowHeight={40} startDelay={REVEAL_REEL_DELAY} />
        </span>

        <span className="deal-reveal-foot">
          <i className="deal-reveal-rule" aria-hidden="true" />
          <span className="deal-reveal-timer">
            <span className="ltd-ico ltd-ico--16"><img src="/pdp/icons/reveal-timelapse.svg" alt="" /></span>
            Ending in <b>{formatCountdown(remaining)}</b>
          </span>
          <i className="deal-reveal-rule" aria-hidden="true" />
        </span>
      </motion.div>
    </motion.div>
  )
}
