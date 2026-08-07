# noon — limited time deals

Prototype storefront for noon experimentation. Vite + React.

**Live:** https://noon-limited-time-deals.vercel.app

Deploys are manual — the Vercel project isn't connected to this repo, so
pushing here does not publish. To ship: `vercel deploy --prod`

```bash
npm install
npm run dev
```

## Pages

| Route  | Page                     |
| ------ | ------------------------ |
| `/pdp` | Product details          |
| `/`    | redirects to `/pdp`      |

The PDP is ported from [ashbun/noon-pdp-prototype](https://github.com/ashbun/noon-pdp-prototype),
trimmed to the product view alone — the cart sheet, checkout, payment and PLP
screens that shipped with it were removed. Its **Buy now**, **Add to cart** and
**Bestseller** controls are inert for that reason.

## Adding a page

1. Create `src/pages/<name>/index.jsx` (plus a `styles.css` beside it if needed).
2. Add a `<Route>` in [`src/App.jsx`](src/App.jsx).

Point `/` at the homepage once it exists, instead of redirecting to `/pdp`.

## Layout

- `src/index.css` — Noontree font, Field DS tokens, reset, and the `.stage` /
  `.phone` device frame every page renders inside. Shared; edit with care.
- `src/pages/<name>/` — one folder per page, styles alongside.
- `public/<name>/` — per-page static assets, so pages don't collide.

Pages are full-bleed below 480px and render as a centred 390px phone above it.
