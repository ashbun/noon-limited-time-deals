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
  const digits = [start]
  let current = Number(start)

  do {
    current = (current + 9) % 10
    digits.push(String(current))
  } while (String(current) !== end)

  return digits
}

function AnimatedDealPrice({ price, dh: Dh }) {
  const finalPrice = String(price)
  let reelIndex = -1

  return (
    <span className="ltd-now ltd-price-slot">
      <span className="ltd-price-slot-label"><Dh />{price}</span>
      <span className="ltd-price-slot-visual" aria-hidden="true">
        <Dh />
        {[...finalPrice].map((end, index) => {
          if (!/\d/.test(end)) {
            return <span className="ltd-price-decimal" key={`${end}-${index}`}>{end}</span>
          }

          reelIndex += 1
          const start = INITIAL_DEAL_PRICE[index] ?? end
          const digits = buildDigitReel(start, end)
          const transitions = digits.length - 1
          const style = {
            '--slot-delay': `${1000 + reelIndex * 45}ms`,
            '--slot-duration': `${500 + transitions * 75}ms`,
            '--slot-distance': `${transitions * -28}px`,
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

export default function LimitedTimeDeal({ deal, price, upcomingWas, liveWas, off, dh: Dh, notified, onNotify }) {
  const [widgetRef, inView] = useViewportPresence()
  const live = deal.state === 'live'
  if (deal.state === 'ended') return null
  const was = live ? liveWas : upcomingWas

  const timer = (
    <>
      <span className="ltd-ico ltd-ico--14">
        <img src={live ? '/pdp/icons/deal-timelapse.svg' : '/pdp/icons/deal-lock-purple.svg'} alt="" />
      </span>
      <span className="ltd-timer">
        {live ? 'Ending in' : 'Unlocks in'}{' '}
        <b>{formatCountdown(deal.remaining)}</b>
      </span>
    </>
  )

  return (
    <div ref={widgetRef} className={`ltd${live ? ' ltd--live' : ''}${inView ? ' ltd--in-view' : ''}`}>
      <div className="ltd-head">
        <div className="ltd-head-left">
          <img className="ltd-ribbon" src="/pdp/icons/deal-ribbon.svg" alt="" width="164" height="30" />
          <span className="ltd-shimmer" aria-hidden="true" />
          <span className="ltd-head-left-inner">
            <span className="ltd-ico ltd-ico--14">
              <img src="/pdp/icons/deal-bolt.svg" alt="" />
            </span>
            <span className="ltd-label">Limited time deal</span>
          </span>
        </div>
        <div className="ltd-head-right">{timer}</div>
      </div>

      <div className="ltd-body">
        {/* The two states split the price differently: live gives it its own
            headline row, upcoming keeps it inline after the label. */}
        <div className="ltd-price">
          <span className="ltd-price-head">
            <span className="ltd-price-label">Deal price{live ? '' : ':'}</span>
            {!live && <span className="ltd-now"><Dh />{price}</span>}
          </span>
          <span className="ltd-price-figures">
            {live && <AnimatedDealPrice price={price} dh={Dh} />}
            <span className="ltd-was"><Dh />{was}</span>
            <span className="ltd-off">{off}% OFF</span>
            {live && <span className="ltd-vat">(incl. of VAT)</span>}
          </span>
        </div>
        {!live && (
          <button
            className={`ltd-notify${notified ? ' ltd-notify--notified' : ''}`}
            type="button"
            data-testid="widget-notify"
            disabled={notified}
            onClick={onNotify}
          >
            <span className="ltd-ico ltd-ico--20">
              <img src={notified ? '/pdp/icons/deal-bell-notified.svg' : '/pdp/icons/deal-bell.svg'} alt="" />
            </span>
            {notified ? 'Notified' : 'Notify me'}
          </button>
        )}
      </div>
    </div>
  )
}
