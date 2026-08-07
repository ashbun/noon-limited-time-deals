import { Navigate, Route, Routes } from 'react-router-dom'
import { Retune } from 'retune'
import PdpPage from './pages/pdp'

// Adding a page: drop it in src/pages/<name>/ and add a <Route> below.
// `/` currently forwards to the PDP because it's the only page — point it at
// the homepage once that exists.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/pdp" replace />} />
        <Route path="/pdp" element={<PdpPage />} />
        <Route path="*" element={<Navigate to="/pdp" replace />} />
      </Routes>
      <Retune />
    </>
  )
}
