import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Retune } from 'retune'
import HomePage from './pages/home'
import PdpPage from './pages/pdp'
import PlpPage from './pages/plp'
import StartPage from './pages/start'
import { VariantProvider } from './variant'

// Adding a page: drop it in src/pages/<name>/ and add a <Route> below.
// `/` is the iteration chooser; picking one lands you on the homepage. The flow
// then runs home → listing → product, and each step's back control returns to the
// last. Which iteration is showing lives in VariantProvider, so pages read it
// from context instead of every navigate() having to carry it.

// Pages cross-fade on navigation. The outgoing page fades while the incoming
// one fades in over it, so the phone frame never flashes empty between routes.
const FADE = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

function Page({ children }) {
  return (
    <motion.div
      className="page-fade"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <>
      {/* The keyed wrapper goes *outside* Routes. Keying Routes itself made
          AnimatePresence rebuild the tree on ordinary re-renders, which threw
          away in-page state — the deal reveal's timers among it. */}
      <VariantProvider>
        <AnimatePresence initial={false}>
          <Page key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<StartPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/plp" element={<PlpPage />} />
              <Route path="/pdp" element={<PdpPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Page>
        </AnimatePresence>
      </VariantProvider>
      <Retune />
    </>
  )
}
