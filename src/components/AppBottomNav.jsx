import { useNavigate } from 'react-router-dom'
import './AppBottomNav.css'

// The app's five-tab bar. Shared by the homepage, the listing and the product
// page, so there is one copy rather than a duplicate per page.
//
// Home is the way back to the iteration chooser — this prototype has no account,
// cart or category screens, so the other four stay inert rather than pretending
// to lead somewhere.
//
// Icons still live under /pdp/icons/bottom-nav; they were added there before
// this was shared and moving them would break the PDP's committed paths.

const ITEMS = [
  { label: 'Home', icon: '/pdp/icons/bottom-nav/home.svg', selected: true, to: '/' },
  { label: 'Categories', icon: '/pdp/icons/bottom-nav/categories.svg' },
  { label: 'Deals', icon: '/pdp/icons/bottom-nav/deals.svg' },
  { label: 'Account', icon: '/pdp/icons/bottom-nav/account.svg' },
  { label: 'Cart', icon: '/pdp/icons/bottom-nav/cart.svg' },
]

export default function AppBottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="app-bottomnav" aria-label="Main navigation">
      {ITEMS.map(({ label, icon, selected, to }) => (
        <button
          className={`app-bottomnav-item${selected ? ' app-bottomnav-item--selected' : ''}`}
          type="button"
          aria-current={selected ? 'page' : undefined}
          aria-label={to ? `${label} — back to iteration chooser` : label}
          key={label}
          onClick={to ? () => navigate(to) : undefined}
        >
          <span className="app-bottomnav-indicator" aria-hidden="true">
            {selected
              ? <img src="/pdp/icons/bottom-nav/home-indicator.svg" alt="" width="43" height="4" />
              : null}
          </span>
          <span className="app-bottomnav-content">
            <img className="app-bottomnav-icon" src={icon} alt="" width="32" height="32" />
            <span className="app-bottomnav-label">{label}</span>
          </span>
        </button>
      ))}
    </nav>
  )
}
