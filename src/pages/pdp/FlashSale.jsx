import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { countdownParts } from './LimitedTimeDeal'

// Iteration 2's deal touchpoints — Figma "PDP new features" 23341:384237 (locked)
// and 23328:376229 (live). Where iteration 1 puts one orange widget in the info
// card for both states, this iteration splits them:
//
//   live    an inline cream block in the info card: FLASH SALE, the price, the
//           saving, and an "Ends in" countdown
//   locked  the info card keeps a plain price row and the deal floats instead —
//           a dark pill above the bottom bar counting down to the unlock, with
//           the reminder bell on it
//
// The countdown digits sit in their own boxes in both, so they share one
// component; only the colours differ.

/* One box, rolling like an odometer: the settled digit slides up and out while
   the next rises from below, 1px apart. Only boxes whose value actually changed
   roll, so the seconds tick every second while the hours sit still. */
function OdometerDigit({ value }) {
  // The settled value is a ref so the effect depends on `value` alone. Depending
  // on the rendered value too meant the effect re-ran the moment it set that
  // value, and its cleanup cancelled its own settle — leaving the outgoing digit
  // in the DOM for good.
  const settled = useRef(value)
  const [shown, setShown] = useState(value)
  const [outgoing, setOutgoing] = useState(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (value === settled.current) return
    // Nothing to roll when motion is reduced — swap and be done.
    if (!reduceMotion) setOutgoing(settled.current)
    settled.current = value
    setShown(value)
  }, [value, reduceMotion])

  return (
    <span className="fs-digit">
      {/* Keyed on the new value so each change mounts a fresh track — re-adding a
          class to the existing element would not replay a finished animation.
          The outgoing cell is dropped on animationend rather than on a timer, so
          the DOM and the animation can't disagree about when the roll is over. */}
      <span
        className={`fs-digit-track${outgoing === null ? '' : ' is-rolling'}`}
        key={shown}
        // Only the track's own roll settles the box. The outgoing cell's darkening
        // animation bubbles its animationend up here too, and letting that clear
        // the cell cut the roll short.
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setOutgoing(null)
        }}
      >
        {/* Keyed so React keeps them as distinct elements. Unkeyed, dropping the
            outgoing cell made React reuse its DOM node for the arriving digit —
            which carried the finished darkening over with it and left the settled
            box black. */}
        {outgoing !== null && <span className="fs-digit-cell" key="outgoing">{outgoing}</span>}
        <span className="fs-digit-cell" key="current">{shown}</span>
      </span>
    </span>
  )
}

/* Three boxed digits, hours / minutes / seconds. */
function DigitBoxes({ remaining, tone }) {
  const parts = countdownParts(remaining)

  return (
    <span className={`fs-digits fs-digits--${tone}`}>
      {parts.map((part, index) => (
        // eslint-disable-next-line react/no-array-index-key -- position is the identity
        <OdometerDigit value={part} key={index} />
      ))}
    </span>
  )
}

/* The two-part wordmark, kept as separate exports because the locked pill uses
   the light version at 8px and the inline block uses the full lock-up at 16px. */
function FlashSaleMarkSplit() {
  return (
    <span className="fs-mark" aria-label="Flash sale">
      <img className="fs-mark-flash" src="/pdp/flash/logo-flash.svg" alt="" />
      <img className="fs-mark-sale" src="/pdp/flash/logo-sale.svg" alt="" />
    </span>
  )
}

/* ------------------------------- live, inline ------------------------------- */
export function FlashSaleInline({ price, was, off, remaining, dh: Dh }) {
  return (
    <div className="fs-inline">
      <div className="fs-inline-left">
        <img className="fs-inline-logo" src="/pdp/flash/logo-flashsale.svg" alt="Flash sale" />
        <div className="fs-inline-prices">
          <b className="fs-inline-price"><Dh />{price}</b>
          <s className="fs-inline-was">{was}</s>
          <i className="fs-inline-off">{off}% off</i>
        </div>
      </div>

      <div className="fs-timer fs-timer--live">
        <span className="fs-timer-label">
          <span className="fs-ico fs-ico--timelapse"><img src="/pdp/flash/timelapse.svg" alt="" /></span>
          Ends in
        </span>
        <DigitBoxes remaining={remaining} tone="live" />
      </div>
    </div>
  )
}

/* ----------------------------- locked, floating ----------------------------- */
/* Pinned above the bottom bar rather than placed in the flow, so it stays with
   you as the page scrolls — that's the point of it in the design. */
export function FlashSaleFloating({ price, off, remaining, notified, onNotify, dh: Dh }) {
  return (
    <div className="fs-float">
      <div className="fs-float-left">
        <FlashSaleMarkSplit />
        <span className="fs-float-prices">
          <b className="fs-float-price"><Dh />{price}</b>
          <i className="fs-float-off">{off}% off</i>
        </span>
      </div>

      <div className="fs-float-right">
        <div className="fs-timer fs-timer--locked">
          <span className="fs-timer-label">
            <span className="fs-ico fs-ico--lock"><img src="/pdp/flash/lock.svg" alt="" /></span>
            Unlocks in
          </span>
          <DigitBoxes remaining={remaining} tone="locked" />
        </div>

        <button
          className={`fs-float-bell${notified ? ' is-notified' : ''}`}
          type="button"
          data-testid="flash-notify"
          aria-label={notified ? 'Notification set' : 'Notify me'}
          disabled={notified}
          onClick={onNotify}
        >
          <img src="/pdp/flash/bell.svg" alt="" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* The plain price row the locked info card falls back to, since the deal itself
   has moved out to the floating pill. */
export function FlashSalePriceRow({ regular, off, dh: Dh }) {
  return (
    <div className="fs-plain">
      <span className="fs-plain-price"><Dh />{regular}</span>
      <span className="fs-plain-off">{off}% Off</span>
      <span className="fs-plain-vat">(incl. of VAT)</span>
    </div>
  )
}
