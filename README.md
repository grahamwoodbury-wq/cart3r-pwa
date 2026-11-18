# CART3R PWA 14.0

This is the iPhone-installable web interface for the CART3R 13 backend. It is a PWA, not an App Store app.

## What it does
- Chat interface connected to `POST /agent/run` using `{ "objective": "..." }`.
- Connection check at `GET /health`.
- Loads notes, tasks and approval proposals from the existing backend.
- Approval buttons only record a decision. They do not execute an external action.
- Offline shell caching; AI requests still need an internet connection.

## Publish it
1. Extract this ZIP.
2. Upload the contents of `CART3R_PWA_14` to a static HTTPS host that supports static sites.
3. Deploy the existing CART3R backend separately over HTTPS.
4. Configure the backend's `CART3R_ALLOWED_ORIGINS` environment variable to the exact website origin, e.g. `https://your-site.example` (no trailing slash). Keep `CART3R_API_TOKEN` private.
5. Open the published site in Safari on iPhone.
6. Tap Share → Add to Home Screen.
7. Open CART3R → Settings. Enter the backend HTTPS URL and access token, then save and test.

## Security
- Never put your OpenAI API key in this website. It belongs only on the backend.
- Do not publish the backend token in public code, screenshots, or messages.
- The backend token is held in `sessionStorage` for the current browser session; the backend URL is saved in `localStorage`.
- Use a unique strong backend token and HTTPS only.
- This starter is intended for personal testing. Before public use, add stronger user authentication, rate limiting, server-side secret rotation, and production monitoring.
- The existing backend's approval endpoint records a decision only; it does not run the requested external action.

## Compatibility
Requires a static HTTPS host for installation as a PWA. iPhone Safari is the recommended install path. The app shell can open offline after first load, but backend features cannot.
