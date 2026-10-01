# XERQO Frontend

React 19 + Vite + Tailwind CSS v4 + React Router. Static, responsive design for the XERQO storefront and admin panel.

```bash
npm install
npm run dev      # http://localhost:5173  ·  all pages: /design
npm run build
```

- Design tokens (colours, fonts) live in `src/index.css` under `@theme`.
- Fonts are self-hosted via Fontsource (Cormorant Garamond, DM Sans, Hind Siliguri for ৳).
- Product photos are in `public/images` (XERQO Facebook page photos + free-licence Unsplash photos).
- Mock data: `src/data/*.js`. API client: `src/lib/api.js` (`VITE_API_URL` in `.env`).
