import './AppBottomNav.css'

// The app's five-tab bar. Shared by the PDP and the PLP, so there is one copy
// rather than a duplicate per page. Tabs are inert — this prototype only has
// the listing and the product page.
//
// Icons still live under /pdp/icons/bottom-nav; they were added there before
// this was shared and moving them would break the PDP's committed paths.

const ITEMS = [
  { label: 'Home', icon: '/pdp/icons/bottom-nav/home.svg', selected: true },
  { label: 'Categories', icon: '/pdp/icons/bottom-nav/categories.svg' },
  { label: 'Deals', icon: '/pdp/icons/bottom-nav/deals.svg' },
  { label: 'Account', icon: '/pdp/icons/bottom-nav/account.svg' },
  { label: 'Cart', icon: '/pdp/icons/bottom-nav/cart.svg' },
]

export default function AppBottomNav() {
  return (
    <nav className="app-bottomnav" aria-label="Main navigation">
      {ITEMS.map(({ label, icon, selected }) => (
        <button
          className={`app-bottomnav-item${selected ? ' app-bottomnav-item--selected' : ''}`}
          type="button"
          aria-current={selected ? 'page' : undefined}
          key={label}
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
