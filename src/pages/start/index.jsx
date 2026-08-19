import { useNavigate } from 'react-router-dom'
import { useVariant } from '../../variant'
import './styles.css'

// Entry screen: pick which iteration of the deal flow to walk through. The choice
// is held for the session, so every page after this one — homepage, listing,
// product — shows the same iteration.
const OPTIONS = [
  {
    id: 1,
    name: 'Limited time deal',
    blurb: 'The orange deal widget, the price-reveal modal on opening a live deal, and the sticky bar as you scroll past.',
    points: ['Orange “Limited time deal” ribbon', 'Reveal modal drops the price', 'Locked state teases the deal price'],
  },
  {
    id: 2,
    name: 'Flash sale',
    blurb: 'The same journey with flash-sale touchpoints: a floating pill counting down while the deal is locked, and an inline block once it is running.',
    points: ['Floating pill while locked', 'Inline block once live', 'Countdown in digit boxes'],
    note: 'PDP done — listing and homepage still on iteration 1',
  },
]

export default function StartPage() {
  const navigate = useNavigate()
  const { variant, setVariant } = useVariant()

  const choose = (id) => {
    setVariant(id)
    navigate('/home')
  }

  return (
    <div className="stage">
      <div className="phone start">
        <div className="start-head">
          <p className="start-eyebrow">noon · deal prototypes</p>
          <h1 className="start-title">Choose an iteration</h1>
          <p className="start-sub">Both run the full flow — homepage, listing, product.</p>
        </div>

        <div className="start-options">
          {OPTIONS.map((option) => (
            <button
              className={`start-option${variant === option.id ? ' is-current' : ''}`}
              type="button"
              key={option.id}
              onClick={() => choose(option.id)}
            >
              <span className="start-option-head">
                <span className="start-option-num">Option {option.id}</span>
                {variant === option.id && <span className="start-option-current">last used</span>}
              </span>
              <span className="start-option-name">{option.name}</span>
              <span className="start-option-blurb">{option.blurb}</span>
              <span className="start-option-points">
                {option.points.map((point) => <span key={point}>{point}</span>)}
              </span>
              {option.note && <span className="start-option-note">{option.note}</span>}
            </button>
          ))}
        </div>

        <p className="start-foot">Tap Home in the bottom bar on any page to come back here.</p>
      </div>
    </div>
  )
}
