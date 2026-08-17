import { useEffect, useRef, useState } from 'react'
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

export function useLimitedTimeDeal() {
  const [scenario] = useScenario()
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

/* "01: 20: 24" — the spaced format the design uses. Hours are uncapped so a
   multi-day deal reads 52: 30: 00 rather than silently wrapping. */
export function formatCountdown(ms) {
  const total = Math.floor(ms / SECOND)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}: ${pad(Math.floor(total / 60) % 60)}: ${pad(total % 60)}`
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

function buildDigitReel(start, end) {
  const startDigit = Number(start)
  const endDigit = Number(end)
  // Matching digits that are animated elsewhere in the price still travel
  // through one complete reel so every animated column has visible movement.
  const transitions = startDigit === endDigit
    ? 10
    : (startDigit - endDigit + 10) % 10

  return Array.from(
    { length: transitions + 1 },
    (_, step) => String((startDigit - step + 10) % 10),
  )
}

// rowHeight is the reel's row pitch. The travel distance is derived from it,
// so the two must always agree — the reveal renders at 40px and would land
// between digits if CSS resized the rows on its own.
function AnimatedDealPrice({ price, dh: Dh, rowHeight = 28 }) {
  const finalPrice = String(price)
  let reelIndex = -1

  return (
    <span className="ltd-now ltd-price-slot" style={{ '--slot-row': `${rowHeight}px` }}>
      <span className="ltd-price-slot-label"><Dh />{price}</span>
      <span className="ltd-price-slot-visual" aria-hidden="true">
        <Dh />
        {[...finalPrice].map((end, index) => {
          if (!/\d/.test(end)) {
            return <span className="ltd-price-decimal" key={`${end}-${index}`}>{end}</span>
          }

          const start = INITIAL_DEAL_PRICE[index] ?? end
          const isUnchangedLeadingDigit = index === 0 && start === end
          if (isUnchangedLeadingDigit) {
            return <span className="ltd-price-static-digit" key={`${index}-${end}`}>{end}</span>
          }

          reelIndex += 1
          const digits = buildDigitReel(start, end)
          const transitions = digits.length - 1
          const style = {
            '--slot-delay': `${600 + reelIndex * 45}ms`,
            '--slot-duration': `${500 + transitions * 75}ms`,
            '--slot-distance': `${transitions * -rowHeight}px`,
          }

          return (
            <span className="ltd-price-digit" style={style} key={`${index}-${start}-${end}`}>
              <span className="ltd-price-digit-track">
                {digits.map((digit, step) => <span key={`${digit}-${step}`}>{digit}</span>)}
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}

export default function LimitedTimeDeal({ deal, price, regular, upcomingWas, liveWas, off, save, dh: Dh, notified, onNotify }) {
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
            <AnimatedDealPrice price={price} dh={Dh} />
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

const REVEAL_DELAY = 400
// Long enough for the reel to land (its slowest column finishes ~2.0s in) plus
// a beat to actually read the number before it clears.
const REVEAL_VISIBLE = 2600

// Module scope, deliberately not sessionStorage: this resets on every page load
// so a refresh replays the reveal, while still holding across SPA navigation so
// hopping between cards within one load doesn't repeat it.
let revealShownThisLoad = false

export function useDealReveal(active) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active || revealShownThisLoad) return undefined

    // Flag on show, not on effect run. StrictMode mounts effects twice in dev;
    // flagging up front meant the second run saw it as shown and the reveal
    // never appeared at all.
    const show = setTimeout(() => {
      revealShownThisLoad = true
      setVisible(true)
    }, REVEAL_DELAY)
    const hide = setTimeout(() => setVisible(false), REVEAL_DELAY + REVEAL_VISIBLE)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [active])

  return visible
}

export function DealRevealModal({ price, remaining, dh: Dh }) {
  return (
    <div className="deal-reveal" role="status" aria-live="polite" data-testid="deal-reveal">
      {/* ltd--in-view is what arms the digit reel, so the card carries it */}
      <div className="deal-reveal-card ltd--in-view">
        <span className="deal-reveal-tab" aria-hidden="true">
          <img className="deal-reveal-notch deal-reveal-notch--l" src="/pdp/icons/reveal-notch-l.svg" alt="" />
          <img className="deal-reveal-tab-bg" src="/pdp/icons/reveal-tab.svg" alt="" />
          <img className="deal-reveal-notch deal-reveal-notch--r" src="/pdp/icons/reveal-notch-r.svg" alt="" />
          <span className="deal-reveal-tab-content">
            <span className="ltd-ico ltd-ico--16"><img src="/pdp/icons/reveal-bolt.svg" alt="" /></span>
            <span className="deal-reveal-tab-label">Limited time deal</span>
          </span>
        </span>

        <span className="deal-reveal-price">
          <AnimatedDealPrice price={price} dh={Dh} rowHeight={40} />
        </span>

        <span className="deal-reveal-foot">
          <i className="deal-reveal-rule" aria-hidden="true" />
          <span className="deal-reveal-timer">
            <span className="ltd-ico ltd-ico--16"><img src="/pdp/icons/reveal-timelapse.svg" alt="" /></span>
            Ending in <b>{formatCountdown(remaining)}</b>
          </span>
          <i className="deal-reveal-rule" aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}
