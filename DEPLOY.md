# Deploying nook (Netlify + PWABuilder)

## Netlify
1. Push this folder to a git repo (or `npm install && npm run build`, then drag the `dist` folder into Netlify).
2. Netlify reads `netlify.toml`: build `npm run build`, publish `dist`, Node 22.
   `VITE_BASE44_APP_ID` is already set there. Routing (`public/_redirects`) and cache headers (`public/_headers`) ship inside `dist`.
3. After the first deploy, open the site once online. The service worker then caches the app so it opens offline.

## PWABuilder
Enter the Netlify URL. It reads `/manifest.json` (icons in `/icons`, `/favicon-32.png`, `/apple-touch-icon-180.png`) and `/sw.js` (offline).
The Windows tile images from your package are in `public/icons/windows` and listed in `browserconfig.xml`.
Optional: add 1-3 screenshots to the manifest for a richer install prompt.

## Backend (Base44)
- Deploy the new `base44/entities/CoinGrant.jsonc` (same way you deploy the other entities) so developer coins sync to the account.
  Until then they are kept on the device and still count towards the balance.
- Password-reset emails link to the domain set for the app inside Base44. Point that at your Netlify domain
  (or the link opens the Base44-hosted copy of the app).
- The 6-digit login code uses the `authCode` function and the built-in email sender.

## Local
`npm install`, `npm run dev`. The service worker only registers in a production build.
