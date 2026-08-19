import { createContext, useContext, useMemo, useState } from 'react'

// Which iteration of the deal flow the prototype is showing. Chosen once on the
// start screen and read by every page, so the whole journey stays in one
// iteration rather than each surface deciding for itself.
//
//   1  Limited time deal — the orange widget, the reveal modal, the sticky bar
//   2  Flash sale — a floating pill while the deal is locked, an inline block
//      once it is running
//
// Held in context so pages don't have to thread it through every navigate(), and
// mirrored into sessionStorage so a refresh or a deep link into /pdp stays in the
// iteration you picked. sessionStorage rather than localStorage: a new tab should
// start at the chooser rather than inheriting an old session's answer.
const STORAGE_KEY = 'noon:variant'

const VariantContext = createContext({ variant: 1, setVariant: () => {} })

function readStored() {
  const stored = Number(sessionStorage.getItem(STORAGE_KEY))
  return stored === 2 ? 2 : 1
}

export function VariantProvider({ children }) {
  const [variant, setVariantState] = useState(readStored)

  const value = useMemo(() => ({
    variant,
    setVariant: (next) => {
      sessionStorage.setItem(STORAGE_KEY, String(next))
      setVariantState(next)
    },
  }), [variant])

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>
}

export function useVariant() {
  return useContext(VariantContext)
}

/* True when the flash-sale iteration is active — reads better at call sites than
   comparing numbers. */
export function useIsFlashSale() {
  return useVariant().variant === 2
}
