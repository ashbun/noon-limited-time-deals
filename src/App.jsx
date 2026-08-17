import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Retune } from 'retune'
import PdpPage from './pages/pdp'
import PlpPage from './pages/plp'

// Adding a page: drop it in src/pages/<name>/ and add a <Route> below.
// `/` forwards to the listing, which is the entry point — tapping a card there
// opens the PDP in the deal state that card was showing.

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
      <AnimatePresence initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/plp" replace />} />
          <Route path="/plp" element={<Page><PlpPage /></Page>} />
          <Route path="/pdp" element={<Page><PdpPage /></Page>} />
          <Route path="*" element={<Navigate to="/plp" replace />} />
        </Routes>
      </AnimatePresence>
      <Retune />
    </>
  )
}
