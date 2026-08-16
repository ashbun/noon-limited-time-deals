import { Navigate, Route, Routes } from 'react-router-dom'
import { Retune } from 'retune'
import PdpPage from './pages/pdp'
import PlpPage from './pages/plp'

// Adding a page: drop it in src/pages/<name>/ and add a <Route> below.
// `/` forwards to the listing, which is the entry point — tapping a card there
// opens the PDP in the deal state that card was showing.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/plp" replace />} />
        <Route path="/plp" element={<PlpPage />} />
        <Route path="/pdp" element={<PdpPage />} />
        <Route path="*" element={<Navigate to="/plp" replace />} />
      </Routes>
      <Retune />
    </>
  )
}
