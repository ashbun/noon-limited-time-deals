import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Limited-time deal banner — Figma "PDP new features" node 22621:124565.
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

/* Design-review control, not product UI — floats over the gallery so you can
   flip states without hand-editing the URL. */
export function DealSwitcher() {
  const [scenario, setScenario] = useScenario()
  return (
    <div className="deal-switch" role="group" aria-label="Limited time deal state">
      <span className="deal-switch-label">Deal</span>
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
function formatCountdown(ms) {
  const total = Math.floor(ms / SECOND)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}: ${pad(Math.floor(total / 60) % 60)}: ${pad(total % 60)}`
}

export default function LimitedTimeDeal({ deal, price, was, off, dh: Dh }) {
  if (deal.state === 'ended') return null
  const live = deal.state === 'live'

  return (
    <div className={`ltd${live ? ' ltd--live' : ''}`}>
      <div className="ltd-head">
        <div className="ltd-head-left">
          <img className="ltd-ribbon" src="/pdp/icons/deal-ribbon.svg" alt="" width="163" height="30" />
          <img className="ltd-lock" src="/pdp/icons/deal-lock.svg" alt="" width="14" height="14" />
          <span className="ltd-label">Limited time deal</span>
        </div>
        <div className="ltd-head-right">
          {live && <img className="ltd-clock" src="/pdp/icons/deal-clock.svg" alt="" width="14" height="14" />}
          <span className="ltd-timer">
            {live ? 'Ending in' : 'Unlocking in'}{' '}
            <b>{formatCountdown(deal.remaining)}</b>
          </span>
        </div>
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
            {live && <span className="ltd-now"><Dh />{price}</span>}
            <span className="ltd-was"><Dh />{was}</span>
            <span className="ltd-off">{off}% OFF</span>
            {live && <span className="ltd-vat">(incl. of VAT)</span>}
          </span>
        </div>
        {!live && (
          <button className="ltd-notify" type="button">
            <img src="/pdp/icons/deal-bell.svg" alt="" width="20" height="20" />
            Notify me
          </button>
        )}
      </div>
    </div>
  )
}
